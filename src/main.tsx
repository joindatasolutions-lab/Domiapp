import React, { FormEvent, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  Bike,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Clock3,
  FileText,
  Flower2,
  History,
  Eye,
  EyeOff,
  LayoutList,
  LockKeyhole,
  LogOut,
  Map,
  MapPin,
  MessageSquare,
  Menu,
  Navigation,
  Package,
  PenLine,
  Phone,
  Radio,
  Settings,
  ShieldCheck,
  Star,
  GripVertical,
  Hand,
  Search,
  User,
  ArrowLeft,
} from 'lucide-react'
import './styles.css'

const LOCAL_API_URL = import.meta.env.VITE_API_LOCAL_BASE_URL || 'http://127.0.0.1:8000/api/v1'
const PRODUCTION_API_URL = import.meta.env.VITE_API_PRODUCTION_BASE_URL || 'https://domicilios-708265049038.us-central1.run.app/api/v1'
const API_TARGET = import.meta.env.VITE_API_TARGET === 'local' ? 'local' : 'production'
const API_URL = import.meta.env.VITE_API_BASE_URL || (API_TARGET === 'local' ? LOCAL_API_URL : PRODUCTION_API_URL)
const SESSION_KEY = 'domiapp.session'

type DeliveryStepKey = 'asignado' | 'en_ruta' | 'entregado'

const NOVEDAD_OPTIONS = [
  { label: 'Cliente no disponible', value: 'cliente_no_disponible' },
  { label: 'Dirección incorrecta', value: 'direccion_incorrecta' },
  { label: 'Rehusado por el cliente', value: 'rechazado_por_cliente' },
  { label: 'Arreglo dañado', value: 'arreglo_danado' },
  { label: 'Otra novedad', value: 'otra_novedad' }
]

interface Domiciliario {
  id_empleado: number
  empresa_id: number
  sucursal_id: number | null
  nombre_empleado: string
  usuario: string | null
  email: string | null
  cargo: string
  foto_url?: string | null
  tenant?: {
    logo_url?: string | null
    nombre?: string | null
    nombre_empresa?: string | null
    razon_social?: string | null
  } | null
}

interface AuthSession {
  access_token: string
  token_type: string
  domiciliario: Domiciliario
}

type ProfilePhotoResponse = {
  foto_url?: string | null
  fotoUrl?: string | null
  url?: string | null
  cloudfront_url?: string | null
  cloudFrontUrl?: string | null
  empleado?: Partial<Domiciliario> | null
  domiciliario?: Partial<Domiciliario> | null
  data?: ProfilePhotoResponse | null
  perfil?: ProfilePhotoResponse | null
}

interface PedidoDisponible {
  numero_pedido: number | null
  destinatario: string
  telefono_destinatario: string
  arreglo: string
  imagen_arreglo?: string | null
  imagenes_arreglo?: string[]
  direccion: string
  barrio: string
  zona: string
  hora_entrega: string
  fecha_entrega: string
  estado_entrega?: string | null
  asignado_en?: string | null
  hora_asignado?: string | null
  fechaasignacion?: string | null
  fecha_asignacion?: string | null
  hora_asignacion?: string | null
  en_ruta_en?: string | null
  hora_en_ruta?: string | null
  fecha_inicio_entrega?: string | null
  entregado_en?: string | null
  hora_entregado?: string | null
  fecha_entrega_real?: string | null
  fechaentrega?: string | null
  hora_entrega_real?: string | null
  tipo_novedad?: string | null
  motivo_no_entregado?: string | null
  motivonoentregado?: string | null
  descripcion_novedad?: string | null
  descripcion?: string | null
  observaciones?: string | null
  evidencia_foto_url?: string | null
  evidenciafotourl?: string | null
}

async function loginDomiciliario(usuario: string, password: string) {
  const response = await fetch(`${API_URL}/auth/domiciliarios/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      usuario,
      password
    })
  })

  if (!response.ok) {
    throw new Error('Usuario o contraseña inválidos')
  }

  return response.json() as Promise<AuthSession>
}

async function subirFotoPerfil(token: string, file: File) {
  const formData = new FormData()
  formData.append('foto', file)

  const response = await fetch(`${API_URL}/auth/domiciliarios/me/foto`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'No fue posible actualizar la foto de perfil')
  }

  return data as ProfilePhotoResponse
}

function extractProfilePhotoUrl(data: ProfilePhotoResponse | null) {
  if (!data) return null

  return data.foto_url ||
    data.fotoUrl ||
    data.url ||
    data.cloudfront_url ||
    data.cloudFrontUrl ||
    data.empleado?.foto_url ||
    data.domiciliario?.foto_url ||
    extractProfilePhotoUrl(data.data || null) ||
    extractProfilePhotoUrl(data.perfil || null)
}

function normalizePedidosResponse(data: unknown) {
  if (Array.isArray(data)) return data as PedidoDisponible[]
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: PedidoDisponible[] }).items
  }
  if (data && typeof data === 'object' && Array.isArray((data as { pedidos?: unknown }).pedidos)) {
    return (data as { pedidos: PedidoDisponible[] }).pedidos
  }

  return []
}

function pedidosQueryParams(fechaEntrega: string, empresaId?: number, sucursalId?: number | null) {
  const params = new URLSearchParams({
    limit: '100',
    offset: '0'
  })

  if (empresaId) {
    params.set('empresa_id', String(empresaId))
  }

  if (sucursalId) {
    params.set('sucursal_id', String(sucursalId))
  }

  if (fechaEntrega !== todayInputValue()) {
    params.set('fecha', fechaEntrega)
  }

  return params
}

async function getPedidosDisponibles(fechaEntrega: string, empresaId: number, sucursalId?: number | null) {
  const params = pedidosQueryParams(fechaEntrega, empresaId, sucursalId)

  const response = await fetch(`${API_URL}/pedidos/disponibles?${params}`)

  if (!response.ok) {
    throw new Error('No se pudieron cargar los pedidos disponibles')
  }

  const data = await response.json()
  return normalizePedidosResponse(data)
}

async function getPedidosAsignados(token: string, fechaEntrega: string, empresaId: number, sucursalId?: number | null) {
  const params = pedidosQueryParams(fechaEntrega, empresaId, sucursalId)

  const response = await fetch(`${API_URL}/pedidos/asignados?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('No se pudieron cargar tus pedidos')
  }

  const data = await response.json()
  return normalizePedidosResponse(data)
}

function sucursalQueryParam(sucursalId?: number | null) {
  return sucursalId ? `?sucursal_id=${encodeURIComponent(String(sucursalId))}` : ''
}

