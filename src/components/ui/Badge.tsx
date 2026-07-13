import { cn } from '../../lib/utils'
import { OrderStatus } from '../../types'

const statusStyles: Record<OrderStatus, string> = {
  SIN_ASIGNAR: 'bg-slate-50 text-slate-700 ring-slate-200',
  ASIGNADO: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PENDIENTE: 'bg-amber-50 text-amber-700 ring-amber-200',
  EN_RUTA: 'bg-sky-50 text-sky-700 ring-sky-200',
  ENTREGADO: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  RETRASADO: 'bg-rose-50 text-rose-700 ring-rose-200'
}

const statusLabels: Record<OrderStatus, string> = {
  SIN_ASIGNAR: 'Disponible',
  ASIGNADO: 'Asignado',
  PENDIENTE: 'Pendiente',
  EN_RUTA: 'En ruta',
  ENTREGADO: 'Entregado',
  RETRASADO: 'Retrasado'
}

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold ring-1', statusStyles[status], className)}>
      {statusLabels[status]}
    </span>
  )
}

export { statusLabels }
