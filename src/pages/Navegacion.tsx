import { ExternalLink, MapPin, MessageCircle, Navigation2, Phone } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import RouteCard from '../components/RouteCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { api } from '../services/api'
import { useDeliveryStore } from '../store/deliveryStore'
import { useOrders } from '../hooks/useOrders'
import { Order } from '../types'

function matchesOrder(order?: Order | null, id?: string) {
  return Boolean(order && id && (order.id === id || order.pedidoId === id))
}

export default function Navegacion() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data: orders = [] } = useOrders()
  const activeOrder = useDeliveryStore((state) => state.activeOrder)
  const storeOrder = useDeliveryStore((state) => state.orders.find((order) => matchesOrder(order, id)))
  const updateOrderStatus = useDeliveryStore((state) => state.updateOrderStatus)
  const order = storeOrder ?? orders.find((item) => matchesOrder(item, id)) ?? (matchesOrder(activeOrder, id) ? activeOrder : null)

  const encodedAddress = useMemo(() => encodeURIComponent(order?.address ?? ''), [order?.address])

  const arrived = async () => {
    if (!order) return
    await api.updateOrderStatus(order.id, 'EN_RUTA')
    updateOrderStatus(order.id, 'EN_RUTA')
    nav(`/pedido/${order.id}`)
  }

  if (!order) {
    return <Card className="mx-4 mt-4">No encontramos este pedido.</Card>
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#111827]">
      <div className="absolute inset-0 bg-map-grid opacity-90" />
      <div className="absolute left-8 right-10 top-32 h-56 rotate-[-18deg] rounded-full border-[10px] border-primary/70" />
      <div className="absolute left-24 right-5 top-40 h-44 rotate-[21deg] rounded-full border-[10px] border-white/30" />

      <div className="absolute left-[22%] top-[38%] grid h-11 w-11 place-items-center rounded-full bg-white text-primary shadow-2xl">
        <Navigation2 size={22} />
      </div>
      <div className="absolute right-[18%] top-[23%] grid h-12 w-12 place-items-center rounded-full bg-primary text-white shadow-2xl">
        <MapPin size={24} />
      </div>

      <div className="absolute inset-x-4 top-4 z-10 mx-auto max-w-md">
        <RouteCard order={order} />
      </div>

      <div className="absolute right-4 top-44 z-10 flex flex-col gap-3">
        <Button asChild variant="secondary" size="icon" aria-label="Llamar">
          <a href={`tel:${order.phone}`}>
            <Phone size={20} />
          </a>
        </Button>
        <Button asChild variant="secondary" size="icon" aria-label="WhatsApp">
          <a href={`https://wa.me/${order.phone.replace(/\D/g, '')}`}>
            <MessageCircle size={20} />
          </a>
        </Button>
        <Button asChild variant="secondary" size="icon" aria-label="Abrir Waze">
          <a href={`https://waze.com/ul?q=${encodedAddress}&navigate=yes`} target="_blank" rel="noreferrer">
            <ExternalLink size={20} />
          </a>
        </Button>
        <Button asChild variant="secondary" size="icon" aria-label="Abrir Google Maps">
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`} target="_blank" rel="noreferrer">
            <MapPin size={20} />
          </a>
        </Button>
      </div>

      <div className="fixed inset-x-4 bottom-24 z-20 mx-auto max-w-md">
        <Button onClick={arrived} className="w-full" size="lg">
          Ya llegue
        </Button>
      </div>
    </div>
  )
}
