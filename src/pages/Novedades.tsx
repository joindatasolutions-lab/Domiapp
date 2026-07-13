import { AlertCircle, Camera, CheckCircle2, Clock3, MessageCircle, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useOrders } from '../hooks/useOrders'
import { formatOrderNumber } from '../lib/utils'

const noveltyTypes = [
  'Cliente no responde',
  'Direccion incorrecta',
  'Entregado a porteria',
  'Retraso',
  'Rechazo de entrega',
  'Destinatario ausente',
  'Tarjeta de mensaje incorrecta',
  'Cambio de direccion',
  'Otra novedad'
]

type NoveltyStatus = 'Sin resolver' | 'En seguimiento' | 'Resuelta'

interface Novelty {
  id: number
  orderNumber: string
  customer: string
  type: string
  observations: string
  status: NoveltyStatus
  evidenceName?: string
}

const statusStyles: Record<NoveltyStatus, string> = {
  'Sin resolver': 'bg-rose-50 text-rose-700 ring-rose-100',
  'En seguimiento': 'bg-amber-50 text-amber-700 ring-amber-100',
  Resuelta: 'bg-emerald-50 text-emerald-700 ring-emerald-100'
}

export default function Novedades() {
  const { data: orders = [] } = useOrders()
  const [query, setQuery] = useState('')
  const [orderId, setOrderId] = useState('')
  const [type, setType] = useState(noveltyTypes[0])
  const [observations, setObservations] = useState('')
  const [evidenceName, setEvidenceName] = useState('')
  const [novelties, setNovelties] = useState<Novelty[]>([])

  const selectedOrder = orders.find((order) => order.id === orderId)
  const filteredNovelties = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return novelties

    return novelties.filter((novelty) =>
      [novelty.orderNumber, novelty.customer, novelty.type, novelty.observations]
        .join(' ')
        .toLowerCase()
        .includes(term)
    )
  }, [novelties, query])

  const registerNovelty = () => {
    if (!selectedOrder || !observations.trim()) return

    setNovelties((current) => [
      {
        id: Date.now(),
        orderNumber: formatOrderNumber(selectedOrder.number),
        customer: selectedOrder.customer,
        type,
        observations: observations.trim(),
        status: 'Sin resolver',
        evidenceName: evidenceName || undefined
      },
      ...current
    ])
    setOrderId('')
    setType(noveltyTypes[0])
    setObservations('')
    setEvidenceName('')
  }

  const updateStatus = (id: number, status: NoveltyStatus) => {
    setNovelties((current) => current.map((novelty) => (novelty.id === id ? { ...novelty, status } : novelty)))
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-sm font-semibold text-muted">Domicilios</p>
        <h1 className="mt-1 text-3xl font-black text-ink">Novedades</h1>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-black text-ink">
            Pedido
            <select
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              className="h-12 rounded-2xl bg-surface px-4 text-sm font-bold outline-none ring-1 ring-black/5"
            >
              <option value="">Seleccionar pedido</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {formatOrderNumber(order.number)} - {order.customer}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-black text-ink">
            Tipo de novedad
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-12 rounded-2xl bg-surface px-4 text-sm font-bold outline-none ring-1 ring-black/5"
            >
              {noveltyTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-black text-ink">
          Observaciones
          <textarea
            value={observations}
            onChange={(event) => setObservations(event.target.value)}
            rows={4}
            className="rounded-2xl bg-surface px-4 py-3 text-sm font-semibold outline-none ring-1 ring-black/5"
            placeholder="Describe lo ocurrido con la entrega"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-ink shadow-soft ring-1 ring-black/5">
            <Camera size={18} />
            {evidenceName || 'Agregar evidencia'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setEvidenceName(event.target.files?.[0]?.name ?? '')}
            />
          </label>
          <Button onClick={registerNovelty} disabled={!selectedOrder || !observations.trim()}>
            <AlertCircle size={18} />
            Registrar novedad
          </Button>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft ring-1 ring-black/5">
          <Search size={18} className="text-primary" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
            placeholder="Buscar por pedido, cliente o novedad"
          />
        </div>

        {filteredNovelties.length ? (
          filteredNovelties.map((novelty) => (
            <Card key={novelty.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-primary">{novelty.orderNumber}</p>
                  <h2 className="truncate text-lg font-black text-ink">{novelty.customer}</h2>
                  <p className="mt-1 text-sm font-bold text-muted">{novelty.type}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyles[novelty.status]}`}>
                  {novelty.status}
                </span>
              </div>

              <p className="text-sm font-semibold leading-6 text-muted">{novelty.observations}</p>
              {novelty.evidenceName ? (
                <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-bold text-muted">
                  <Camera size={14} />
                  {novelty.evidenceName}
                </p>
              ) : null}

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateStatus(novelty.id, 'Sin resolver')}
                  className="h-10 rounded-xl bg-rose-50 text-xs font-black text-rose-700"
                >
                  Sin resolver
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(novelty.id, 'En seguimiento')}
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-amber-50 text-xs font-black text-amber-700"
                >
                  <Clock3 size={14} />
                  Seguimiento
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(novelty.id, 'Resuelta')}
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-emerald-50 text-xs font-black text-emerald-700"
                >
                  <CheckCircle2 size={14} />
                  Resuelta
                </button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="grid justify-items-center gap-3 py-10 text-center">
            <MessageCircle size={32} className="text-primary" />
            <div>
              <h2 className="text-xl font-black text-ink">Sin novedades registradas</h2>
              <p className="mt-1 text-sm font-semibold text-muted">Las novedades del turno apareceran aqui.</p>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}
