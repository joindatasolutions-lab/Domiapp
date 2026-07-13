import { Star, TrendingUp, Trophy } from 'lucide-react'
import Card from '../components/ui/Card'
import { useOrders } from '../hooks/useOrders'
import { api } from '../services/api'

const money = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

export default function Perfil() {
  const { data: orders = [] } = useOrders()
  const user = api.getSession()?.user
  const name = user?.nombre || user?.login || 'Domiciliario'
  const contact = user?.email || user?.login || 'Sesion activa'
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'D'
  const deliveredCount = orders.filter((order) => order.status === 'ENTREGADO').length + 1234
  const totalEarnings = orders.reduce((sum, order) => sum + order.earnings, 0) + 2456000

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card className="bg-ink text-white">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-primary text-3xl font-black shadow-button">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-2xl font-black">{name}</p>
            <p className="mt-1 truncate text-sm font-semibold text-white/60">{contact}</p>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
              <Star size={14} className="fill-amber-300 text-amber-300" />
              Top driver
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-muted">Pedidos entregados</p>
            <p className="mt-1 text-2xl font-black text-ink">{deliveredCount.toLocaleString('es-CO')}</p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Trophy size={23} />
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-muted">Calificacion</p>
            <p className="mt-1 text-2xl font-black text-ink">4.9</p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <Star size={23} />
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-muted">Ingresos acumulados</p>
            <p className="mt-1 text-2xl font-black text-ink">{money.format(totalEarnings)}</p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <TrendingUp size={23} />
          </div>
        </Card>
      </div>
    </div>
  )
}
