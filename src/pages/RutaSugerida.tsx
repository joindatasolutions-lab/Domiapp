import {
  ArrowUpDown,
  ChevronLeft,
  Clock3,
  GripVertical,
  Navigation,
  Play,
  RefreshCw,
  RotateCcw,
  Route,
  Search
} from 'lucide-react'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAvailableOrders, useOrders } from '../hooks/useOrders'
import { cn, formatOrderNumber } from '../lib/utils'
import { api } from '../services/api'
import { useDeliveryStore } from '../store/deliveryStore'
import { Order, OrderStatus } from '../types'

const statusPriority: Record<OrderStatus, number> = {
  EN_RUTA: 0,
  ASIGNADO: 1,
  RETRASADO: 1,
  PENDIENTE: 2,
  SIN_ASIGNAR: 3,
  ENTREGADO: 4
}

const barranquillaStops = [
  { x: 248, y: 30, label: 'Riomar' },
  { x: 224, y: 76, label: 'Alto Prado' },
  { x: 250, y: 116, label: 'El Prado' },
  { x: 180, y: 138, label: 'Boston' },
  { x: 126, y: 170, label: 'Centro' },
  { x: 162, y: 214, label: 'Las Delicias' },
  { x: 146, y: 252, label: 'San Roque' }
]

const ROUTE_ORDER_KEY = 'domiapp.routeOrderIds'

function deliveryTimeValue(time: string) {
  const normalized = time.trim().toUpperCase()
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/)
  if (!match) return Number.MAX_SAFE_INTEGER

  const [, hourValue, minuteValue = '0', meridian] = match
  let hour = Number(hourValue)
  const minute = Number(minuteValue)

  if (meridian === 'PM' && hour < 12) hour += 12
  if (meridian === 'AM' && hour === 12) hour = 0

  return hour * 60 + minute
}

function routeOrders(orders: Order[]) {
  return [...orders]
    .filter((order) => order.status !== 'ENTREGADO')
    .sort(
      (a, b) =>
        statusPriority[a.status] - statusPriority[b.status] ||
        deliveryTimeValue(a.time) - deliveryTimeValue(b.time) ||
        a.address.localeCompare(b.address)
    )
}

function mergeOrders(assignedOrders: Order[], availableOrders: Order[]) {
  const assignedIds = new Set(assignedOrders.map((order) => order.pedidoId ?? order.id))
  return [...assignedOrders, ...availableOrders.filter((order) => !assignedIds.has(order.pedidoId ?? order.id))]
}

function neighborhood(address: string, index: number) {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean)
  return parts[1] ?? barranquillaStops[index]?.label ?? 'Barranquilla'
}

function formatAddress(address: string) {
  return address.split(',')[0]?.trim() || address
}

function routeDistance(orders: Order[]) {
  const total = orders.reduce((sum, order) => sum + (Number.isFinite(order.distanceKm) ? order.distanceKm : 0), 0)
  return total > 0 ? total.toFixed(1) : '12.4'
}

