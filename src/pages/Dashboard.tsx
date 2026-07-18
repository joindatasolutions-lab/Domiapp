import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock3,
  Hand,
  MapPinned,
  Package,
  Radio,
  RefreshCw,
  RotateCcw,
  Search
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAvailableOrders, useDomicilioCounters, useOrders } from '../hooks/useOrders'
import { cn, formatOrderNumber } from '../lib/utils'
import { api, type DomicilioContadores } from '../services/api'
import { useDeliveryStore } from '../store/deliveryStore'
import { Order, OrderStatus } from '../types'

type Tab = 'available' | 'assigned'

const orderPriority: Record<OrderStatus, number> = {
  SIN_ASIGNAR: 0,
  EN_RUTA: 1,
  ASIGNADO: 2,
  PENDIENTE: 2,
  RETRASADO: 3,
  ENTREGADO: 4
}

const statusLabel: Record<OrderStatus, string> = {
  SIN_ASIGNAR: 'DISPONIBLE',
  ASIGNADO: 'ASIGNADO',
  PENDIENTE: 'ASIGNADO',
  EN_RUTA: 'EN CAMINO',
  ENTREGADO: 'ENTREGADO',
  RETRASADO: 'URGENTE'
}

const statusTone: Record<OrderStatus, string> = {
  SIN_ASIGNAR: 'bg-slate-100 text-slate-700',
  ASIGNADO: 'bg-emerald-100 text-emerald-700',
  PENDIENTE: 'bg-emerald-100 text-emerald-700',
  EN_RUTA: 'bg-primary/10 text-primary',
  ENTREGADO: 'bg-emerald-100 text-emerald-700',
  RETRASADO: 'bg-rose-100 text-rose-700'
}

function nextDelivery(orders: Order[]) {
  return [...orders]
    .filter((order) => order.status !== 'ENTREGADO' && order.status !== 'SIN_ASIGNAR')
    .sort((a, b) => orderPriority[a.status] - orderPriority[b.status] || a.time.localeCompare(b.time))[0]
}

function visibleOrders(orders: Order[]) {
  return [...orders].sort((a, b) => orderPriority[a.status] - orderPriority[b.status] || a.time.localeCompare(b.time))
}

function mergeOrders(assignedOrders: Order[], availableOrders: Order[]) {
  const assignedIds = new Set(assignedOrders.map((order) => order.pedidoId ?? order.id))
  return [...availableOrders, ...assignedOrders.filter((order) => !assignedIds.has(order.pedidoId ?? order.id))]
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="h-16 animate-pulse rounded-2xl bg-white" />
      <div className="h-12 animate-pulse rounded-2xl bg-white" />
      <div className="h-96 animate-pulse rounded-2xl bg-white" />
    </div>
  )
}

function orderNote(order: Order) {
  if (order.notes) return order.notes
  if (order.status === 'RETRASADO') return 'Es sorpresa'
  return null
}

function orderNeighborhood(order: Order) {
  if (order.neighborhood) return order.neighborhood
  const parts = order.address.split(',').map((part) => part.trim()).filter(Boolean)
  return parts[1]
}

function isFallbackArrangementName(name?: string) {
  return !name || /^Pedido\s/i.test(name) || name === 'Arreglo sin especificar'
}

function orderArrangement(order: Order, items = order.items) {
  if (order.arrangement) return order.arrangement
  const item = items[0]
  if (!item || isFallbackArrangementName(item.name)) return null
  return item.name
}

function orderImage(order: Order, items = order.items) {
  return items.find((item) => item.image)?.image || '/logo.png'
}

function fallbackCounters(assignedOrders: Order[], availableOrders: Order[]): DomicilioContadores {
  return {
    asignados: assignedOrders.filter((order) => order.status === 'ASIGNADO' || order.status === 'PENDIENTE').length,
    enCamino: assignedOrders.filter((order) => order.status === 'EN_RUTA').length,
    entregados: assignedOrders.filter((order) => order.status === 'ENTREGADO').length,
    disponibles: availableOrders.length
  }
}

function availableFromAssigned(order: Order): Order {
  return {
    ...order,
    id: order.pedidoId ?? order.id,
    pedidoId: order.pedidoId ?? order.id,
    status: 'SIN_ASIGNAR',
    assignedAt: undefined,
    courierId: undefined
  }
}

function canReturnToAvailable(order: Order) {
  return order.status === 'ASIGNADO' || order.status === 'PENDIENTE' || order.status === 'RETRASADO'
}

