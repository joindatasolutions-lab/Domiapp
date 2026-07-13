import { AlertTriangle, CheckCircle2, Clock3, Navigation } from 'lucide-react'
import { Order } from '../types'
import Card from './ui/Card'

const items = [
  { key: 'ASIGNADO', label: 'Asignados', icon: Clock3, tone: 'text-primary bg-primary/10' },
  { key: 'PENDIENTE', label: 'Pendientes', icon: Clock3, tone: 'text-amber-600 bg-amber-50' },
  { key: 'EN_RUTA', label: 'En ruta', icon: Navigation, tone: 'text-sky-600 bg-sky-50' },
  { key: 'ENTREGADO', label: 'Entregados', icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
  { key: 'RETRASADO', label: 'Retrasados', icon: AlertTriangle, tone: 'text-rose-600 bg-rose-50' }
] as const

export default function KPISection({ orders = [] }: { orders?: Order[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => {
        const Icon = item.icon
        const value = orders.filter((order) => order.status === item.key).length

        return (
          <Card key={item.key} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-ink">{value}</p>
              </div>
              <div className={`grid h-10 w-10 place-items-center rounded-2xl ${item.tone}`}>
                <Icon size={19} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