async function asignarmePedido(token: string, numeroPedido: number, sucursalId?: number | null) {
  const response = await fetch(`${API_URL}/pedidos/${numeroPedido}/asignarme${sucursalQueryParam(sucursalId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'No fue posible asignar el pedido')
  }

  return data
}

async function devolverPedido(token: string, numeroPedido: number, sucursalId?: number | null) {
  const response = await fetch(`${API_URL}/pedidos/${numeroPedido}/devolver${sucursalQueryParam(sucursalId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'No fue posible devolver el pedido')
  }

  return data
}

async function iniciarEntrega(token: string, numeroPedido: number, sucursalId?: number | null) {
  const response = await fetch(`${API_URL}/pedidos/${numeroPedido}/iniciar-entrega${sucursalQueryParam(sucursalId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'No fue posible iniciar la entrega')
  }

  return data
}

async function marcarPedidoEntregado(token: string, numeroPedido: number, sucursalId?: number | null) {
  const response = await fetch(`${API_URL}/pedidos/${numeroPedido}/entregar${sucursalQueryParam(sucursalId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'No fue posible marcar el pedido como entregado')
  }

  return data
}

async function reportarNovedadPedido(
  token: string,
  numeroPedido: number,
  payload: {
    tipo_novedad: string
    descripcion: string
    evidencia_foto_url: string | null
  }
) {
  const response = await fetch(`${API_URL}/pedidos/${numeroPedido}/novedad`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'No fue posible guardar la novedad')
  }

  return data
}

function todayInputValue() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function dateOnly(value?: string | null) {
  return String(value ?? '').slice(0, 10)
}

function formatDateLabel(value: string) {
  if (!value) return ''

  const [year, month, day] = value.split('-')
  return day && month && year ? `${day}/${month}/${year}` : value
}

function formatDateControl(value: string) {
  if (!value) return ''

  const [year, month, day] = value.split('-')
  return day && month && year ? `${day}-${month}-${year}` : value
}

function formatTimeLabel(value?: string | null) {
  if (!value) return null

  const normalized = String(value).trim()
  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})/)
  if (timeMatch) return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`

  const parsedDate = new Date(normalized)
  if (Number.isNaN(parsedDate.getTime())) return null

  return parsedDate.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

function formatDateTimeLabel(value?: string | null) {
  if (!value) return null

  const normalized = String(value).trim()
  if (!normalized || !/\d{4}-\d{2}-\d{2}/.test(normalized)) return null

  const dateLabel = formatDateLabel(dateOnly(normalized))
  const timeLabel = formatTimeLabel(normalized)
  if (!dateLabel || !timeLabel) return null

  return `${dateLabel}\n${timeLabel}`
}

function currentTimeLabel() {
  return new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

function isPlaceholderEventTime(value?: string | null) {
  const formattedTime = formatTimeLabel(value)
  return !formattedTime || formattedTime === '00:00'
}

function eventTimeLabel(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const formattedTime = formatTimeLabel(value)
    if (formattedTime && formattedTime !== '00:00') return formattedTime
  }

  return null
}

function eventDateTimeLabel(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const formattedDateTime = formatDateTimeLabel(value)
    if (formattedDateTime && !formattedDateTime.endsWith('\n00:00')) return formattedDateTime
  }

  return eventTimeLabel(...values)
}

function deliveryOrderValue(pedido: PedidoDisponible) {
  const normalizedTime = String(pedido.hora_entrega ?? '').trim()
  const [hours = '99', minutes = '99'] = normalizedTime.split(':')
  const parsedHours = Number.parseInt(hours, 10)
  const parsedMinutes = Number.parseInt(minutes, 10)

  return (Number.isFinite(parsedHours) ? parsedHours : 99) * 60 + (Number.isFinite(parsedMinutes) ? parsedMinutes : 99)
}

function pedidoRouteKey(pedido: PedidoDisponible) {
  return String(pedido.numero_pedido ?? `${pedido.destinatario}-${pedido.direccion}-${pedido.fecha_entrega}`)
}

function normalizedDeliveryStatus(value?: string | null) {
  const normalized = String(value ?? '').toLowerCase()

  if (normalized.includes('no_entregado') || normalized.includes('no entreg')) return 'no_entregado'
  if (normalized.includes('cancel')) return 'cancelado'
  if (normalized.includes('entreg')) return 'entregado'
  if (normalized.includes('ruta') || normalized.includes('camino')) return 'en_ruta'
  if (normalized.includes('asign')) return 'asignado'

  return 'pendiente'
}

function detailStatusLabel(value?: string | null) {
  const status = normalizedDeliveryStatus(value)

  if (status === 'asignado') return 'Asignado'
  if (status === 'en_ruta') return 'En camino'
  if (status === 'entregado') return 'Entregado'
  if (status === 'no_entregado') return 'No entregado'
  if (status === 'cancelado') return 'Cancelado'

  return 'Pendiente'
}

function deliveryStepIndex(value?: string | null) {
  const status = normalizedDeliveryStatus(value)

  if (status === 'entregado') return 2
  if (status === 'en_ruta') return 1

  return 0
}

function deliveryStepState(stepIndex: number, currentIndex: number, status?: string | null) {
  if (normalizedDeliveryStatus(status) === 'entregado' && stepIndex <= currentIndex) return 'done'
  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return 'active'

  return 'pending'
}

function wazeUrl(address?: string | null) {
  return `https://waze.com/ul?q=${encodeURIComponent(address || '')}&navigate=yes`
}

function novedadTypeLabel(value?: string | null) {
  return NOVEDAD_OPTIONS.find((option) => option.value === value)?.label || value || 'Novedad reportada'
}

function pedidoNovedadInfo(pedido: PedidoDisponible) {
  const tipoNovedad = pedido.tipo_novedad || null
  const motivo = pedido.motivo_no_entregado || pedido.motivonoentregado || novedadTypeLabel(tipoNovedad)
  const descripcion = pedido.descripcion_novedad || pedido.descripcion || pedido.observaciones || null
  const evidenciaFotoUrl = pedido.evidencia_foto_url || pedido.evidenciafotourl || null

  return {
    tipoNovedad,
    motivo,
    descripcion,
    evidenciaFotoUrl
  }
}

function mergePedidoEstado(pedido: PedidoDisponible, data: Partial<PedidoDisponible> & { estado?: string | null }) {
  return {
    ...pedido,
    estado_entrega: data.estado || data.estado_entrega || pedido.estado_entrega,
    asignado_en: data.asignado_en ?? data.fechaasignacion ?? data.fecha_asignacion ?? pedido.asignado_en,
    hora_asignado: data.hora_asignado ?? data.hora_asignacion ?? pedido.hora_asignado,
    fechaasignacion: data.fechaasignacion ?? pedido.fechaasignacion,
    fecha_asignacion: data.fecha_asignacion ?? pedido.fecha_asignacion,
    hora_asignacion: data.hora_asignacion ?? pedido.hora_asignacion,
    en_ruta_en: data.en_ruta_en ?? data.fecha_inicio_entrega ?? pedido.en_ruta_en,
    hora_en_ruta: data.hora_en_ruta ?? pedido.hora_en_ruta,
    fecha_inicio_entrega: data.fecha_inicio_entrega ?? pedido.fecha_inicio_entrega,
    entregado_en: data.entregado_en ?? data.fecha_entrega_real ?? data.fechaentrega ?? pedido.entregado_en,
    hora_entregado: data.hora_entregado ?? data.hora_entrega_real ?? pedido.hora_entregado,
    fecha_entrega_real: data.fecha_entrega_real ?? data.fechaentrega ?? pedido.fecha_entrega_real,
    fechaentrega: data.fechaentrega ?? pedido.fechaentrega,
    hora_entrega_real: data.hora_entrega_real ?? pedido.hora_entrega_real,
    tipo_novedad: data.tipo_novedad ?? pedido.tipo_novedad,
    motivo_no_entregado: data.motivo_no_entregado ?? data.motivonoentregado ?? pedido.motivo_no_entregado,
    motivonoentregado: data.motivonoentregado ?? pedido.motivonoentregado,
    descripcion_novedad: data.descripcion_novedad ?? data.descripcion ?? data.observaciones ?? pedido.descripcion_novedad,
    descripcion: data.descripcion ?? pedido.descripcion,
    observaciones: data.observaciones ?? pedido.observaciones,
    evidencia_foto_url: data.evidencia_foto_url ?? data.evidenciafotourl ?? pedido.evidencia_foto_url,
    evidenciafotourl: data.evidenciafotourl ?? pedido.evidenciafotourl
  }
}

function deliveryStepTime(pedido: PedidoDisponible, stepKey: DeliveryStepKey) {
  if (stepKey === 'asignado') {
    return eventDateTimeLabel(
      pedido.asignado_en,
      pedido.fechaasignacion,
      pedido.fecha_asignacion,
      pedido.hora_asignado,
      pedido.hora_asignacion
    )
  }

  if (stepKey === 'en_ruta') {
    return eventDateTimeLabel(
      pedido.en_ruta_en,
      pedido.fecha_inicio_entrega,
      pedido.hora_en_ruta
    )
  }

  return eventDateTimeLabel(
    pedido.entregado_en,
    pedido.fecha_entrega_real,
    pedido.fechaentrega,
    pedido.hora_entregado,
    pedido.hora_entrega_real
  )
}

