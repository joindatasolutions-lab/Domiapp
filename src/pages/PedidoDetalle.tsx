import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Play,
  User
} from 'lucide-react'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useOrders } from '../hooks/useOrders'
import { formatOrderNumber } from '../lib/utils'
import { api } from '../services/api'
import { useDeliveryStore } from '../store/deliveryStore'
import { Order } from '../types'

const statusLabel: Record<Order['status'], string> = {
  SIN_ASIGNAR: 'Disponible',
  ASIGNADO: 'Asignado',
  PENDIENTE: 'Asignado',
  EN_RUTA: 'En camino',
  ENTREGADO: 'Entregado',
  RETRASADO: 'Urgente'
}

const statusTone: Record<Order['status'], string> = {
  SIN_ASIGNAR: 'bg-slate-50 text-slate-700',
  ASIGNADO: 'bg-emerald-50 text-emerald-600',
  PENDIENTE: 'bg-emerald-50 text-emerald-600',
  EN_RUTA: 'bg-sky-50 text-sky-700',
  ENTREGADO: 'bg-emerald-50 text-emerald-700',
  RETRASADO: 'bg-rose-50 text-rose-700'
}

function productName(name: string, index: number) {
  const trimmed = name.trim()
  return !trimmed || /^[\W_.-]+$/.test(trimmed) ? `Producto ${index + 1}` : trimmed
}

export default function PedidoDetalle() {
  const { id } = useParams()
  const nav = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: orders = [] } = useOrders()
  const storeOrder = useDeliveryStore((state) => state.orders.find((order) => order.id === id))
  const updateOrderStatus = useDeliveryStore((state) => state.updateOrderStatus)
  const setActiveOrder = useDeliveryStore((state) => state.setActiveOrder)
  const summaryOrder = storeOrder ?? orders.find((item) => item.id === id)
  const { data: detailedOrder } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => api.fetchOrderById(id ?? ''),
    enabled: Boolean(id)
  })
  const order = detailedOrder ?? summaryOrder

  const setCachedOrderStatus = (nextStatus: Order['status']) => {
    updateOrderStatus(order!.id, nextStatus)
    queryClient.setQueryData(['orders'], (current: Order[] | undefined) =>
      (current ?? orders).map((item) => (item.id === order!.id ? { ...item, status: nextStatus } : item))
    )
  }

  const handlePrimaryAction = async () => {
    if (!order || order.status === 'ENTREGADO') return

    setError(null)
    setIsSubmitting(true)

    try {
      if (order.status === 'EN_RUTA') {
        await api.updateOrderStatus(order.id, 'ENTREGADO', {
          latitude: order.currentLocation.lat || order.customerLocation.lat,
          longitude: order.currentLocation.lng || order.customerLocation.lng,
          signatureName: order.customer,
          observations: order.notes
        })
        setCachedOrderStatus('ENTREGADO')
        nav('/')
        return
      }

      const updatedOrder = await api.updateOrderStatus(order.id, 'EN_RUTA')
      setCachedOrderStatus('EN_RUTA')
      setActiveOrder(updatedOrder ?? { ...order, status: 'EN_RUTA' })
      nav(`/navegacion/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar el pedido.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!order) {
    return <Card className="mx-auto max-w-md">No encontramos este pedido.</Card>
  }

  const note = order.notes || 'Sin notas del pedido.'
  const primaryLabel =
    order.status === 'ENTREGADO'
      ? 'Pedido entregado'
      : order.status === 'EN_RUTA'
        ? 'Marcar como entregado'
        : 'Iniciar entrega'

  return (
    <div className="mx-auto max-w-md bg-white pb-24 text-ink shadow-soft ring-1 ring-black/5 sm:rounded-[1.75rem]">
      <header className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center border-b border-black/10 px-3 py-4">
        <button
          type="button"
          onClick={() => nav(-1)}
          className="grid h-11 w-11 place-items-center rounded-full text-ink active:bg-primary/5"
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-center text-base font-black">Detalle del pedido</h1>
        <span />
      </header>

      <main className="space-y-5 px-5 py-5">
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="rounded-lg bg-primary/10 px-3 py-1 text-base font-black text-primary">
                {formatOrderNumber(order.number)}
              </span>
              {order.status === 'RETRASADO' ? (
                <span className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">URGENTE</span>
              ) : null}
            </div>
            <span className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${statusTone[order.status]}`}>
              {statusLabel[order.status]}
            </span>
          </div>

          <div className="space-y-4 text-sm font-bold">
            <div className="flex items-center gap-4">
              <User size={20} className="shrink-0 text-ink" />
              <span className="truncate">{order.customer}</span>
            </div>
            <a className="flex items-center gap-4" href={`tel:${order.phone}`}>
              <Phone size={20} className="shrink-0 text-ink" />
              <span>{order.phone || 'Sin telefono'}</span>
            </a>
            <div className="flex items-center gap-4 text-primary">
              <MessageSquare size={20} className="shrink-0" />
              <span>{order.notes ? 'Con observaciones' : 'Sin mensaje'}</span>
            </div>
          </div>

          <div className="border-t border-black/10 pt-5">
            <div className="flex gap-4">
              <MapPin size={22} className="mt-1 shrink-0 text-ink" />
              <p className="text-sm font-bold leading-6">{order.address}</p>
            </div>
          </div>
        </section>

        <Card className="rounded-lg p-4 shadow-none ring-1 ring-black/10">
          <p className="text-sm font-black">Notas del pedido</p>
          <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-muted">{note}</p>
        </Card>

        <section className="space-y-3">
          <h2 className="text-base font-black">Resumen del pedido</h2>
          <div className="space-y-3">
            {order.items.map((item, index) => {
              const displayName = productName(item.name, index)

              return (
                <div key={`${item.id}-${index}`} className="flex items-center gap-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={displayName}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-black/10"
                    />
                  ) : (
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-surface text-primary ring-1 ring-black/10">
                      <Package size={26} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{displayName}</p>
                    <p className="mt-1 text-sm font-semibold text-muted">
                      {item.qty} {item.qty === 1 ? 'unidad' : 'unidades'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="space-y-5 border-t border-black/10 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              <p className="text-base font-black">Pago</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-600">Pagado</span>
          </div>

          <div>
            <p className="text-base font-black">Hora de entrega</p>
            <p className="mt-3 text-base font-bold">{order.time}</p>
          </div>
        </section>

        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
            {error}
          </p>
        ) : null}
      </main>

      <div className="fixed inset-x-4 bottom-4 z-20 mx-auto max-w-md">
        <Button
          onClick={handlePrimaryAction}
          className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#e62673] to-[#c12468] shadow-button"
          size="lg"
          disabled={isSubmitting || order.status === 'ENTREGADO'}
        >
          {order.status === 'ENTREGADO' ? <CheckCircle2 size={20} /> : <Play size={20} fill="currentColor" />}
          {isSubmitting ? 'Actualizando...' : primaryLabel}
        </Button>
      </div>
    </div>
  )
}
