import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2 } from 'lucide-react'
import Card from '../components/ui/Card'
import { useOrders } from '../hooks/useOrders'
import { StatusBadge } from '../components/ui/Badge'
import { formatOrderNumber } from '../lib/utils'

const money = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const filters = ['Hoy', 'Semana', 'Mes'] as const

export default function Historial() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('Hoy')
  const { data: orders = [] } = useOrders()
  const delivered = orders.filter((order) => order.status === 'ENTREGADO')

  const multiplier = filter === 'Hoy' ? 1 : filter === 'Semana' ? 5 : 18
  const totals = useMemo(
    () => ({
      count: delivered.length * multiplier,
      value: delivered.reduce((sum, order) => sum + order.earnings, 0) * multiplier
    }),
    [delivered, multiplier]
  )

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <p className="text-sm font-semibold text-muted">Resumen</p>
        <h1 className="mt-1 text-3xl font-black text-ink">Historial</h1>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-1 shadow-soft ring-1 ring-black/5">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`h-11 rounded-xl text-sm font-black transition ${
              filter === item ? 'bg-primary text-white' : 'text-muted'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <Card className="bg-primary text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white/70">Cantidad entregada</p>
            <p className="mt-1 text-3xl font-black">{totals.count}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-white/70">Valor total</p>
            <p className="mt-1 text-2xl font-black">{money.format(totals.value)}</p>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        {delivered.map((order) => (
          <Card key={order.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="font-black text-ink">{formatOrderNumber(order.number)}</p>
                <p className="text-sm font-medium text-muted">{order.customer}</p>
              </div>
            </div>
            <div className="text-right">
              <StatusBadge status={order.status} />
              <p className="mt-2 flex items-center justify-end gap-1 text-xs font-semibold text-muted">
                <CalendarDays size={13} />
                {order.deliveredAt ?? order.time}
              </p>
            </div>
          </Card>
        ))}
      </section>
    </div>
  )
}