function routeEta(orders: Order[]) {
  const total = orders.reduce((sum, order) => sum + (Number.isFinite(order.etaMinutes) ? order.etaMinutes : 0), 0)
  if (!total) return '1h 15m'
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`
}

function reorderIds(ids: string[], fromIndex: number, toIndex: number) {
  const nextIds = [...ids]
  const [movedId] = nextIds.splice(fromIndex, 1)
  nextIds.splice(toIndex, 0, movedId)
  return nextIds
}

interface SortableOrderRowProps {
  order: Order
  index: number
  onOpen: (order: Order) => void
}

function SortableOrderRow({ order, index, onOpen }: SortableOrderRowProps) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'grid w-full grid-cols-[32px_minmax(0,1fr)_64px_32px] gap-2 px-4 py-3 text-left transition',
        isDragging && 'relative z-10 bg-white shadow-soft'
      )}
    >
      <span className="mt-1 grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-black text-white">
        {index + 1}
      </span>
      <button
        type="button"
        onClick={() => onOpen(order)}
        className={cn('min-w-0 text-left', order.status !== 'SIN_ASIGNAR' && 'active:text-primary')}
      >
        <span className="block whitespace-normal break-words text-sm font-black leading-5 text-ink">{formatAddress(order.address)}</span>
        <span className="mt-0.5 block whitespace-normal break-words text-xs font-semibold leading-5 text-muted">
          {formatOrderNumber(order.number)}
          <span className="mx-1 text-black/20">/</span>
          {order.status === 'SIN_ASIGNAR' ? 'Disponible' : neighborhood(order.address, index)}
        </span>
      </button>
      <span className="mt-1 inline-flex items-center justify-end gap-1 text-xs font-bold text-muted">
        <Clock3 size={13} />
        {order.time}
      </span>
      <span className="grid items-start">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="grid h-8 w-8 touch-none select-none place-items-center rounded-full text-muted transition active:bg-primary/5 active:text-primary"
          style={{
            touchAction: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
          aria-label={`Mover pedido ${index + 1}`}
          title="Arrastrar"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
      </span>
    </div>
  )
}

export default function RutaSugerida() {
  const assignedQuery = useOrders()
  const availableQuery = useAvailableOrders()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [routeOrderIds, setRouteOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ROUTE_ORDER_KEY)
      return saved ? (JSON.parse(saved) as string[]) : []
    } catch {
      return []
    }
  })
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6
      }
    })
  )
  const setActiveOrder = useDeliveryStore((state) => state.setActiveOrder)
  const updateOrderStatus = useDeliveryStore((state) => state.updateOrderStatus)
  const orders = useMemo(
    () => mergeOrders(assignedQuery.data ?? [], availableQuery.data ?? []),
    [assignedQuery.data, availableQuery.data]
  )
  const isLoading = assignedQuery.isLoading || availableQuery.isLoading
  const isError = assignedQuery.isError || availableQuery.isError
  const isFetching = assignedQuery.isFetching || availableQuery.isFetching
  const suggestedList = useMemo(() => routeOrders(orders), [orders])
  const list = useMemo(() => {
    if (!routeOrderIds.length) return suggestedList

    const ordersById = new Map(suggestedList.map((order) => [order.id, order]))
    const ordered = routeOrderIds.flatMap((id) => {
      const order = ordersById.get(id)
      return order ? [order] : []
    })
    const addedOrders = suggestedList.filter((order) => !routeOrderIds.includes(order.id))

    return [...ordered, ...addedOrders]
  }, [routeOrderIds, suggestedList])
  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return list

    return list.filter((order) =>
      [order.number, order.pedidoId, order.id].some((value) => value?.toLowerCase().includes(term))
    )
  }, [list, searchTerm])
  const firstAssignedOrder = list.find((order) => order.status !== 'SIN_ASIGNAR')
  const visibleStops = barranquillaStops.slice(0, Math.min(filteredList.length, barranquillaStops.length))
  const routePath = visibleStops.map((stop, index) => `${index === 0 ? 'M' : 'L'}${stop.x} ${stop.y}`).join(' ')
  const hasCustomOrder =
    routeOrderIds.length > 0 && list.map((order) => order.id).join('|') !== suggestedList.map((order) => order.id).join('|')

  useEffect(() => {
    setRouteOrderIds((current) => {
      const suggestedIds = suggestedList.map((order) => order.id)
      const keptIds = current.filter((id) => suggestedIds.includes(id))
      const newIds = suggestedIds.filter((id) => !keptIds.includes(id))
      const nextIds = current.length ? [...keptIds, ...newIds] : suggestedIds

      localStorage.setItem(ROUTE_ORDER_KEY, JSON.stringify(nextIds))
      return nextIds
    })
  }, [suggestedList])

  const saveRouteOrder = (ids: string[]) => {
    setRouteOrderIds(ids)
    localStorage.setItem(ROUTE_ORDER_KEY, JSON.stringify(ids))
  }

  const invertRoute = () => {
    saveRouteOrder(list.map((order) => order.id).reverse())
  }

  const resetRoute = () => {
    saveRouteOrder(suggestedList.map((order) => order.id))
  }

  const reorderOrder = (orderId: string, toIndex: number) => {
    const fromIndex = list.findIndex((order) => order.id === orderId)
    if (fromIndex < 0 || toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) return

    saveRouteOrder(reorderIds(list.map((order) => order.id), fromIndex, toIndex))
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    const oldIndex = list.findIndex((order) => order.id === active.id)
    const newIndex = list.findIndex((order) => order.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    saveRouteOrder(reorderIds(list.map((order) => order.id), oldIndex, newIndex))
  }

  const openOrder = (order: Order) => {
    if (order.status !== 'SIN_ASIGNAR') navigate(`/pedido/${order.id}`)
  }

  const startRoute = async () => {
    if (!firstAssignedOrder) return

    setStartError(null)
    setIsStarting(true)

    try {
      const orderInRoute =
        firstAssignedOrder.status === 'EN_RUTA' ? firstAssignedOrder : await api.updateOrderStatus(firstAssignedOrder.id, 'EN_RUTA')
      const updatedOrder = orderInRoute ?? { ...firstAssignedOrder, status: 'EN_RUTA' as const }

      updateOrderStatus(firstAssignedOrder.id, 'EN_RUTA')
      setActiveOrder(updatedOrder)
      queryClient.setQueryData(['orders'], (current: Order[] | undefined) =>
        (current ?? assignedQuery.data ?? []).map((order) =>
          order.id === firstAssignedOrder.id ? { ...order, status: 'EN_RUTA' as const } : order
        )
      )
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate(`/navegacion/${firstAssignedOrder.id}`)
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'No fue posible iniciar la ruta.')
    } finally {
      setIsStarting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="h-14 animate-pulse rounded-2xl bg-white" />
        <div className="h-[620px] animate-pulse rounded-[1.75rem] bg-white" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="space-y-4 border border-rose-100 bg-rose-50 text-rose-800 shadow-soft">
          <h1 className="text-xl font-black">No fue posible cargar la ruta</h1>
          <p className="text-sm font-semibold leading-6">Revisa la conexion e intenta de nuevo.</p>
          <Button
            onClick={() => {
              assignedQuery.refetch()
              availableQuery.refetch()
            }}
            variant="danger"
          >
            Reintentar
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-[1.75rem] bg-white shadow-soft ring-1 ring-black/5">
      <header className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center border-b border-black/5 px-3 py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="grid h-11 w-11 place-items-center rounded-full text-ink active:bg-primary/5"
          aria-label="Volver"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-center text-lg font-black">Ruta sugerida</h1>
        <button
          type="button"
          onClick={() => {
            assignedQuery.refetch()
            availableQuery.refetch()
          }}
          className="grid h-11 w-11 place-items-center rounded-full text-ink active:bg-primary/5"
          aria-label="Actualizar ruta"
          title="Actualizar ruta"
        >
          <RefreshCw size={20} className={cn(isFetching && 'animate-spin')} />
        </button>
      </header>

      <main className="px-4 pb-6 pt-4">
        <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-3 px-4 py-4">
            <div>
              <h2 className="text-sm font-black text-ink">Ruta sugerida - Barranquilla</h2>
              <p className="mt-2 text-xs font-bold text-muted">
                {list.length} pedidos
                <span className="mx-2 text-black/20">/</span>
                {list.filter((order) => order.status === 'SIN_ASIGNAR').length} disponibles
                <span className="mx-2 text-black/20">/</span>
                {routeDistance(list)} km
                <span className="mx-2 text-black/20">/</span>
                {routeEta(list)}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
              {hasCustomOrder ? 'Editada' : 'Sugerida'}
            </span>
          </div>

          <div className="border-t border-black/5 px-4 py-3">
            <label className="grid h-11 grid-cols-[18px_minmax(0,1fr)] items-center gap-3 rounded-xl bg-slate-50 px-3 ring-1 ring-black/5 focus-within:ring-primary/25">
              <Search size={16} className="text-muted" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por numero de pedido"
                className="min-w-0 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-muted"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-black/5 px-4 py-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 rounded-xl text-xs"
              onClick={invertRoute}
              disabled={list.length < 2}
            >
              <ArrowUpDown size={16} />
              Invertir
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 rounded-xl text-xs text-muted"
              onClick={resetRoute}
              disabled={!hasCustomOrder}
            >
              <RotateCcw size={16} />
              Restaurar
            </Button>
          </div>

          <div className="relative h-72 overflow-hidden delivery-map">
            <div className="absolute inset-y-0 right-0 w-20 bg-emerald-100/60" />
            <div className="absolute inset-0 bg-white/10" />
            <span className="absolute left-7 top-7 text-[10px] font-black uppercase tracking-wide text-ink/35">Barranquilla</span>
            <span className="absolute right-4 top-24 rotate-90 text-[9px] font-black uppercase tracking-wide text-emerald-700/45">
              Rio Magdalena
            </span>
            <span className="absolute left-44 top-12 text-[10px] font-black uppercase tracking-wide text-ink/35">Riomar</span>
            <span className="absolute left-36 top-24 text-[10px] font-black uppercase tracking-wide text-ink/35">Alto Prado</span>
            <span className="absolute bottom-24 left-20 text-[10px] font-black uppercase tracking-wide text-ink/35">Centro</span>
            <span className="absolute bottom-14 left-36 text-[10px] font-black uppercase tracking-wide text-ink/35">Soledad</span>

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 288" aria-hidden="true">
              {routePath ? (
                <>
                  <path
                    d={routePath}
                    fill="none"
                    stroke="#e62673"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="5"
                  />
                  <path
                    d={routePath}
                    fill="none"
                    stroke="#ffffff"
                    strokeDasharray="2 12"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </>
              ) : null}
            </svg>

            {visibleStops.map((stop, index) => (
              <span
                key={`${stop.label}-${index}`}
                className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-xs font-black text-white shadow-md ring-4 ring-white/70"
                style={{ left: `${(stop.x / 360) * 100}%`, top: `${(stop.y / 288) * 100}%` }}
                title={stop.label}
              >
                {index + 1}
              </span>
            ))}

            <div className="absolute bottom-4 right-4 overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-black/10">
              <button type="button" className="grid h-9 w-9 place-items-center border-b border-black/10 text-lg font-black">
                +
              </button>
              <button type="button" className="grid h-9 w-9 place-items-center text-lg font-black">
                -
              </button>
            </div>
            <button
              type="button"
              className="absolute bottom-4 right-16 grid h-9 w-9 place-items-center rounded-xl bg-white text-ink shadow-soft ring-1 ring-black/10"
              aria-label="Centrar ruta"
            >
              <Navigation size={17} />
            </button>
          </div>

          <div className="divide-y divide-black/10">
            {list.length ? (
              filteredList.length ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={filteredList.map((order) => order.id)} strategy={verticalListSortingStrategy}>
                    {filteredList.map((order, index) => (
                      <SortableOrderRow
                        key={order.id}
                        order={order}
                        index={index}
                        onOpen={openOrder}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="grid justify-items-center gap-2 px-6 py-12 text-center">
                  <Search size={32} className="text-primary" />
                  <h2 className="text-lg font-black text-ink">Sin resultados</h2>
                  <p className="text-sm font-semibold text-muted">No encontramos pedidos con ese numero.</p>
                </div>
              )
            ) : (
              <div className="grid justify-items-center gap-2 px-6 py-12 text-center">
                <Route size={32} className="text-primary" />
                <h2 className="text-lg font-black text-ink">Sin ruta pendiente</h2>
                <p className="text-sm font-semibold text-muted">No hay pedidos disponibles para construir una ruta.</p>
              </div>
            )}
          </div>

          <div className="px-4 pb-4 pt-4">
            {startError ? (
              <p className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
                {startError}
              </p>
            ) : null}
            <Button
              onClick={startRoute}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#e62673] to-[#c12468]"
              disabled={!firstAssignedOrder || isStarting}
            >
              <Play size={18} fill="currentColor" />
              {isStarting ? 'Iniciando ruta...' : 'Iniciar ruta'}
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
