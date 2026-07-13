import { Bike, Clock3, MapPin } from 'lucide-react'
import { Order } from '../types'
import Card from './ui/Card'

export default function RouteCard({ order }: { order: Order }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted">Ruta activa</p>
          <p className="text-lg font-black text-ink">{order.customer}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Bike size={22} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface p-3">
          <Clock3 size={17} className="text-primary" />
          <p className="mt-2 text-xs text-muted">Llegada</p>
          <p className="font-black">{order.etaMinutes} min</p>
        </div>
        <div className="rounded-2xl bg-surface p-3">
          <MapPin size={17} className="text-primary" />
          <p className="mt-2 text-xs text-muted">Distancia</p>
          <p className="font-black">{order.distanceKm.toFixed(1)} km</p>
        </div>
      </div>
    </Card>
  )
}