function AvailableOrderArticle({
  order,
  note,
  isAssigning,
  onAssign
}: {
  order: Order
  note: string | null
  isAssigning: boolean
  onAssign: (order: Order) => void
}) {
  const items = order.items
  const arrangement = orderArrangement(order, items)
  const imageAlt = arrangement || formatOrderNumber(order.number)

  return (
    <article className="grid w-full grid-cols-[56px_minmax(0,1fr)] gap-3 border-t border-black/10 px-4 py-4 text-left">
      <img
        src={orderImage(order, items)}
        alt={imageAlt}
        className="mt-1 h-12 w-12 rounded-xl object-cover ring-1 ring-black/10"
      />

      <div className="min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
          <p className="truncate text-lg font-black text-ink">{formatOrderNumber(order.number)}</p>
          <p className="text-sm font-bold text-muted">{order.time}</p>
        </div>
        <p className="mt-1 truncate text-sm font-black text-ink">{order.customer}</p>
        {arrangement ? (
          <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-ink/80">Arreglo: {arrangement}</p>
        ) : null}
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-ink/80">{order.address}</p>
        <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-muted">
          Zona: {order.zone || 'Sin zona'}
          <span className="mx-1 text-black/30">|</span>
          Barrio: {orderNeighborhood(order) || 'Sin barrio'}
        </p>
        {note ? (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-black text-primary">
            <AlertTriangle size={12} />
            {note}
          </p>
        ) : null}
        <Button
          onClick={(event) => {
            event.stopPropagation()
            onAssign(order)
          }}
          disabled={isAssigning}
          className="mt-3 h-10 rounded-xl px-4"
          size="sm"
        >
          <Hand size={16} />
          {isAssigning ? 'Asignando...' : 'Asignarme'}
        </Button>
      </div>
    </article>
  )
}

