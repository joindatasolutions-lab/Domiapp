import { ArrowRight, Clock3, MapPin, Navigation } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Order } from '../types'
import { useDeliveryStore } from '../store/deliveryStore'
import { api } from '../services/api'
import { formatOrderNumber } from '../lib/utils'
import { StatusBadge } from './ui/Badge'
import Button from './ui/Button'
import Card from './ui/Card'

const money = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

export default function OrderCard({ order }: { order: Order }) {
  const nav = useNavigate()
  const setActiveOrder = useDeliveryStore((state) => state.setActiveOrder)
  const updateOrderStatus = useDeliveryStore((state) => state.updateOrderStatus)

  const startDelivery = async () => {
    setActiveOrder(order)
    if (order.status === 'ASIGNADO' || order.status === 'PENDIENTE' || order.status === 'RETRASADO') {
      await api.updateOrderStatus(order.id, 'EN_RUTA')
      updateOrderStatus(order.id, 'EN_RUTA')
    }
    nav(`/navegacion/${order.id}`)
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-muted">{formatOrderNumber(order.number)}</p>
            <StatusBadge status={order.status} />
          </div>
          <h3 className="mt-1 truncate text-lg font-bold text-ink">{order.customer}</h3>
          <div className="mt-2 flex items-start gap-2 text-sm text-muted">
            <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
            <span className="line-clamp-2">{order.address}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-black text-ink">{money.format(order.earnings)}</p>
          <p className="text-xs text-muted">Ganancia</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface p-2 text-center">
        <div>
          <p className="text-xs text-muted">Hora</p>
          <p className="font-bold">{order.time}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Ruta</p>
          <p className="font-bold">{order.distanceKm.toFixed(1)} km</p>
        </div>
        <div>
          <p className="text-xs text-muted">Valor</p>
          <p className="font-bold">{money.format(order.value)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {order.status !== 'ENTREGADO' ? (
          <Button onClick={startDelivery} className="flex-1" size="lg">
            <Navigation size={18} />
            Iniciar entrega
          </Button>
        ) : (
          <Button onClick={() => nav(`/pedido/${order.id}`)} className="flex-1" variant="secondary" size="lg">
            <Clock3 size={18} />
            Ver entrega
          </Button>
        )}
        <Button onClick={() => nav(`/pedido/${order.id}`)} variant="secondary" size="icon" aria-label="Ver detalle">
          <ArrowRight size={20} />
        </Button>
      </div>
    </Card>
  )
}