function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as Partial<AuthSession>
    if (!session.access_token || !session.domiciliario?.empresa_id || !session.domiciliario?.nombre_empleado) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }

    return session as AuthSession
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function LoginScreen({ onLogin }: { onLogin: (session: AuthSession) => void }) {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const session = await loginDomiciliario(usuario.trim(), password)
      saveSession(session)
      onLogin(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="phone-frame" aria-label="Inicio de sesión DomiApp">
        <div className="phone-notch" aria-hidden="true" />
        <div className="login-background" aria-hidden="true" />

        <div className="login-content">
          <header className="brand">
            <div className="brand-mark">
              <img src="/img/logo.png" alt="PetalOps" />
            </div>
            <h1>PetalOps</h1>
            <p className="product-label">DomiApp</p>
          </header>

          <section className="welcome">
            <h2>Bienvenido</h2>
            <p>Accede para gestionar tus entregas</p>
          </section>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <User size={19} aria-hidden="true" />
              <span className="sr-only">Usuario</span>
              <input
                type="text"
                placeholder="Usuario"
                autoComplete="username"
                value={usuario}
                onChange={(event) => setUsuario(event.target.value)}
                required
              />
            </label>

            <label className="field password-field">
              <LockKeyhole size={18} aria-hidden="true" />
              <span className="sr-only">Contraseña</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
              </button>
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button type="submit" className="primary-action" disabled={isSubmitting}>
              {isSubmitting ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="version">Versión 1.0.0</p>
        </div>
      </section>
    </main>
  )
}

function AvailableOrdersScreen({
  session,
  onLogout,
  onSessionUpdate
}: {
  session: AuthSession
  onLogout: () => void
  onSessionUpdate: (session: AuthSession) => void
}) {
  const [pedidos, setPedidos] = useState<PedidoDisponible[]>([])
  const [misPedidos, setMisPedidos] = useState<PedidoDisponible[]>([])
  const [mainTab, setMainTab] = useState<'ordenes' | 'mapa' | 'historial' | 'perfil'>('ordenes')
  const [activeTab, setActiveTab] = useState<'disponibles' | 'mis-pedidos'>('disponibles')
  const [selectedDate, setSelectedDate] = useState(todayInputValue)
  const [showAllDates, setShowAllDates] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)
  const [assigningPedido, setAssigningPedido] = useState<number | null>(null)
  const [returningPedido, setReturningPedido] = useState<number | null>(null)
  const [startingPedido, setStartingPedido] = useState<number | null>(null)
  const [deliveringPedido, setDeliveringPedido] = useState<number | null>(null)
  const [selectedPedido, setSelectedPedido] = useState<PedidoDisponible | null>(null)
  const [routePedido, setRoutePedido] = useState<PedidoDisponible | null>(null)
  const [proofPedido, setProofPedido] = useState<PedidoDisponible | null>(null)
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(null)
  const [proofRecipientName, setProofRecipientName] = useState('')
  const [novedadPedido, setNovedadPedido] = useState<PedidoDisponible | null>(null)
  const [novedadType, setNovedadType] = useState(NOVEDAD_OPTIONS[0].value)
  const [novedadDescription, setNovedadDescription] = useState('')
  const [novedadPhotoUrl, setNovedadPhotoUrl] = useState<string | null>(null)
  const [savingNovedadPedido, setSavingNovedadPedido] = useState<number | null>(null)
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState<string | null>(null)
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false)
  const [localPedidosEnCurso, setLocalPedidosEnCurso] = useState<PedidoDisponible[]>([])
  const [routeOrder, setRouteOrder] = useState<string[]>([])
  const [dragState, setDragState] = useState<{ key: string; startY: number; currentY: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const dateInputRef = useRef<HTMLInputElement | null>(null)
  const proofPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const novedadPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null)
  const activeEmpresaId = session.domiciliario.empresa_id
  const activeSucursalId = session.domiciliario.sucursal_id

  const loadOrders = async (excludedPedidoNumbers: number[] = [], extraDisponibles: PedidoDisponible[] = []) => {
    setIsLoading(true)
    setError(null)

    try {
      const [disponibles, asignados] = await Promise.all([
        getPedidosDisponibles(selectedDate, activeEmpresaId, activeSucursalId),
        getPedidosAsignados(session.access_token, selectedDate, activeEmpresaId, activeSucursalId)
      ])
      const filteredAsignados = asignados.filter((pedido) =>
        !excludedPedidoNumbers.includes(Number(pedido.numero_pedido))
      )
      const missingExtraDisponibles = extraDisponibles.filter((extraPedido) =>
        !disponibles.some((pedido) => pedido.numero_pedido === extraPedido.numero_pedido)
      )

      setPedidos([...disponibles, ...missingExtraDisponibles])
      setMisPedidos((currentPedidos) => {
        const localActivePedidos = [...currentPedidos, ...localPedidosEnCurso].filter((pedido) => {
          const status = normalizedDeliveryStatus(pedido.estado_entrega)
          return (status === 'en_ruta' || status === 'asignado') &&
            !excludedPedidoNumbers.includes(Number(pedido.numero_pedido))
        })
        const missingActivePedidos = localActivePedidos.filter((localPedido) =>
          !filteredAsignados.some((pedido) => pedido.numero_pedido === localPedido.numero_pedido)
        )

        return [...filteredAsignados, ...missingActivePedidos]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar los pedidos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [session.access_token, selectedDate, activeEmpresaId, activeSucursalId])

  useEffect(() => {
    if (!assignSuccess) return

    const timeoutId = window.setTimeout(() => {
      setAssignSuccess(null)
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [assignSuccess])

  const handleAsignarme = async (numeroPedido: number | null) => {
    if (!numeroPedido) {
      setAssignError('Este pedido no tiene número válido para asignación')
      return
    }

    setAssigningPedido(numeroPedido)
    setAssignError(null)
    setAssignSuccess(null)

    try {
      const result = await asignarmePedido(session.access_token, numeroPedido, activeSucursalId)
      const pedidoAsignado = pedidos.find((pedido) => pedido.numero_pedido === numeroPedido)

      if (pedidoAsignado) {
        const nextPedido = {
          ...mergePedidoEstado(pedidoAsignado, result),
          numero_pedido: numeroPedido,
          estado_entrega: result?.estado || result?.estado_entrega || 'asignado'
        }

        setPedidos((currentPedidos) => currentPedidos.filter((pedido) => pedido.numero_pedido !== numeroPedido))
        setMisPedidos((currentPedidos) => [
          ...currentPedidos.filter((pedido) => pedido.numero_pedido !== numeroPedido),
          nextPedido
        ])
        setLocalPedidosEnCurso((currentPedidos) => [
          ...currentPedidos.filter((pedido) => pedido.numero_pedido !== numeroPedido),
          nextPedido
        ])
      }

      setAssignSuccess(result?.mensaje || 'Pedido asignado correctamente')
      await loadOrders()
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'No fue posible asignar el pedido')
    } finally {
      setAssigningPedido(null)
    }
  }

  const handleDevolver = async (numeroPedido: number | null) => {
    if (!numeroPedido) {
      setAssignError('Este pedido no tiene número válido para devolución')
      return
    }

    setReturningPedido(numeroPedido)
    setAssignError(null)
    setAssignSuccess(null)

    try {
      const result = await devolverPedido(session.access_token, numeroPedido, activeSucursalId)
      const pedidoDevuelto = misPedidos.find((pedido) => pedido.numero_pedido === numeroPedido)
      const nextPedidoDisponible = pedidoDevuelto
        ? {
          ...pedidoDevuelto,
          estado_entrega: result?.estado || result?.estado_entrega || 'pendiente',
          asignado_en: null,
          hora_asignado: null,
          fechaasignacion: null,
          fecha_asignacion: null,
          hora_asignacion: null,
          en_ruta_en: null,
          hora_en_ruta: null,
          fecha_inicio_entrega: null
        }
        : null

      setAssignSuccess(result?.mensaje || 'Pedido devuelto correctamente')
      setMisPedidos((currentPedidos) =>
        currentPedidos.filter((pedido) => pedido.numero_pedido !== numeroPedido)
      )
      setPedidos((currentPedidos) => {
        if (!nextPedidoDisponible || currentPedidos.some((pedido) => pedido.numero_pedido === numeroPedido)) {
          return currentPedidos
        }

        return [...currentPedidos, nextPedidoDisponible]
      })
      setLocalPedidosEnCurso((currentPedidos) =>
        currentPedidos.filter((pedido) => pedido.numero_pedido !== numeroPedido)
      )
      setSelectedPedido((current) => current?.numero_pedido === numeroPedido ? null : current)
      setRoutePedido((current) => current?.numero_pedido === numeroPedido ? null : current)
      await loadOrders([numeroPedido], nextPedidoDisponible ? [nextPedidoDisponible] : [])
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'No fue posible devolver el pedido')
    } finally {
      setReturningPedido(null)
    }
  }

  const handleIniciarEntrega = async (numeroPedido: number | null) => {
    if (!numeroPedido) {
      setAssignError('Este pedido no tiene número válido para iniciar entrega')
      return
    }

    setStartingPedido(numeroPedido)
    setAssignError(null)
    setAssignSuccess(null)

    try {
      const result = await iniciarEntrega(session.access_token, numeroPedido, activeSucursalId)
      const nextEstado = result?.estado || 'en_ruta'
      const nextRoutePedido = {
        ...mergePedidoEstado(selectedPedido ?? ({} as PedidoDisponible), result),
        numero_pedido: numeroPedido,
        estado_entrega: nextEstado
      }
      setAssignSuccess(result?.mensaje || 'Entrega iniciada correctamente')
      setMisPedidos((currentPedidos) =>
        currentPedidos.map((pedido) =>
          pedido.numero_pedido === numeroPedido ? mergePedidoEstado(pedido, result) : pedido
        )
      )
      setLocalPedidosEnCurso((currentPedidos) => [
        ...currentPedidos.filter((pedido) => pedido.numero_pedido !== numeroPedido),
        nextRoutePedido
      ])
      setSelectedPedido((current) =>
        current?.numero_pedido === numeroPedido
          ? mergePedidoEstado(current, result)
          : current
      )
      setRoutePedido(nextRoutePedido)
      setSelectedPedido(null)
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'No fue posible iniciar la entrega')
    } finally {
      setStartingPedido(null)
    }
  }

  const handleMarcarEntregado = async (numeroPedido: number | null) => {
    if (!numeroPedido) {
      setAssignError('Este pedido no tiene número válido para marcar entrega')
      return false
    }

    setDeliveringPedido(numeroPedido)
    setAssignError(null)
    setAssignSuccess(null)

    try {
      const result = await marcarPedidoEntregado(session.access_token, numeroPedido, activeSucursalId)
      const nextEstado = result?.estado || 'entregado'
      const deliveredResult = {
        ...result,
        estado: nextEstado,
        entregado_en: result?.entregado_en ?? result?.fecha_entrega_real ?? result?.fechaentrega ?? new Date().toISOString(),
        hora_entregado: eventTimeLabel(result?.hora_entregado, result?.hora_entrega_real, result?.entregado_en, result?.fecha_entrega_real, result?.fechaentrega) ?? currentTimeLabel()
      }

      setAssignSuccess(result?.mensaje || 'Pedido marcado como entregado')
      setMisPedidos((currentPedidos) =>
        currentPedidos.map((pedido) =>
          pedido.numero_pedido === numeroPedido ? mergePedidoEstado(pedido, deliveredResult) : pedido
        )
      )
      setSelectedPedido((current) =>
        current?.numero_pedido === numeroPedido ? mergePedidoEstado(current, deliveredResult) : current
      )
      setRoutePedido((current) =>
        current?.numero_pedido === numeroPedido ? mergePedidoEstado(current, deliveredResult) : current
      )
      setLocalPedidosEnCurso((currentPedidos) =>
        currentPedidos.filter((pedido) => pedido.numero_pedido !== numeroPedido)
      )
      return true
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'No fue posible marcar el pedido como entregado')
      return false
    } finally {
      setDeliveringPedido(null)
    }
  }

  const openDeliveryProof = (pedido: PedidoDisponible) => {
    setProofPedido(pedido)
    setProofPhotoUrl(pedido.imagen_arreglo || pedido.imagenes_arreglo?.[0] || '/img/logo.png')
    setProofRecipientName('')
  }

  const handleProofPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setProofPhotoUrl(URL.createObjectURL(file))
  }

  const handleConfirmDeliveryProof = async () => {
    if (!proofPedido) return

    const wasDelivered = await handleMarcarEntregado(proofPedido.numero_pedido)
    if (wasDelivered) {
      setProofPedido(null)
    }
  }

  const openNovedadReport = (pedido: PedidoDisponible) => {
    setNovedadPedido(pedido)
    setNovedadType(NOVEDAD_OPTIONS[0].value)
    setNovedadDescription('')
    setNovedadPhotoUrl(null)
    setAssignError(null)
  }

  const handleNovedadPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setNovedadPhotoUrl(URL.createObjectURL(file))
  }

  const handleSaveNovedad = async () => {
    if (!novedadPedido) return
    if (!novedadPedido.numero_pedido) {
      setAssignError('Este pedido no tiene número válido para guardar novedad')
      return
    }

    setSavingNovedadPedido(novedadPedido.numero_pedido)
    setAssignError(null)
    setAssignSuccess(null)

    try {
      const evidenciaFotoUrl = novedadPhotoUrl?.startsWith('http') ? novedadPhotoUrl : null
      const result = await reportarNovedadPedido(session.access_token, novedadPedido.numero_pedido, {
        tipo_novedad: novedadType,
        descripcion: novedadDescription.trim(),
        evidencia_foto_url: evidenciaFotoUrl
      })
      const nextPedido = mergePedidoEstado(novedadPedido, {
        ...result,
        estado: result?.estado || result?.estado_entrega || 'no_entregado',
        tipo_novedad: result?.tipo_novedad || novedadType,
        motivo_no_entregado: result?.motivo_no_entregado || result?.motivonoentregado || novedadTypeLabel(novedadType),
        descripcion_novedad: result?.descripcion_novedad || result?.descripcion || result?.observaciones || novedadDescription.trim(),
        evidencia_foto_url: result?.evidencia_foto_url || result?.evidenciafotourl || evidenciaFotoUrl
      })

      setMisPedidos((currentPedidos) =>
        currentPedidos.map((pedido) =>
          pedido.numero_pedido === novedadPedido.numero_pedido ? nextPedido : pedido
        )
      )
      setRoutePedido((current) =>
        current?.numero_pedido === novedadPedido.numero_pedido ? nextPedido : current
      )
      setLocalPedidosEnCurso((currentPedidos) =>
        currentPedidos.filter((pedido) => pedido.numero_pedido !== novedadPedido.numero_pedido)
      )
      setAssignSuccess(result?.mensaje || 'Novedad guardada correctamente')
      setNovedadPedido(null)
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'No fue posible guardar la novedad')
    } finally {
      setSavingNovedadPedido(null)
    }
  }

  const handleProfilePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setProfilePhotoPreviewUrl(previewUrl)
    setIsUploadingProfilePhoto(true)
    setAssignError(null)
    setAssignSuccess(null)

    try {
      const result = await subirFotoPerfil(session.access_token, file)
      const fotoUrl = extractProfilePhotoUrl(result)
      if (!fotoUrl) {
        setAssignError('La foto subió, pero el backend no devolvió foto_url para guardarla en el perfil')
        return
      }

      const nextSession = {
        ...session,
        domiciliario: {
          ...session.domiciliario,
          ...(result?.empleado || {}),
          ...(result?.domiciliario || {}),
          foto_url: fotoUrl
        }
      }

      saveSession(nextSession)
      onSessionUpdate(nextSession)
      setProfilePhotoPreviewUrl(null)
      setAssignSuccess(result?.mensaje || 'Foto de perfil actualizada')
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'No fue posible actualizar la foto de perfil')
    } finally {
      setIsUploadingProfilePhoto(false)
      event.target.value = ''
    }
  }

  const safePedidos = Array.isArray(pedidos) ? pedidos : []
  const safeMisPedidos = Array.isArray(misPedidos) ? misPedidos : []
  const disponiblesPorFecha = showAllDates
    ? safePedidos
    : safePedidos.filter((pedido) => dateOnly(pedido.fecha_entrega) === selectedDate)
  const misPedidosPorFecha = showAllDates
    ? safeMisPedidos
    : safeMisPedidos.filter((pedido) => dateOnly(pedido.fecha_entrega) === selectedDate)

  useEffect(() => {
    const visibleKeys = (showAllDates
      ? safeMisPedidos
      : safeMisPedidos.filter((pedido) => dateOnly(pedido.fecha_entrega) === selectedDate)
    )
      .sort((firstPedido, secondPedido) => {
        const timeDifference = deliveryOrderValue(firstPedido) - deliveryOrderValue(secondPedido)
        if (timeDifference !== 0) return timeDifference

        return Number(firstPedido.numero_pedido ?? 0) - Number(secondPedido.numero_pedido ?? 0)
      })
      .map(pedidoRouteKey)

    setRouteOrder((currentOrder) => {
      const nextOrder = [
        ...currentOrder.filter((pedidoKey) => visibleKeys.includes(pedidoKey)),
        ...visibleKeys.filter((pedidoKey) => !currentOrder.includes(pedidoKey))
      ]

      return nextOrder.join('|') === currentOrder.join('|') ? currentOrder : nextOrder
    })
  }, [misPedidos, selectedDate, showAllDates])

  const pedidosVisiblesPorFecha = activeTab === 'disponibles' ? disponiblesPorFecha : misPedidosPorFecha
  const assignedPedidos = misPedidosPorFecha.filter((pedido) => {
    const status = normalizedDeliveryStatus(pedido.estado_entrega)
    return status === 'pendiente' || status === 'asignado'
  })
  const enCaminoPedidos = misPedidosPorFecha.filter((pedido) => {
    return normalizedDeliveryStatus(pedido.estado_entrega) === 'en_ruta'
  })
  const entregadosPedidos = misPedidosPorFecha.filter((pedido) => {
    return normalizedDeliveryStatus(pedido.estado_entrega) === 'entregado'
  })
  const noEntregadosPedidos = misPedidosPorFecha.filter((pedido) => {
    return normalizedDeliveryStatus(pedido.estado_entrega) === 'no_entregado'
  })
  const completedPedidosCount = entregadosPedidos.length + noEntregadosPedidos.length
  const effectivenessRate = completedPedidosCount
    ? Math.round((entregadosPedidos.length / completedPedidosCount) * 100)
    : 100
  const profileInitials = session.domiciliario.nombre_empleado
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase())
    .join('') || 'D'
  const tenantLogoUrl = session.domiciliario.tenant?.logo_url || null
  const tenantName = session.domiciliario.tenant?.nombre ||
    session.domiciliario.tenant?.nombre_empresa ||
    session.domiciliario.tenant?.razon_social ||
    'Empresa'
  const availableDates = Array.from(
    new Set([...safePedidos, ...safeMisPedidos].map((pedido) => dateOnly(pedido.fecha_entrega)).filter(Boolean))
  ).sort()
  const firstAvailableDate = availableDates[0]
  const filteredPedidos = pedidosVisiblesPorFecha.filter((pedido) => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true

    return [
      pedido.numero_pedido,
      pedido.destinatario,
      pedido.telefono_destinatario,
      pedido.arreglo,
      pedido.direccion,
      pedido.zona,
      pedido.barrio,
      pedido.hora_entrega,
      pedido.fecha_entrega
    ]
      .map((value) => String(value ?? '').toLowerCase())
      .some((value) => value.includes(term))
  })
  const orderedPedidos = activeTab === 'mis-pedidos'
    ? [...filteredPedidos].sort((firstPedido, secondPedido) => {
      const firstIndex = routeOrder.indexOf(pedidoRouteKey(firstPedido))
      const secondIndex = routeOrder.indexOf(pedidoRouteKey(secondPedido))

      if (firstIndex !== -1 || secondIndex !== -1) {
        return (firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex) - (secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex)
      }

      const timeDifference = deliveryOrderValue(firstPedido) - deliveryOrderValue(secondPedido)
      if (timeDifference !== 0) return timeDifference

      return Number(firstPedido.numero_pedido ?? 0) - Number(secondPedido.numero_pedido ?? 0)
    })
    : filteredPedidos
  const routePlanPedidos = [...misPedidosPorFecha].sort((firstPedido, secondPedido) => {
    const firstIndex = routeOrder.indexOf(pedidoRouteKey(firstPedido))
    const secondIndex = routeOrder.indexOf(pedidoRouteKey(secondPedido))

    if (firstIndex !== -1 || secondIndex !== -1) {
      return (firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex) - (secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex)
    }

    const timeDifference = deliveryOrderValue(firstPedido) - deliveryOrderValue(secondPedido)
    if (timeDifference !== 0) return timeDifference

    return Number(firstPedido.numero_pedido ?? 0) - Number(secondPedido.numero_pedido ?? 0)
  })
  const currentRouteIndex = routePedido
    ? routePlanPedidos.findIndex((pedido) => pedidoRouteKey(pedido) === pedidoRouteKey(routePedido))
    : -1
  const nextRoutePedido = currentRouteIndex >= 0
    ? routePlanPedidos.slice(currentRouteIndex + 1).find((pedido) =>
      !['entregado', 'no_entregado', 'cancelado'].includes(normalizedDeliveryStatus(pedido.estado_entrega))
    )
    : null

  const movePedidoToIndex = (draggedKey: string, targetIndex: number) => {
    setRouteOrder((currentOrder) => {
      const withoutDragged = currentOrder.filter((pedidoKey) => pedidoKey !== draggedKey)
      const boundedIndex = Math.max(0, Math.min(targetIndex, withoutDragged.length))

      if (withoutDragged[boundedIndex] === draggedKey) return currentOrder

      return [
        ...withoutDragged.slice(0, boundedIndex),
        draggedKey,
        ...withoutDragged.slice(boundedIndex)
      ]
    })
  }

  const handleRouteDragStart = (event: React.PointerEvent<HTMLButtonElement>, pedidoKey: string) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragState({ key: pedidoKey, startY: event.clientY, currentY: event.clientY })
  }

  const handleRouteDragMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState) return

    event.preventDefault()
    setDragState((currentState) => currentState ? { ...currentState, currentY: event.clientY } : currentState)
  }

  const handleRouteDragEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragState) {
      const routeCards = Array.from(document.querySelectorAll<HTMLElement>('[data-pedido-route-key]'))
        .filter((card) => card.dataset.pedidoRouteKey !== dragState.key)
      const targetIndex = routeCards.findIndex((card) => {
        const cardBox = card.getBoundingClientRect()
        return event.clientY < cardBox.top + cardBox.height / 2
      })

      movePedidoToIndex(dragState.key, targetIndex === -1 ? routeCards.length : targetIndex)
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    setDragState(null)
  }

  return (
    <main className="app-shell">
      <section className="orders-view">
        {mainTab === 'ordenes' ? (
          <>
            <header className="mobile-topbar">
              <button type="button" aria-label="Menu">
                <Menu size={22} />
              </button>
              <div className="topbar-brand">
                <img className="app-logo" src="/img/logo.png" alt="PetalOps" />
                <span>PetalOps DomiApp</span>
              </div>
              <button type="button" className="logout-button" onClick={onLogout} aria-label="Cerrar sesión">
                <LogOut size={18} />
                <span>Salir</span>
              </button>
            </header>

        <section className="orders-hero">
          <div>
            <h1>Hola, {session.domiciliario.nombre_empleado.split(' ')[0]}</h1>
            <p>Organiza tu ruta y gestiona tus entregas</p>
          </div>
          {tenantLogoUrl ? (
            <img className="hero-tenant-logo" src={tenantLogoUrl} alt={tenantName} />
          ) : null}
        </section>

        <nav className="orders-tabs" aria-label="Tipo de pedidos">
          <button
            type="button"
            className={activeTab === 'disponibles' ? 'active' : undefined}
            onClick={() => setActiveTab('disponibles')}
          >
            Pedidos disponibles
          </button>
          <button
            type="button"
            className={activeTab === 'mis-pedidos' ? 'active' : undefined}
            onClick={() => setActiveTab('mis-pedidos')}
          >
            Mis pedidos
          </button>
        </nav>

        <section className="orders-toolbar">
          <label className="search-box">
            <Search size={18} />
            <span className="sr-only">Buscar pedido</span>
            <input
              type="search"
              placeholder="Buscar pedido"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <div className="date-pill">
            <CalendarDays size={17} />
            <button
              type="button"
              className="date-display"
              onClick={() => {
                if (typeof dateInputRef.current?.showPicker === 'function') {
                  dateInputRef.current.showPicker()
                } else {
                  dateInputRef.current?.click()
                }
              }}
            >
              {formatDateControl(selectedDate)}
            </button>
            <input
              ref={dateInputRef}
              type="date"
              aria-label="Fecha de entrega"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value)
                setShowAllDates(false)
              }}
            />
          </div>
          <button type="button" onClick={() => setShowAllDates(true)}>
            Ver todos
          </button>
        </section>

        <section className="metric-grid">
          <article>
            <span className="metric-icon pink">
              <Package size={17} />
            </span>
            <strong>{disponiblesPorFecha.length}</strong>
            <p>Disponibles</p>
          </article>
          <article>
            <span className="metric-icon purple">
              <LayoutList size={17} />
            </span>
            <strong>{assignedPedidos.length}</strong>
            <p>Asignados</p>
          </article>
          <article>
            <span className="metric-icon blue">
              <Bike size={17} />
            </span>
            <strong>{enCaminoPedidos.length}</strong>
            <p>En camino</p>
          </article>
          <article>
            <span className="metric-icon green">
              <CheckCircle2 size={17} />
            </span>
            <strong>{entregadosPedidos.length}</strong>
            <p>Entregados</p>
          </article>
        </section>

        {isLoading ? <p className="status-message">Cargando pedidos...</p> : null}
        {assignSuccess ? <p className="status-message success-message">{assignSuccess}</p> : null}
        {assignError ? <p className="status-message error-message">{assignError}</p> : null}
        {error ? (
          <div className="status-card">
            <p>{error}</p>
            <button type="button" onClick={loadOrders}>
              Reintentar
            </button>
          </div>
        ) : null}

        {!isLoading && !error ? (
          <div className="orders-list">
            {orderedPedidos.length ? (
              orderedPedidos.map((pedido, pedidoIndex) => (
                <article
                  key={pedido.numero_pedido ?? `${pedido.destinatario}-${pedido.direccion}`}
                  data-pedido-route-key={activeTab === 'mis-pedidos' ? pedidoRouteKey(pedido) : undefined}
                  style={dragState?.key === pedidoRouteKey(pedido)
                    ? { transform: `translateY(${dragState.currentY - dragState.startY}px) scale(1.02)` }
                    : undefined}
                  className={[
                    activeTab === 'mis-pedidos' ? 'order-card clickable-card route-sortable-card' : 'order-card',
                    normalizedDeliveryStatus(pedido.estado_entrega) === 'entregado' ? 'delivered-order-card' : '',
                    normalizedDeliveryStatus(pedido.estado_entrega) === 'no_entregado' ? 'not-delivered-order-card' : '',
                    dragState?.key === pedidoRouteKey(pedido) ? 'dragging' : ''
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    if (activeTab === 'mis-pedidos') {
                      const deliveryStatus = normalizedDeliveryStatus(pedido.estado_entrega)

                      if (deliveryStatus === 'en_ruta' || deliveryStatus === 'entregado' || deliveryStatus === 'no_entregado') {
                        setRoutePedido(pedido)
                        setSelectedPedido(null)
                        return
                      }

                      setSelectedPedido(pedido)
                    }
                  }}
                >
                  <div className="order-image-wrap">
                    {activeTab === 'mis-pedidos' ? (
                      <strong
                        className={[
                          'delivery-sequence',
                          normalizedDeliveryStatus(pedido.estado_entrega) === 'entregado' ? 'delivered-sequence' : '',
                          normalizedDeliveryStatus(pedido.estado_entrega) === 'no_entregado' ? 'not-delivered-sequence' : ''
                        ].filter(Boolean).join(' ')}
                        aria-label={`Entrega ${pedidoIndex + 1}`}
                      >
                        {pedidoIndex + 1}
                      </strong>
                    ) : null}
                    <img
                      src={pedido.imagen_arreglo || pedido.imagenes_arreglo?.[0] || '/img/logo.png'}
                      alt={pedido.arreglo || `Pedido ${pedido.numero_pedido}`}
                    />
                  </div>
                  <div className="order-content">
                    {activeTab === 'mis-pedidos' && normalizedDeliveryStatus(pedido.estado_entrega) === 'entregado' ? (
                      <span className="delivered-watermark">Entregado</span>
                    ) : null}
                    {activeTab === 'mis-pedidos' && normalizedDeliveryStatus(pedido.estado_entrega) === 'no_entregado' ? (
                      <span className="not-delivered-watermark">No entregado</span>
                    ) : null}
                    <div className="order-topline">
                      <strong>#{pedido.numero_pedido}</strong>
                      {activeTab === 'mis-pedidos' ? (
                        <button
                          type="button"
                          className="route-drag-handle"
                          aria-label={`Mover pedido ${pedido.numero_pedido}`}
                          onClick={(event) => event.stopPropagation()}
                          onPointerDown={(event) => handleRouteDragStart(event, pedidoRouteKey(pedido))}
                          onPointerMove={handleRouteDragMove}
                          onPointerUp={handleRouteDragEnd}
                          onPointerCancel={handleRouteDragEnd}
                        >
                          <GripVertical size={17} />
                        </button>
                      ) : null}
                      <span>
                        <Clock3 size={14} />
                        {pedido.hora_entrega}
                      </span>
                    </div>
                    <h2>{pedido.destinatario}</h2>
                    <p className="order-arrangement">{pedido.arreglo}</p>
                    <p>
                      <MapPin size={14} />
                      {pedido.direccion}
                    </p>
                    <p>
                      <Package size={14} />
                      Zona: {pedido.zona} | Barrio: {pedido.barrio}
                    </p>
                    <div className="order-actions">
                      <span>
                        <Phone size={13} />
                        {pedido.telefono_destinatario || 'Sin teléfono'}
                      </span>
                      {activeTab === 'disponibles' ? (
                        <button
                          type="button"
                          disabled={assigningPedido === pedido.numero_pedido}
                          onClick={(event) => {
                            event.stopPropagation()
                            handleAsignarme(pedido.numero_pedido)
                          }}
                        >
                          <Hand size={16} />
                          {assigningPedido === pedido.numero_pedido ? 'Asignando...' : 'Asignarme'}
                        </button>
                      ) : (
                        <div className="assigned-actions">
                          <strong className="order-status">{pedido.estado_entrega || 'Asignado'}</strong>
                          {!['entregado', 'no_entregado'].includes(normalizedDeliveryStatus(pedido.estado_entrega)) ? (
                            <button
                              type="button"
                              className="return-action"
                              disabled={returningPedido === pedido.numero_pedido}
                              onClick={(event) => {
                                event.stopPropagation()
                                handleDevolver(pedido.numero_pedido)
                              }}
                            >
                              {returningPedido === pedido.numero_pedido ? 'Devolviendo...' : 'Devolver'}
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="status-card">
                <p>
                  {activeTab === 'disponibles'
                    ? 'No hay pedidos disponibles para esta fecha.'
                    : 'No tienes pedidos asignados para esta fecha.'}
                </p>
                {firstAvailableDate ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(firstAvailableDate)
                      setShowAllDates(false)
                    }}
                  >
                    Ver pedidos del {formatDateLabel(firstAvailableDate)}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
          </>
        ) : null}

        {mainTab === 'perfil' ? (
          <section className="profile-view" aria-label="Perfil del domiciliario">
            <header className="profile-topbar">
              <button type="button" aria-label="Menu">
                <Menu size={22} />
              </button>
              <strong>Mi perfil</strong>
              <span aria-hidden="true" />
            </header>

            <section className="profile-card">
              <div className="profile-avatar" aria-label="Foto de perfil">
                {profilePhotoPreviewUrl || session.domiciliario.foto_url ? (
                  <img src={profilePhotoPreviewUrl || session.domiciliario.foto_url || ''} alt={session.domiciliario.nombre_empleado} />
                ) : (
                  profileInitials
                )}
              </div>
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleProfilePhotoChange}
              />
              <div className="profile-identity">
                <strong>{session.domiciliario.nombre_empleado}</strong>
                <span>{session.domiciliario.cargo || 'Domiciliario'}</span>
                <small>
                  <Star size={12} fill="currentColor" />
                  {isUploadingProfilePhoto ? 'Subiendo foto...' : '4.9'}
                </small>
                {!session.domiciliario.foto_url || isUploadingProfilePhoto ? (
                  <button
                    type="button"
                    className="profile-photo-action"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    disabled={isUploadingProfilePhoto}
                  >
                    <Camera size={14} />
                    {isUploadingProfilePhoto ? 'Subiendo foto...' : 'Agregar foto'}
                  </button>
                ) : null}
              </div>
            </section>

            <section className="profile-stats" aria-label="Indicadores del domiciliario">
              <article>
                <strong>{entregadosPedidos.length}</strong>
                <span>Entregas hoy</span>
              </article>
              <article>
                <strong>{effectivenessRate}%</strong>
                <span>Efectividad</span>
              </article>
              <article>
                <strong>4.9</strong>
                <span>Calificación</span>
              </article>
            </section>

            <section className="profile-menu" aria-label="Opciones de perfil">
              <button type="button">
                <span><ShieldCheck size={17} /> Mi desempeño</span>
                <ChevronRight size={18} />
              </button>
              <button type="button">
                <span><History size={17} /> Historial de entregas</span>
                <ChevronRight size={18} />
              </button>
              <button type="button">
                <span><FileText size={17} /> Documentos</span>
                <ChevronRight size={18} />
              </button>
              <button type="button">
                <span><Bike size={17} /> Vehículo</span>
                <em>Moto · Sucursal {activeSucursalId || 'N/A'}</em>
              </button>
              <button type="button">
                <span><MessageSquare size={17} /> Soporte</span>
                <ChevronRight size={18} />
              </button>
              <button type="button">
                <span><Settings size={17} /> Configuración</span>
                <ChevronRight size={18} />
              </button>
              <button type="button" onClick={onLogout}>
                <span><LogOut size={17} /> Cerrar sesión</span>
              </button>
            </section>
          </section>
        ) : null}

        {selectedPedido ? (
          <div className="detail-overlay" role="dialog" aria-modal="true" aria-label="Detalle del pedido">
            <section className="detail-panel">
              <header className="detail-topbar">
                <button type="button" aria-label="Cerrar detalle" onClick={() => setSelectedPedido(null)}>
                  <ArrowLeft size={21} />
                </button>
                <strong>Detalle de orden</strong>
                <span aria-hidden="true" />
              </header>

              <div className="detail-body">
                <div className="detail-badges">
                  <span>#{selectedPedido.numero_pedido}</span>
                  <strong>{detailStatusLabel(selectedPedido.estado_entrega)}</strong>
                </div>

                <figure className="detail-product">
                  <img
                    src={selectedPedido.imagen_arreglo || selectedPedido.imagenes_arreglo?.[0] || '/img/logo.png'}
                    alt={selectedPedido.arreglo || `Pedido ${selectedPedido.numero_pedido}`}
                  />
                </figure>

                <section className="detail-product-title">
                  <h2>{selectedPedido.arreglo || 'Arreglo sin especificar'}</h2>
                </section>

                <section className="delivery-info">
                  <h3>Información de entrega</h3>
                  <article>
                    <MapPin size={20} />
                    <div>
                      <span>Dirección</span>
                      <strong>{selectedPedido.direccion || 'Sin dirección'}</strong>
                      <small>
                        Zona {selectedPedido.zona || 'N/A'} · Barrio {selectedPedido.barrio || 'N/A'}
                      </small>
                    </div>
                  </article>
                  <article>
                    <Clock3 size={20} />
                    <div>
                      <span>Hora de entrega</span>
                      <strong>{selectedPedido.hora_entrega || 'Sin hora'}</strong>
                      <small>{formatDateControl(dateOnly(selectedPedido.fecha_entrega))}</small>
                    </div>
                  </article>
                  <article>
                    <User size={20} />
                    <div>
                      <span>Cliente</span>
                      <strong>{selectedPedido.destinatario || 'Sin destinatario'}</strong>
                      <small>{selectedPedido.telefono_destinatario || 'Sin teléfono'}</small>
                    </div>
                  </article>
                  <article>
                    <MessageSquare size={20} />
                    <div>
                      <span>Nota del cliente</span>
                      <strong>Sin mensaje</strong>
                    </div>
                  </article>
                </section>
              </div>

              {activeTab === 'mis-pedidos' ? (
                <button
                  type="button"
                  className="start-delivery"
                  disabled={startingPedido === selectedPedido.numero_pedido}
                  onClick={() => handleIniciarEntrega(selectedPedido.numero_pedido)}
                >
                  {startingPedido === selectedPedido.numero_pedido ? 'Iniciando...' : 'Iniciar entrega'}
                </button>
              ) : null}
            </section>
          </div>
        ) : null}

        {routePedido ? (
          <div className="route-overlay" role="dialog" aria-modal="true" aria-label="Entrega en curso">
            <section className="route-view">
              <header className="route-topbar">
                <button type="button" aria-label="Volver" onClick={() => setRoutePedido(null)}>
                  <ArrowLeft size={21} />
                </button>
                <div>
                  <strong>PetalOps</strong>
                  <span>Entrega en curso</span>
                </div>
                <button type="button" aria-label="Opciones">
                  <Menu size={20} />
                </button>
              </header>

              <section className="route-order">
                <img
                  src={routePedido.imagen_arreglo || routePedido.imagenes_arreglo?.[0] || '/img/logo.png'}
                  alt={routePedido.arreglo || `Pedido ${routePedido.numero_pedido}`}
                />
                <div>
                  <strong>PO-{routePedido.numero_pedido}</strong>
                  <span>{routePedido.arreglo || 'Arreglo sin especificar'}</span>
                  <small>{routePedido.destinatario || 'Cliente sin nombre'}</small>
                </div>
                <a href={`tel:${routePedido.telefono_destinatario || ''}`} aria-label="Llamar al cliente">
                  <Phone size={19} />
                </a>
              </section>

              <section className="route-stats">
                <article>
                  <Clock3 size={18} />
                  <div>
                    <span>Hora de entrega</span>
                    <strong>{routePedido.hora_entrega || 'Sin hora'}</strong>
                    <small>{formatDateControl(dateOnly(routePedido.fecha_entrega))}</small>
                  </div>
                </article>
                <article>
                  <MapPin size={18} />
                  <div>
                    <span>Parada</span>
                    <strong>{currentRouteIndex >= 0 ? currentRouteIndex + 1 : 1}</strong>
                    <small>{routePedido.barrio || 'Sin barrio'}</small>
                  </div>
                </article>
              </section>

              <section className="current-destination" aria-label="Destino actual">
                <div className="destination-heading">
                  <span>
                    <MapPin size={18} />
                  </span>
                  <div>
                    <small>Destino actual</small>
                    <strong>{routePedido.direccion || 'Sin dirección'}</strong>
                    <p>
                      {routePedido.barrio || 'Sin barrio'}
                      {routePedido.zona ? ` · Zona ${routePedido.zona}` : ''}
                    </p>
                  </div>
                </div>

                <div className="destination-facts">
                  <article>
                    <User size={15} />
                    <span>{routePedido.destinatario || 'Cliente sin nombre'}</span>
                  </article>
                  <article>
                    <Package size={15} />
                    <span>{routePedido.arreglo || 'Arreglo sin especificar'}</span>
                  </article>
                  <article>
                    <Clock3 size={15} />
                    <span>Entrega programada: {routePedido.hora_entrega || 'Sin hora'}</span>
                  </article>
                </div>

                <div className="destination-actions">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(routePedido.direccion || '')}
                  >
                    <Clipboard size={15} />
                    Copiar dirección
                  </button>
                  <a href={`tel:${routePedido.telefono_destinatario || ''}`}>
                    <Phone size={15} />
                    Llamar al cliente
                  </a>
                  <a href={wazeUrl(routePedido.direccion)} target="_blank" rel="noreferrer">
                    <Navigation size={15} />
                    Abrir en Waze
                  </a>
                </div>
              </section>

              <section className="route-tracking">
                <h2>Seguimiento del pedido</h2>
                {[
                  ['asignado', 'Asignado', 'El pedido fue asignado al domiciliario'],
                  ['en_ruta', 'En ruta', 'Te diriges al destino'],
                  ['entregado', 'Entregado', 'Entrega confirmada']
                ].map(([stepKey, label, description], stepIndex) => {
                  const currentIndex = deliveryStepIndex(routePedido.estado_entrega)
                  const stepState = deliveryStepState(stepIndex, currentIndex, routePedido.estado_entrega)
                  const stepTime = deliveryStepTime(routePedido, stepKey as DeliveryStepKey)

                  return (
                    <article key={label} className={`tracking-step ${stepState}`}>
                      <span>{stepState === 'done' ? <CheckCircle2 size={16} /> : stepIndex + 1}</span>
                      <div>
                        <strong>{label}</strong>
                        <small>{description}</small>
                      </div>
                      <em>{stepTime || 'Pendiente'}</em>
                    </article>
                  )
                })}
              </section>

              {normalizedDeliveryStatus(routePedido.estado_entrega) === 'no_entregado' ? (
                <section className="reported-issue-card" aria-label="Novedad reportada">
                  <div className="reported-issue-heading">
                    <span>
                      <FileText size={18} />
                    </span>
                    <div>
                      <small>Novedad reportada</small>
                      <strong>{pedidoNovedadInfo(routePedido).motivo}</strong>
                    </div>
                  </div>
                  {pedidoNovedadInfo(routePedido).descripcion ? (
                    <p>{pedidoNovedadInfo(routePedido).descripcion}</p>
                  ) : null}
                  {pedidoNovedadInfo(routePedido).evidenciaFotoUrl ? (
                    <img src={pedidoNovedadInfo(routePedido).evidenciaFotoUrl || ''} alt="Evidencia de la novedad" />
                  ) : null}
                </section>
              ) : null}

              {!['entregado', 'no_entregado'].includes(normalizedDeliveryStatus(routePedido.estado_entrega)) ? (
                <button
                  type="button"
                  className="report-issue-action"
                  onClick={() => openNovedadReport(routePedido)}
                >
                  <FileText size={17} />
                  Reportar novedad
                </button>
              ) : null}

              <button
                type="button"
                className="complete-delivery-action"
                disabled={
                  deliveringPedido === routePedido.numero_pedido ||
                  ['entregado', 'no_entregado'].includes(normalizedDeliveryStatus(routePedido.estado_entrega))
                }
                onClick={() => openDeliveryProof(routePedido)}
              >
                {normalizedDeliveryStatus(routePedido.estado_entrega) === 'no_entregado'
                  ? 'Novedad reportada'
                  : deliveryStepIndex(routePedido.estado_entrega) >= 2
                  ? 'Pedido entregado'
                  : deliveringPedido === routePedido.numero_pedido
                    ? 'Guardando...'
                    : 'Marcar entregado'}
              </button>

              <section className="next-destination">
                <span>Siguiente destino</span>
                {nextRoutePedido ? (
                  <>
                    <strong>{nextRoutePedido.direccion || 'Sin dirección'}</strong>
                    <p>
                      #{nextRoutePedido.numero_pedido} · {nextRoutePedido.destinatario || 'Sin cliente'}
                    </p>
                    <p>
                      Zona {nextRoutePedido.zona || 'N/A'} · Barrio {nextRoutePedido.barrio || 'N/A'}
                    </p>
                  </>
                ) : (
                  <>
                    <strong>No hay más pedidos en la ruta</strong>
                    <p>Cuando marques este pedido como entregado, tu ruta quedará al día.</p>
                  </>
                )}
              </section>

            </section>
          </div>
        ) : null}

        {proofPedido ? (
          <div className="proof-overlay" role="dialog" aria-modal="true" aria-label="Prueba de entrega">
            <section className="proof-view">
              <header className="proof-topbar">
                <button type="button" aria-label="Volver" onClick={() => setProofPedido(null)}>
                  <ArrowLeft size={21} />
                </button>
                <strong>Prueba de entrega</strong>
                <span aria-hidden="true" />
              </header>

              <section className="proof-order">
                <img
                  src={proofPedido.imagen_arreglo || proofPedido.imagenes_arreglo?.[0] || '/img/logo.png'}
                  alt={proofPedido.arreglo || `Pedido ${proofPedido.numero_pedido}`}
                />
                <div>
                  <strong>PO-{proofPedido.numero_pedido}</strong>
                  <span>{proofPedido.arreglo || 'Arreglo sin especificar'}</span>
                </div>
                <em>{detailStatusLabel(proofPedido.estado_entrega)}</em>
              </section>

              <section className="proof-section">
                <h2>Foto de entrega</h2>
                <img
                  className="proof-photo"
                  src={proofPhotoUrl || proofPedido.imagen_arreglo || proofPedido.imagenes_arreglo?.[0] || '/img/logo.png'}
                  alt="Foto de entrega"
                />
                <input
                  ref={proofPhotoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handleProofPhotoChange}
                />
                <button type="button" className="proof-link-action" onClick={() => proofPhotoInputRef.current?.click()}>
                  <Camera size={16} />
                  Cambiar foto
                </button>
              </section>

              <section className="proof-section">
                <div className="proof-section-heading">
                  <h2>Firma del recibido</h2>
                  <button type="button">Limpiar</button>
                </div>
                <div className="signature-pad" aria-label="Firma capturada">
                  <PenLine size={22} />
                  <span />
                </div>
              </section>

              <label className="proof-field">
                <span>Nombre del recibido (opcional)</span>
                <input
                  type="text"
                  placeholder="Nombre de quien recibe"
                  value={proofRecipientName}
                  onChange={(event) => setProofRecipientName(event.target.value)}
                />
              </label>

              {assignError ? <p className="status-message error-message">{assignError}</p> : null}

              <button
                type="button"
                className="proof-confirm-action"
                disabled={deliveringPedido === proofPedido.numero_pedido}
                onClick={handleConfirmDeliveryProof}
              >
                {deliveringPedido === proofPedido.numero_pedido ? 'Confirmando...' : 'Confirmar entrega'}
              </button>
            </section>
          </div>
        ) : null}

        {novedadPedido ? (
          <div className="novedad-overlay" role="dialog" aria-modal="true" aria-label="Reportar novedad">
            <section className="novedad-view">
              <header className="proof-topbar">
                <button type="button" aria-label="Volver" onClick={() => setNovedadPedido(null)}>
                  <ArrowLeft size={21} />
                </button>
                <strong>Reportar novedad</strong>
                <span aria-hidden="true" />
              </header>

              <section className="novedad-order">
                <img
                  src={novedadPedido.imagen_arreglo || novedadPedido.imagenes_arreglo?.[0] || '/img/logo.png'}
                  alt={novedadPedido.arreglo || `Pedido ${novedadPedido.numero_pedido}`}
                />
                <div>
                  <strong>PO-{novedadPedido.numero_pedido}</strong>
                  <span>{novedadPedido.arreglo || 'Arreglo sin especificar'}</span>
                </div>
                <em>Novedad</em>
              </section>

              <section className="novedad-section">
                <h2>Selecciona el tipo de novedad</h2>
                <div className="novedad-options">
                  {NOVEDAD_OPTIONS.map((option) => (
                    <label key={option.value} className="novedad-option">
                      <input
                        type="radio"
                        name="novedad-type"
                        value={option.value}
                        checked={novedadType === option.value}
                        onChange={() => setNovedadType(option.value)}
                      />
                      <span>
                        <Radio size={15} />
                      </span>
                      {option.label}
                    </label>
                  ))}
                </div>
              </section>

              <label className="novedad-section">
                <h2>Descripción (opcional)</h2>
                <textarea
                  value={novedadDescription}
                  onChange={(event) => setNovedadDescription(event.target.value)}
                  placeholder="Describe lo ocurrido"
                />
              </label>

              <section className="novedad-section">
                <h2>Foto (opcional)</h2>
                <div className="novedad-photo-grid">
                  {novedadPhotoUrl ? (
                    <img src={novedadPhotoUrl} alt="Foto de la novedad" />
                  ) : null}
                  <button type="button" onClick={() => novedadPhotoInputRef.current?.click()}>
                    <Camera size={28} />
                    Agregar foto
                  </button>
                </div>
                <input
                  ref={novedadPhotoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handleNovedadPhotoChange}
                />
              </section>

              {assignError ? <p className="status-message error-message">{assignError}</p> : null}

              <button
                type="button"
                className="novedad-save-action"
                disabled={savingNovedadPedido === novedadPedido.numero_pedido}
                onClick={handleSaveNovedad}
              >
                {savingNovedadPedido === novedadPedido.numero_pedido ? 'Guardando...' : 'Guardar novedad'}
              </button>
            </section>
          </div>
        ) : null}

        <nav className="bottom-nav" aria-label="Navegación principal">
          <button
            type="button"
            className={mainTab === 'ordenes' ? 'active' : undefined}
            onClick={() => setMainTab('ordenes')}
          >
            <Package size={20} />
            Ordenes
          </button>
          <button
            type="button"
            className={mainTab === 'mapa' ? 'active' : undefined}
            onClick={() => setMainTab('mapa')}
          >
            <Map size={20} />
            Mapa
          </button>
          <button
            type="button"
            className={mainTab === 'historial' ? 'active' : undefined}
            onClick={() => setMainTab('historial')}
          >
            <History size={20} />
            Historial
          </button>
          <button
            type="button"
            className={mainTab === 'perfil' ? 'active' : undefined}
            onClick={() => setMainTab('perfil')}
          >
            <User size={20} />
            Perfil
          </button>
        </nav>
      </section>
    </main>
  )
}

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }

  return session ? (
    <AvailableOrdersScreen session={session} onLogout={logout} onSessionUpdate={setSession} />
  ) : (
    <LoginScreen onLogin={setSession} />
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