function todayInputValue() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(todayInputValue)
  const [activeTab, setActiveTab] = useState<Tab>('available')
  const [searchTerm, setSearchTerm] = useState('')
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const setActiveOrder = useDeliveryStore((state) => state.setActiveOrder)
  const date = selectedDate || undefined
  const user = api.getSession()?.user
  const userName = user?.nombre || user?.login || 'Domiciliario'

  const assignedQuery = useOrders(date)
  const availableQuery = useAvailableOrders(date)
  const countersQuery = useDomicilioCounters(date)

  const assignedOrders = assignedQuery.data ?? []
  const availableOrders = availableQuery.data ?? []
  const counters = countersQuery.data ?? fallbackCounters(assignedOrders, availableOrders)
  const visibleCounters = { ...counters, disponibles: availableOrders.length }
  const activeOrder = nextDelivery(assignedOrders)
  const allSearchableOrders = useMemo(() => mergeOrders(assignedOrders, availableOrders), [assignedOrders, availableOrders])
  const list = visibleOrders(activeTab === 'available' ? availableOrders : assignedOrders)
  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return list

    return visibleOrders(allSearchableOrders).filter((order) =>
      [order.number, order.pedidoId, order.id].some((value) => value?.toLowerCase().includes(term))
    )
  }, [allSearchableOrders, list, searchTerm])
  const isLoading = assignedQuery.isLoading || availableQuery.isLoading || countersQuery.isLoading
  const isFetching = assignedQuery.isFetching || availableQuery.isFetching || countersQuery.isFetching
  const isError = assignedQuery.isError || availableQuery.isError
  const error = assignedQuery.error ?? availableQuery.error

  const assignedCacheKey = useMemo(() => ['orders', selectedDate || 'all'], [selectedDate])
  const availableCacheKey = useMemo(() => ['available-orders', selectedDate || 'all'], [selectedDate])
  const countersCacheKey = useMemo(() => ['domicilio-counters', selectedDate || 'all'], [selectedDate])

  const refreshAll = () => {
    assignedQuery.refetch()
    availableQuery.refetch()
    countersQuery.refetch()
  }

  const assignMutation = useMutation({
    mutationFn: (order: Order) => api.assignOrderToMe(order.pedidoId ?? order.id),
    onMutate: async (order) => {
      setAssignmentMessage(null)
      await queryClient.cancelQueries({ queryKey: availableCacheKey })
      const previousAvailable = queryClient.getQueryData<Order[]>(availableCacheKey)

      queryClient.setQueryData<Order[]>(availableCacheKey, (current) =>
        (current ?? availableOrders).filter((item) => item.id !== order.id)
      )

      return { previousAvailable }
    },
    onSuccess: ({ order, counters: nextCounters }) => {
      setActiveOrder(order)
      queryClient.setQueryData<Order[]>(assignedCacheKey, (current) => {
        const existing = current ?? assignedOrders
        return existing.some((item) => item.id === order.id) ? existing : [order, ...existing]
      })

      if (nextCounters) {
        queryClient.setQueryData(countersCacheKey, nextCounters)
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['available-orders'] })
      queryClient.invalidateQueries({ queryKey: ['domicilio-counters'] })
    },
    onError: (err, _order, context) => {
      if (context?.previousAvailable) {
        queryClient.setQueryData(availableCacheKey, context.previousAvailable)
      }

      const apiError = err as Error & { status?: number; code?: string }
      if (apiError.status === 409 || apiError.code === 'DOMICILIO_ALREADY_ASSIGNED') {
        setAssignmentMessage('Este pedido ya fue asignado a otro domiciliario.')
        queryClient.invalidateQueries({ queryKey: ['available-orders'] })
        queryClient.invalidateQueries({ queryKey: ['domicilio-counters'] })
        return
      }

      setAssignmentMessage(apiError.message || 'No fue posible asignar el pedido.')
    }
  })

  const returnMutation = useMutation({
    mutationFn: (order: Order) => api.returnOrderToAvailable(order),
    onMutate: async (order) => {
      setAssignmentMessage(null)
      await Promise.all([
        queryClient.cancelQueries({ queryKey: assignedCacheKey }),
        queryClient.cancelQueries({ queryKey: availableCacheKey }),
        queryClient.cancelQueries({ queryKey: countersCacheKey })
      ])

      const previousAssigned = queryClient.getQueryData<Order[]>(assignedCacheKey)
      const previousAvailable = queryClient.getQueryData<Order[]>(availableCacheKey)
      const previousCounters = queryClient.getQueryData<DomicilioContadores>(countersCacheKey)
      const availableOrder = availableFromAssigned(order)
      const key = availableOrder.pedidoId ?? availableOrder.id

      queryClient.setQueryData<Order[]>(assignedCacheKey, (current) =>
        (current ?? assignedOrders).filter((item) => item.id !== order.id)
      )
      queryClient.setQueryData<Order[]>(availableCacheKey, (current) => {
        const existing = current ?? availableOrders
        return existing.some((item) => (item.pedidoId ?? item.id) === key) ? existing : [availableOrder, ...existing]
      })
      queryClient.setQueryData<DomicilioContadores>(countersCacheKey, (current) => {
        const base = current ?? visibleCounters
        return {
          ...base,
          asignados: Math.max(0, base.asignados - 1),
          disponibles: base.disponibles + 1
        }
      })

      return { previousAssigned, previousAvailable, previousCounters }
    },
    onSuccess: ({ order, counters: nextCounters }) => {
      const key = order.pedidoId ?? order.id
      queryClient.setQueryData<Order[]>(availableCacheKey, (current) => {
        const existing = current ?? availableOrders
        return existing.some((item) => (item.pedidoId ?? item.id) === key) ? existing : [order, ...existing]
      })

      if (nextCounters) {
        queryClient.setQueryData(countersCacheKey, nextCounters)
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['available-orders'] })
      queryClient.invalidateQueries({ queryKey: ['domicilio-counters'] })
    },
    onError: (err, _order, context) => {
      if (context?.previousAssigned) queryClient.setQueryData(assignedCacheKey, context.previousAssigned)
      if (context?.previousAvailable) queryClient.setQueryData(availableCacheKey, context.previousAvailable)
      if (context?.previousCounters) queryClient.setQueryData(countersCacheKey, context.previousCounters)

      const apiError = err as Error
      setAssignmentMessage(apiError.message || 'No fue posible devolver el pedido a disponibles.')
    }
  })

  if (isLoading) return <DashboardSkeleton />

  if (isError) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="space-y-4 border border-rose-100 bg-rose-50 text-rose-800 shadow-soft">
          <div>
            <h1 className="text-xl font-black">No fue posible cargar los pedidos</h1>
            <p className="mt-2 text-sm font-semibold leading-6">
              {error instanceof Error ? error.message : 'Revisa la conexion e intenta de nuevo.'}
            </p>
          </div>
          <Button onClick={refreshAll} variant="danger">
            Reintentar
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-[1.75rem] bg-white shadow-soft ring-1 ring-black/5">
      <header className="flex items-center justify-between px-5 py-5">
        <button
          type="button"
          onClick={refreshAll}
          className="grid h-10 w-10 place-items-center rounded-full text-ink"
          aria-label="Actualizar pedidos"
          title="Actualizar pedidos"
        >
          <RefreshCw size={21} className={cn(isFetching && 'animate-spin')} />
        </button>
        <div className="min-w-0 text-center">
          <h1 className="text-lg font-black text-ink">Mis pedidos</h1>
          <p className="mt-0.5 max-w-[150px] truncate text-xs font-bold text-muted">{userName}</p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-50 px-4 text-sm font-black text-emerald-600"
        >
          En linea
          <ChevronDown size={16} />
        </button>
      </header>

      <div className="grid grid-cols-2 border-b border-black/10 px-4">
        <button
          type="button"
          onClick={() => setActiveTab('available')}
          className={cn(
            'flex h-12 items-center justify-center border-b-2 text-sm font-black transition',
            activeTab === 'available' ? 'border-primary text-primary' : 'border-transparent text-muted'
          )}
        >
          Disponibles
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assigned')}
          className={cn(
            'flex h-12 items-center justify-center border-b-2 text-sm font-black transition',
            activeTab === 'assigned' ? 'border-primary text-primary' : 'border-transparent text-muted'
          )}
        >
          Mis pedidos
        </button>
      </div>

      <section className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-b border-black/10 px-4 py-3">
        <label className="min-w-0">
          <span className="sr-only">Filtrar por fecha</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <button
          type="button"
          onClick={() => setSelectedDate('')}
          disabled={!selectedDate}
          className="h-11 rounded-xl px-4 text-sm font-black text-primary transition disabled:text-muted/50"
        >
          Ver todos
        </button>
      </section>

      <section className="grid grid-cols-4 gap-2 px-4 py-4">
        <div className="rounded-xl border border-black/10 px-2 py-3 text-center">
          <p className="text-xl font-black text-primary">{visibleCounters.disponibles}</p>
          <p className="text-[11px] font-bold text-muted">Disponibles</p>
        </div>
        <div className="rounded-xl border border-black/10 px-2 py-3 text-center">
          <p className="text-xl font-black text-primary">{visibleCounters.asignados}</p>
          <p className="text-[11px] font-bold text-muted">Asignados</p>
        </div>
        <div className="rounded-xl border border-black/10 px-2 py-3 text-center">
          <p className="text-xl font-black text-ink">{visibleCounters.enCamino}</p>
          <p className="text-[11px] font-bold text-muted">En camino</p>
        </div>
        <div className="rounded-xl border border-black/10 px-2 py-3 text-center">
          <p className="text-xl font-black text-ink">{visibleCounters.entregados}</p>
          <p className="text-[11px] font-bold text-muted">Entregados</p>
        </div>
      </section>

      <section className="border-b border-black/10 px-4 pb-4">
        <label className="grid h-12 grid-cols-[18px_minmax(0,1fr)] items-center gap-3 rounded-xl bg-slate-50 px-3 ring-1 ring-black/5 focus-within:ring-primary/25">
          <Search size={16} className="text-muted" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por numero de pedido"
            className="min-w-0 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-muted"
          />
        </label>
      </section>

      {assignmentMessage ? (
        <div className="px-4 pb-3">
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
            {assignmentMessage}
          </p>
        </div>
      ) : null}

      {activeOrder ? (
        <div className="px-4 pb-3">
          <Button
            onClick={() => {
              setActiveOrder(activeOrder)
              navigate('/ruta')
            }}
            className="h-12 w-full rounded-xl"
          >
            <MapPinned size={18} />
            Ver ruta sugerida
          </Button>
        </div>
      ) : null}

      <section className="max-h-[560px] overflow-y-auto pb-4">
        {list.length ? (
          filteredList.length ? (
          filteredList.map((order, index) => {
            const note = orderNote(order)
            const isAvailable = activeTab === 'available' && order.status === 'SIN_ASIGNAR'
            const isAssigning = assignMutation.isPending && assignMutation.variables?.id === order.id
            const isReturning = returnMutation.isPending && returnMutation.variables?.id === order.id

            if (isAvailable) {
              return (
                <AvailableOrderArticle
                  key={order.id}
                  order={order}
                  note={note}
                  isAssigning={isAssigning}
                  onAssign={(nextOrder) => assignMutation.mutate(nextOrder)}
                />
              )
            }

            return (
              <article
                key={order.id}
                className="grid w-full grid-cols-[40px_minmax(0,1fr)_72px_20px] gap-2 border-t border-black/10 px-4 py-4 text-left"
              >
                <div className="relative flex justify-center">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm font-black text-white">
                    {index + 1}
                  </span>
                  {index < filteredList.length - 1 ? (
                    <span className="absolute top-7 h-[calc(100%+1rem)] w-px bg-primary/20" />
                  ) : null}
                </div>

                <div
                  role={order.status === 'SIN_ASIGNAR' ? undefined : 'button'}
                  tabIndex={order.status === 'SIN_ASIGNAR' ? undefined : 0}
                  onClick={() => {
                    if (order.status !== 'SIN_ASIGNAR') navigate(`/pedido/${order.id}`)
                  }}
                  onKeyDown={(event) => {
                    if (order.status !== 'SIN_ASIGNAR' && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault()
                      navigate(`/pedido/${order.id}`)
                    }
                  }}
                  className={cn('min-w-0 text-left', order.status !== 'SIN_ASIGNAR' && 'cursor-pointer')}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-lg font-black text-ink">{formatOrderNumber(order.number)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusTone[order.status]}`}>
                      {order.priority || statusLabel[order.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-black text-ink">{order.customer}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-ink/80">{order.address}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-muted">
                    Zona: {order.zone || 'Sin zona'}
                    <span className="mx-1 text-black/20">/</span>
                    Barrio: {orderNeighborhood(order) || 'Sin barrio'}
                  </p>
                  {note ? (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-black text-primary">
                      <AlertTriangle size={12} />
                      {note}
                    </p>
                  ) : null}
                  {order.status === 'SIN_ASIGNAR' ? (
                    <Button
                      onClick={(event) => {
                        event.stopPropagation()
                        assignMutation.mutate(order)
                      }}
                      disabled={isAssigning}
                      className="mt-3 h-10 rounded-xl px-4"
                      size="sm"
                    >
                      <Hand size={16} />
                      {isAssigning ? 'Asignando...' : 'Asignarme'}
                    </Button>
                  ) : null}
                  {canReturnToAvailable(order) ? (
                    <Button
                      onClick={(event) => {
                        event.stopPropagation()
                        returnMutation.mutate(order)
                      }}
                      disabled={isReturning}
                      variant="secondary"
                      className="mt-3 h-10 rounded-xl px-4 text-primary"
                      size="sm"
                    >
                      <RotateCcw size={16} />
                      {isReturning ? 'Devolviendo...' : 'Devolver'}
                    </Button>
                  ) : null}
                </div>

                <div className="pt-1 text-right text-sm font-bold text-muted">
                  {order.time}
                  {order.status === 'EN_RUTA' ? (
                    <span className="mt-2 inline-flex items-center justify-end gap-1 text-xs text-primary">
                      <Radio size={13} />
                      Ruta
                    </span>
                  ) : null}
                  {order.status === 'ENTREGADO' ? (
                    <span className="mt-2 inline-flex items-center justify-end gap-1 text-xs text-emerald-600">
                      <Package size={13} />
                      Listo
                    </span>
                  ) : null}
                  {order.status === 'ASIGNADO' || order.status === 'PENDIENTE' || order.status === 'RETRASADO' ? (
                    <span className="mt-2 inline-flex items-center justify-end gap-1 text-xs text-muted">
                      <Clock3 size={13} />
                      Pend.
                    </span>
                  ) : null}
                </div>

                {order.status === 'SIN_ASIGNAR' ? (
                  <span />
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/pedido/${order.id}`)}
                    className="mt-9 text-muted"
                    aria-label="Ver detalle"
                    title="Ver detalle"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </article>
            )
          })
          ) : (
            <div className="grid justify-items-center gap-2 px-6 py-12 text-center">
              <Search size={30} className="text-primary" />
              <h2 className="text-xl font-black text-ink">Sin resultados</h2>
              <p className="text-sm font-semibold text-muted">No encontramos pedidos con ese numero.</p>
            </div>
          )
        ) : (
          <div className="grid justify-items-center gap-2 px-6 py-12 text-center">
            <Package size={30} className="text-primary" />
            <h2 className="text-xl font-black text-ink">Sin pedidos</h2>
            <p className="text-sm font-semibold text-muted">
              {activeTab === 'available' ? 'No hay pedidos disponibles.' : 'No tienes pedidos asignados.'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
