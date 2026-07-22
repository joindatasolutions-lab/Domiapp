import React, { FormEvent, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import petalOpsLogoUrl from '../img/logo.png'
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
  MapPin,
  MessageSquare,
  Menu,
  Navigation,
  Package,
  Phone,
  Radio,
  RefreshCw,
  Settings,
  ShieldCheck,
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
const APP_LOGO_URL = petalOpsLogoUrl
const SESSION_KEY = 'domiapp.session'
const TENANT_KEY = 'tenant'
const EMPRESA_ID_KEY = 'empresa_id'
const SUCURSAL_ID_KEY = 'sucursal_id'
const TOKEN_KEY = 'token'
const LOGIN_TIMEOUT_MS = 20000

type DeliveryStepKey = 'asignado' | 'en_ruta' | 'entregado'
type HistorialPeriodo = 'hoy' | 'semana' | 'mes' | 'anio' | 'todos'
type NovedadEstado = 'abierta' | 'resuelta' | 'cancelada' | 'todas'
type HistorialStatusFilter = 'todos' | 'entregado' | 'con_novedad' | 'cancelado' | 'reasignado'
type ResolveNovedadAction = 'entregar' | 'reintentar' | 'devolver'
type OrdersKpiFilter = 'disponibles' | 'asignados' | 'en_ruta' | 'entregados' | null

interface TenantInfo {
  empresa_id?: number | null
  nombre?: string | null
  nombre_comercial?: string | null
  nombre_empresa?: string | null
  razon_social?: string | null
  slug?: string | null
  logo_url?: string | null
}

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
  tenant?: TenantInfo | null
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

type PedidoHistorial = {
  numero_pedido: number | null
  cliente: string | null
  destinatario: string | null
  telefono_destinatario: string | null
  arreglo: string | null
  imagen_arreglo: string | null
  imagenes_arreglo: string[]
  direccion: string | null
  barrio: string | null
  fecha_asignacion: string | null
  fecha_entrega: string | null
  hora_asignado: string | null
  hora_entregado: string | null
  estado_final: 'entregado' | 'con_novedad' | 'cancelado' | 'reasignado' | string
  novedad: string | null
  novedades: {
    accion: string | null
    estado_anterior: string | null
    estado_nuevo: string | null
    detalle: string | null
    registrada_en: string | null
  }[]
  evidencia_entrega_url: string | null
  evidencia_firma_url: string | null
  observaciones: string | null
}

type Novedad = {
  id_novedad: number
  numero_pedido: number | null
  cliente: string | null
  destinatario: string | null
  telefono_destinatario: string | null
  arreglo: string | null
  imagen_arreglo: string | null
  imagenes_arreglo: string[]
  direccion: string | null
  barrio: string | null
  zona: string | null
  tipo_novedad: string | null
  descripcion: string | null
  motivo: string | null
  evidencia_foto_url: string | null
  estado_novedad: 'abierta' | 'resuelta' | 'cancelada'
  estado_pedido: string | null
  reportada_en: string | null
  resuelta_en: string | null
  puede_reintentar: boolean
  puede_contactar_cliente: boolean
}

const HISTORIAL_FILTROS: { label: string; value: HistorialPeriodo }[] = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Esta semana', value: 'semana' },
  { label: 'Este mes', value: 'mes' },
  { label: 'Todos', value: 'todos' }
]

const HISTORIAL_ESTADO_LABEL: Record<string, string> = {
  entregado: 'Entregado',
  con_novedad: 'Con novedad',
  cancelado: 'Cancelado',
  reasignado: 'Reasignado'
}

const NOVEDAD_ESTADO_FILTROS: { label: string; value: NovedadEstado }[] = [
  { label: 'Abiertas', value: 'abierta' },
  { label: 'Resueltas', value: 'resuelta' },
  { label: 'Canceladas', value: 'cancelada' },
  { label: 'Todas', value: 'todas' }
]

const NOVEDAD_PERIODO_FILTROS: { label: string; value: HistorialPeriodo }[] = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Esta semana', value: 'semana' },
  { label: 'Este mes', value: 'mes' }
]

const RESOLVE_NOVEDAD_ACTIONS: {
  value: ResolveNovedadAction
  label: string
  description: string
  solucion: string
  nuevo_estado_pedido: 'entregado' | 'asignado' | 'pendiente'
}[] = [
  {
    value: 'entregar',
    label: 'Entregar pedido',
    description: 'Cierra la novedad y marca el pedido como entregado.',
    solucion: 'Pedido entregado después de resolver la novedad',
    nuevo_estado_pedido: 'entregado'
  },
  {
    value: 'reintentar',
    label: 'Reintentar entrega',
    description: 'El pedido vuelve a Mis pedidos para continuar la ruta.',
    solucion: 'Cliente contactado, se reintentará la entrega',
    nuevo_estado_pedido: 'asignado'
  },
  {
    value: 'devolver',
    label: 'Devolver a disponibles',
    description: 'El pedido vuelve a la bolsa de pedidos disponibles.',
    solucion: 'No fue posible entregar, se devuelve a disponibles',
    nuevo_estado_pedido: 'pendiente'
  }
]

async function loginDomiciliario(usuario: string, password: string) {
  const abortController = new AbortController()
  const timeoutId = window.setTimeout(() => abortController.abort(), LOGIN_TIMEOUT_MS)

  const response = await fetch(`${API_URL}/auth/domiciliarios/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    signal: abortController.signal,
    body: JSON.stringify({
      usuario,
      password
    })
  }).finally(() => window.clearTimeout(timeoutId))

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

function normalizeHistorialResponse(data: unknown) {
  if (Array.isArray(data)) return data as PedidoHistorial[]
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: PedidoHistorial[] }).items
  }
  if (data && typeof data === 'object' && Array.isArray((data as { historial?: unknown }).historial)) {
    return (data as { historial: PedidoHistorial[] }).historial
  }
  if (data && typeof data === 'object' && Array.isArray((data as { pedidos?: unknown }).pedidos)) {
    return (data as { pedidos: PedidoHistorial[] }).pedidos
  }

  return []
}

function normalizeNovedadesResponse(data: unknown) {
  if (Array.isArray(data)) return data as Novedad[]
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: Novedad[] }).items
  }
  if (data && typeof data === 'object' && Array.isArray((data as { novedades?: unknown }).novedades)) {
    return (data as { novedades: Novedad[] }).novedades
  }
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: Novedad[] }).data
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

async function getPedidosHistorial(
  token: string,
  periodo: HistorialPeriodo,
  q: string,
  limit = 50,
  offset = 0
) {
  const params = new URLSearchParams({
    periodo,
    limit: String(limit),
    offset: String(offset)
  })
  const searchValue = q.trim()

  if (searchValue) {
    params.set('q', searchValue)
  }

  const response = await fetch(`${API_URL}/pedidos/historial?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('No se pudo cargar el historial')
  }

  const data = await response.json()
  return normalizeHistorialResponse(data)
}

async function getNovedades(
  token: string,
  estado: NovedadEstado,
  periodo: HistorialPeriodo,
  q: string,
  limit = 50,
  offset = 0
) {
  const params = new URLSearchParams({
    estado,
    periodo,
    limit: String(limit),
    offset: String(offset)
  })
  const searchValue = q.trim()

  if (searchValue) {
    params.set('q', searchValue)
  }

  const response = await fetch(`${API_URL}/pedidos/novedades?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('No se pudieron cargar las novedades')
  }

  const data = await response.json()
  return normalizeNovedadesResponse(data)
}

async function resolverNovedad(
  token: string,
  numeroPedido: number,
  idNovedad: number,
  sucursalId: number | null | undefined,
  payload: {
    solucion: string
    observaciones?: string
    nuevo_estado_pedido?: 'entregado' | 'asignado' | 'en_ruta' | 'pendiente'
    evidencia_foto_url?: string
    firma_nombre?: string
    firma_documento?: string
    firma_imagen_url?: string
  }
) {
  const response = await fetch(`${API_URL}/pedidos/${numeroPedido}/novedades/${idNovedad}/resolver${sucursalQueryParam(sucursalId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'No se pudo resolver la novedad')
  }

  return data
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

function historialPedidoToPedido(pedido: PedidoHistorial): PedidoDisponible {
  return {
    numero_pedido: pedido.numero_pedido,
    destinatario: pedido.destinatario || pedido.cliente || 'Cliente sin nombre',
    telefono_destinatario: pedido.telefono_destinatario || '',
    arreglo: pedido.arreglo || 'Arreglo sin especificar',
    imagen_arreglo: pedido.imagen_arreglo,
    imagenes_arreglo: pedido.imagenes_arreglo,
    direccion: pedido.direccion || 'Sin direccion',
    barrio: pedido.barrio || 'Sin barrio',
    zona: '',
    hora_entrega: pedido.hora_entregado || '',
    fecha_entrega: pedido.fecha_entrega || '',
    estado_entrega: pedido.estado_final,
    hora_asignado: pedido.hora_asignado,
    fecha_asignacion: pedido.fecha_asignacion,
    hora_entregado: pedido.hora_entregado,
    fecha_entrega_real: pedido.fecha_entrega,
    evidencia_foto_url: pedido.evidencia_entrega_url,
    observaciones: pedido.observaciones
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
  localStorage.setItem(TOKEN_KEY, session.access_token)
  localStorage.setItem(EMPRESA_ID_KEY, String(session.domiciliario.empresa_id))

  if (session.domiciliario.sucursal_id != null) {
    localStorage.setItem(SUCURSAL_ID_KEY, String(session.domiciliario.sucursal_id))
  } else {
    localStorage.removeItem(SUCURSAL_ID_KEY)
  }

  if (session.domiciliario.tenant) {
    localStorage.setItem(TENANT_KEY, JSON.stringify(session.domiciliario.tenant))
  } else {
    localStorage.removeItem(TENANT_KEY)
  }
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
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('El servidor tardo demasiado en responder. Intenta nuevamente.')
        return
      }

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
              <img src={APP_LOGO_URL} alt="PetalOps" />
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
  const [historialPedidos, setHistorialPedidos] = useState<PedidoHistorial[]>([])
  const [kpiHistorialPedidos, setKpiHistorialPedidos] = useState<PedidoHistorial[]>([])
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [mainTab, setMainTab] = useState<'ordenes' | 'mapa' | 'historial' | 'perfil'>('ordenes')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'disponibles' | 'mis-pedidos'>('disponibles')
  const [ordersKpiFilter, setOrdersKpiFilter] = useState<OrdersKpiFilter>(null)
  const [novedadesEstado, setNovedadesEstado] = useState<NovedadEstado>('abierta')
  const [novedadesPeriodo, setNovedadesPeriodo] = useState<HistorialPeriodo>('hoy')
  const [novedadesSearchTerm, setNovedadesSearchTerm] = useState('')
  const [novedadesRefreshKey, setNovedadesRefreshKey] = useState(0)
  const [historialPeriodo, setHistorialPeriodo] = useState<HistorialPeriodo>('mes')
  const [historialStatusFilter, setHistorialStatusFilter] = useState<HistorialStatusFilter>('todos')
  const [historialSearchTerm, setHistorialSearchTerm] = useState('')
  const [historialDateFilter, setHistorialDateFilter] = useState(todayInputValue)
  const [historialRefreshKey, setHistorialRefreshKey] = useState(0)
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
  const [hasProofSignature, setHasProofSignature] = useState(false)
  const [novedadPedido, setNovedadPedido] = useState<PedidoDisponible | null>(null)
  const [novedadType, setNovedadType] = useState(NOVEDAD_OPTIONS[0].value)
  const [novedadDescription, setNovedadDescription] = useState('')
  const [novedadPhotoUrl, setNovedadPhotoUrl] = useState<string | null>(null)
  const [savingNovedadPedido, setSavingNovedadPedido] = useState<number | null>(null)
  const [resolvingNovedad, setResolvingNovedad] = useState<Novedad | null>(null)
  const [resolveAction, setResolveAction] = useState<ResolveNovedadAction>('entregar')
  const [resolveObservations, setResolveObservations] = useState('')
  const [resolveEvidenceUrl, setResolveEvidenceUrl] = useState<string | null>(null)
  const [resolveSignatureName, setResolveSignatureName] = useState('')
  const [resolveSignatureDocument, setResolveSignatureDocument] = useState('')
  const [savingResolveNovedadId, setSavingResolveNovedadId] = useState<number | null>(null)
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState<string | null>(null)
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false)
  const [localPedidosEnCurso, setLocalPedidosEnCurso] = useState<PedidoDisponible[]>([])
  const [routeOrder, setRouteOrder] = useState<string[]>([])
  const [dragState, setDragState] = useState<{ key: string; startY: number; currentY: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false)
  const [isLoadingNovedades, setIsLoadingNovedades] = useState(false)
  const [historialError, setHistorialError] = useState<string | null>(null)
  const [novedadesError, setNovedadesError] = useState<string | null>(null)
  const dateInputRef = useRef<HTMLInputElement | null>(null)
  const proofPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const proofSignatureCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingProofSignatureRef = useRef(false)
  const novedadPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const resolveEvidenceInputRef = useRef<HTMLInputElement | null>(null)
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null)
  const activeEmpresaId = session.domiciliario.empresa_id
  const activeSucursalId = session.domiciliario.sucursal_id

  const loadOrders = async (excludedPedidoNumbers: number[] = [], extraDisponibles: PedidoDisponible[] = []) => {
    setIsLoading(true)
    setError(null)

    try {
      const [disponibles, asignados, historialKpi] = await Promise.all([
        getPedidosDisponibles(selectedDate, activeEmpresaId, activeSucursalId),
        getPedidosAsignados(session.access_token, selectedDate, activeEmpresaId, activeSucursalId),
        getPedidosHistorial(session.access_token, 'mes', '', 200, 0).catch(() => [])
      ])
      const filteredAsignados = asignados.filter((pedido) =>
        !excludedPedidoNumbers.includes(Number(pedido.numero_pedido))
      )
      const missingExtraDisponibles = extraDisponibles.filter((extraPedido) =>
        !disponibles.some((pedido) => pedido.numero_pedido === extraPedido.numero_pedido)
      )

      setPedidos([...disponibles, ...missingExtraDisponibles])
      setKpiHistorialPedidos(historialKpi)
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

  useEffect(() => {
    if (mainTab !== 'historial') return

    const abortLoad = { current: false }

    const loadHistorial = async () => {
      setIsLoadingHistorial(true)
      setHistorialError(null)

      try {
        const nextHistorial = await getPedidosHistorial(
          session.access_token,
          historialPeriodo,
          historialSearchTerm,
          50,
          0
        )

        if (!abortLoad.current) {
          setHistorialPedidos(nextHistorial)
        }
      } catch (err) {
        if (!abortLoad.current) {
          setHistorialError(err instanceof Error ? err.message : 'No se pudo cargar el historial')
        }
      } finally {
        if (!abortLoad.current) {
          setIsLoadingHistorial(false)
        }
      }
    }

    loadHistorial()

    return () => {
      abortLoad.current = true
    }
  }, [mainTab, session.access_token, historialPeriodo, historialSearchTerm, historialRefreshKey])

  useEffect(() => {
    if (mainTab !== 'mapa') return

    const abortLoad = { current: false }

    const loadNovedades = async () => {
      setIsLoadingNovedades(true)
      setNovedadesError(null)

      try {
        const nextNovedades = await getNovedades(
          session.access_token,
          novedadesEstado,
          novedadesPeriodo,
          novedadesSearchTerm,
          50,
          0
        )

        if (!abortLoad.current) {
          setNovedades(nextNovedades)
        }
      } catch (err) {
        if (!abortLoad.current) {
          setNovedadesError(err instanceof Error ? err.message : 'No se pudieron cargar las novedades')
        }
      } finally {
        if (!abortLoad.current) {
          setIsLoadingNovedades(false)
        }
      }
    }

    loadNovedades()

    return () => {
      abortLoad.current = true
    }
  }, [mainTab, session.access_token, novedadesEstado, novedadesPeriodo, novedadesSearchTerm, novedadesRefreshKey])

  useEffect(() => {
    const canvas = proofSignatureCanvasRef.current
    if (!proofPedido || !canvas) return

    const resizeSignatureCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const pixelRatio = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(width * pixelRatio))
      canvas.height = Math.max(1, Math.floor(height * pixelRatio))

      const context = canvas.getContext('2d')
      if (!context) return

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)
      context.lineWidth = 3
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.strokeStyle = '#26212a'
    }

    resizeSignatureCanvas()
    setHasProofSignature(false)
    window.addEventListener('resize', resizeSignatureCanvas)

    return () => {
      window.removeEventListener('resize', resizeSignatureCanvas)
    }
  }, [proofPedido])

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
    setProofPhotoUrl(pedido.imagen_arreglo || pedido.imagenes_arreglo?.[0] || APP_LOGO_URL)
    setProofRecipientName('')
    setHasProofSignature(false)
  }

  const handleProofPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setProofPhotoUrl(URL.createObjectURL(file))
  }

  const getProofSignaturePoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = proofSignatureCanvasRef.current
    if (!canvas) return null

    const canvasBox = canvas.getBoundingClientRect()
    return {
      x: event.clientX - canvasBox.left,
      y: event.clientY - canvasBox.top
    }
  }

  const handleProofSignatureStart = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = proofSignatureCanvasRef.current
    const point = getProofSignaturePoint(event)
    if (!canvas || !point) return

    event.preventDefault()
    canvas.setPointerCapture(event.pointerId)
    isDrawingProofSignatureRef.current = true

    const context = canvas.getContext('2d')
    if (!context) return

    context.beginPath()
    context.moveTo(point.x, point.y)
    setHasProofSignature(true)
  }

  const handleProofSignatureMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingProofSignatureRef.current) return

    const point = getProofSignaturePoint(event)
    const context = proofSignatureCanvasRef.current?.getContext('2d')
    if (!point || !context) return

    event.preventDefault()
    context.lineTo(point.x, point.y)
    context.stroke()
  }

  const handleProofSignatureEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = proofSignatureCanvasRef.current
    isDrawingProofSignatureRef.current = false

    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
  }

  const handleClearProofSignature = () => {
    const canvas = proofSignatureCanvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const { width, height } = canvas.getBoundingClientRect()
    context.clearRect(0, 0, width, height)
    isDrawingProofSignatureRef.current = false
    setHasProofSignature(false)
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
  const entregadosHistorialPedidos = kpiHistorialPedidos.filter((pedido) => {
    const matchesDate = showAllDates || dateOnly(pedido.fecha_entrega) === selectedDate

    return matchesDate && normalizedDeliveryStatus(pedido.estado_final) === 'entregado'
  })
  const entregadosKpiCount = entregadosHistorialPedidos.length
  const entregadosVisiblesPedidos = entregadosHistorialPedidos.map(historialPedidoToPedido)
  const pedidosVisiblesPorFecha = activeTab === 'disponibles'
    ? disponiblesPorFecha
    : ordersKpiFilter === 'entregados'
    ? entregadosVisiblesPedidos
    : misPedidosPorFecha
  const noEntregadosPedidos = misPedidosPorFecha.filter((pedido) => {
    return normalizedDeliveryStatus(pedido.estado_entrega) === 'no_entregado'
  })
  const profileInitials = session.domiciliario.nombre_empleado
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase())
    .join('') || 'D'
  const tenantLogoUrl = session.domiciliario.tenant?.logo_url || null
  const tenantName = session.domiciliario.tenant?.nombre_comercial ||
    session.domiciliario.tenant?.nombre ||
    session.domiciliario.tenant?.nombre_empresa ||
    session.domiciliario.tenant?.razon_social ||
    'Empresa'
  const availableDates = Array.from(
    new Set([...safePedidos, ...safeMisPedidos].map((pedido) => dateOnly(pedido.fecha_entrega)).filter(Boolean))
  ).sort()
  const firstAvailableDate = availableDates[0]
  const pedidosFiltradosPorKpi = pedidosVisiblesPorFecha.filter((pedido) => {
    if (!ordersKpiFilter) return true
    if (ordersKpiFilter === 'disponibles') return activeTab === 'disponibles'

    const status = normalizedDeliveryStatus(pedido.estado_entrega)
    if (ordersKpiFilter === 'asignados') return status === 'pendiente' || status === 'asignado'
    if (ordersKpiFilter === 'en_ruta') return status === 'en_ruta'
    if (ordersKpiFilter === 'entregados') return status === 'entregado'

    return true
  })
  const filteredPedidos = pedidosFiltradosPorKpi.filter((pedido) => {
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
  const ordersEmptyMessage = (() => {
    if (activeTab === 'disponibles') return 'No hay pedidos disponibles para esta fecha.'
    if (ordersKpiFilter === 'en_ruta') return 'No tienes pedidos en camino para esta fecha.'
    if (ordersKpiFilter === 'entregados') return 'No tienes pedidos entregados para esta fecha.'

    return 'No tienes pedidos asignados para esta fecha.'
  })()
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
  const baseHistorialPedidos = historialDateFilter
    ? historialPedidos.filter((pedido) =>
      dateOnly(pedido.fecha_entrega) === historialDateFilter ||
      dateOnly(pedido.fecha_asignacion) === historialDateFilter
    )
    : historialPedidos
  const historialEntregadosCount = baseHistorialPedidos.filter((pedido) => pedido.estado_final === 'entregado').length
  const historialConNovedadCount = baseHistorialPedidos.filter((pedido) => pedido.estado_final === 'con_novedad').length
  const historialCanceladosCount = baseHistorialPedidos.filter((pedido) => pedido.estado_final === 'cancelado').length
  const historialReasignadosCount = baseHistorialPedidos.filter((pedido) => pedido.estado_final === 'reasignado').length
  const filteredHistorialPedidos = historialStatusFilter === 'todos'
    ? baseHistorialPedidos
    : baseHistorialPedidos.filter((pedido) => pedido.estado_final === historialStatusFilter)

  const toggleOrdersKpiFilter = (nextFilter: Exclude<OrdersKpiFilter, null>) => {
    setOrdersKpiFilter((currentFilter) => currentFilter === nextFilter ? null : nextFilter)
    setActiveTab(nextFilter === 'disponibles' ? 'disponibles' : 'mis-pedidos')
  }

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

  const openResolveNovedad = (novedad: Novedad) => {
    setResolvingNovedad(novedad)
    setResolveAction('entregar')
    setResolveObservations('')
    setResolveEvidenceUrl(null)
    setResolveSignatureName('')
    setResolveSignatureDocument('')
    setAssignError(null)
  }

  const handleResolveEvidenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setResolveEvidenceUrl(URL.createObjectURL(file))
  }

  const handleResolveNovedad = async () => {
    if (!resolvingNovedad?.numero_pedido) {
      setAssignError('La novedad no tiene pedido asociado')
      return
    }

    const selectedAction = RESOLVE_NOVEDAD_ACTIONS.find((action) => action.value === resolveAction) || RESOLVE_NOVEDAD_ACTIONS[0]

    setSavingResolveNovedadId(resolvingNovedad.id_novedad)
    setAssignError(null)

    try {
      await resolverNovedad(
        session.access_token,
        resolvingNovedad.numero_pedido,
        resolvingNovedad.id_novedad,
        activeSucursalId,
        {
          solucion: selectedAction.solucion,
          observaciones: resolveObservations.trim() || undefined,
          nuevo_estado_pedido: selectedAction.nuevo_estado_pedido,
          evidencia_foto_url: resolveAction === 'entregar' ? resolveEvidenceUrl || undefined : undefined,
          firma_nombre: resolveAction === 'entregar' ? resolveSignatureName.trim() || undefined : undefined,
          firma_documento: resolveAction === 'entregar' ? resolveSignatureDocument.trim() || undefined : undefined
        }
      )

      setResolvingNovedad(null)
      setNovedadesRefreshKey((currentKey) => currentKey + 1)
      if (selectedAction.nuevo_estado_pedido === 'asignado') {
        setMainTab('ordenes')
        setActiveTab('mis-pedidos')
        await loadOrders()
      }
      if (selectedAction.nuevo_estado_pedido === 'entregado') {
        setHistorialRefreshKey((currentKey) => currentKey + 1)
      }
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'No se pudo resolver la novedad')
    } finally {
      setSavingResolveNovedadId(null)
    }
  }

  const openMainTab = (tab: 'ordenes' | 'mapa' | 'historial' | 'perfil') => {
    setMainTab(tab)
    setIsMenuOpen(false)
  }

  const handleMenuLogout = () => {
    setIsMenuOpen(false)
    onLogout()
  }

  return (
    <main className="app-shell">
      <section className="orders-view">
        {mainTab === 'ordenes' ? (
          <>
            <header className="mobile-topbar">
              <button type="button" aria-label="Abrir menu" onClick={() => setIsMenuOpen(true)}>
                <Menu size={22} />
              </button>
              <div className="topbar-brand">
                <img className="app-logo" src={APP_LOGO_URL} alt="PetalOps" />
                <span>PetalOps DomiApp</span>
              </div>
              <button type="button" className="logout-button" onClick={onLogout} aria-label="Cerrar sesión">
                <LogOut size={18} />
                <span>Salir</span>
              </button>
            </header>

            {isMenuOpen ? (
              <div className="hamburger-overlay" role="presentation" onClick={() => setIsMenuOpen(false)}>
                <aside
                  className="hamburger-drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Menu principal"
                  onClick={(event) => event.stopPropagation()}
                >
                  <header className="hamburger-header">
                    <button type="button" aria-label="Cerrar menu" onClick={() => setIsMenuOpen(false)}>
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <strong>{session.domiciliario.nombre_empleado}</strong>
                      <span>{tenantName}</span>
                    </div>
                  </header>

                  <section className="hamburger-summary" aria-label="Resumen de jornada">
                    <article>
                      <strong>{misPedidosPorFecha.length}</strong>
                      <span>Asignados</span>
                    </article>
                    <article>
                      <strong>{entregadosKpiCount}</strong>
                      <span>Entregados</span>
                    </article>
                    <article>
                      <strong>{noEntregadosPedidos.length}</strong>
                      <span>Novedades</span>
                    </article>
                  </section>

                  <nav className="hamburger-menu" aria-label="Opciones del menu">
                    <button type="button" onClick={() => openMainTab('ordenes')}>
                      <span><Package size={18} /> Pedidos</span>
                      <ChevronRight size={17} />
                    </button>
                    <button type="button" onClick={() => openMainTab('mapa')}>
                      <span><FileText size={18} /> Novedades</span>
                      <ChevronRight size={17} />
                    </button>
                    <button type="button" onClick={() => openMainTab('historial')}>
                      <span><History size={18} /> Historial</span>
                      <ChevronRight size={17} />
                    </button>
                    <button type="button" onClick={() => openMainTab('perfil')}>
                      <span><Settings size={18} /> Perfil y ajustes</span>
                      <ChevronRight size={17} />
                    </button>
                    <button type="button" className="hamburger-logout" onClick={handleMenuLogout}>
                      <span><LogOut size={18} /> Cerrar sesion</span>
                      <ChevronRight size={17} />
                    </button>
                  </nav>
                </aside>
              </div>
            ) : null}

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
            onClick={() => {
              setActiveTab('disponibles')
              setOrdersKpiFilter(null)
            }}
          >
            Pedidos disponibles
          </button>
          <button
            type="button"
            className={activeTab === 'mis-pedidos' ? 'active' : undefined}
            onClick={() => {
              setActiveTab('mis-pedidos')
              setOrdersKpiFilter(null)
            }}
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
          <button
            type="button"
            className="orders-refresh-action"
            disabled={isLoading}
            onClick={() => loadOrders()}
          >
            <RefreshCw size={15} />
            Actualizar
          </button>
        </section>

        <section className="metric-grid">
          <button
            type="button"
            className={ordersKpiFilter === 'disponibles' ? 'active' : undefined}
            onClick={() => toggleOrdersKpiFilter('disponibles')}
          >
            <span className="metric-icon pink">
              <Package size={17} />
            </span>
            <strong>{disponiblesPorFecha.length}</strong>
            <p>Disponibles</p>
          </button>
          <button
            type="button"
            className={ordersKpiFilter === 'asignados' ? 'active' : undefined}
            onClick={() => toggleOrdersKpiFilter('asignados')}
          >
            <span className="metric-icon purple">
              <LayoutList size={17} />
            </span>
            <strong>{assignedPedidos.length}</strong>
            <p>Asignados</p>
          </button>
          <button
            type="button"
            className={ordersKpiFilter === 'en_ruta' ? 'active' : undefined}
            onClick={() => toggleOrdersKpiFilter('en_ruta')}
          >
            <span className="metric-icon blue">
              <Bike size={17} />
            </span>
            <strong>{enCaminoPedidos.length}</strong>
            <p>En camino</p>
          </button>
          <button
            type="button"
            className={ordersKpiFilter === 'entregados' ? 'active' : undefined}
            onClick={() => toggleOrdersKpiFilter('entregados')}
          >
            <span className="metric-icon green">
              <CheckCircle2 size={17} />
            </span>
            <strong>{entregadosKpiCount}</strong>
            <p>Entregados</p>
          </button>
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
                      src={pedido.imagen_arreglo || pedido.imagenes_arreglo?.[0] || APP_LOGO_URL}
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
                <p>{ordersEmptyMessage}</p>
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

        {mainTab === 'mapa' ? (
          <section className="novedades-view" aria-label="Novedades">
            <header className="profile-topbar">
              <button type="button" aria-label="Menu" onClick={() => setIsMenuOpen(true)}>
                <Menu size={22} />
              </button>
              <strong>Novedades</strong>
              <span aria-hidden="true" />
            </header>

            <section className="history-hero">
              <div>
                <h1>Novedades</h1>
                <p>Gestiona casos reportados en entregas</p>
              </div>
              {tenantLogoUrl ? (
                <img className="hero-tenant-logo" src={tenantLogoUrl} alt={tenantName} />
              ) : null}
            </section>

            <section className="history-search">
              <label className="search-box">
                <Search size={18} />
                <span className="sr-only">Buscar novedad</span>
                <input
                  type="search"
                  placeholder="Buscar pedido, cliente o zona"
                  value={novedadesSearchTerm}
                  onChange={(event) => setNovedadesSearchTerm(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="history-filter-button"
                onClick={() => setNovedadesRefreshKey((currentKey) => currentKey + 1)}
              >
                <Search size={15} />
                Buscar
              </button>
            </section>

            <section className="history-filters" aria-label="Estado de novedades">
              {NOVEDAD_ESTADO_FILTROS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={novedadesEstado === filter.value ? 'active' : undefined}
                  onClick={() => setNovedadesEstado(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </section>

            <section className="history-filters novedades-periods" aria-label="Periodo de novedades">
              {NOVEDAD_PERIODO_FILTROS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={novedadesPeriodo === filter.value ? 'active' : undefined}
                  onClick={() => setNovedadesPeriodo(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </section>

            <section className="history-metrics" aria-label="Resumen de novedades">
              <article className="con-novedad">
                <span><FileText size={17} /></span>
                <div>
                  <small>Abiertas</small>
                  <strong>{novedades.filter((novedad) => novedad.estado_novedad === 'abierta').length}</strong>
                </div>
              </article>
              <article className="entregado">
                <span><CheckCircle2 size={17} /></span>
                <div>
                  <small>Resueltas</small>
                  <strong>{novedades.filter((novedad) => novedad.estado_novedad === 'resuelta').length}</strong>
                </div>
              </article>
              <article className="cancelado">
                <span><EyeOff size={17} /></span>
                <div>
                  <small>Canceladas</small>
                  <strong>{novedades.filter((novedad) => novedad.estado_novedad === 'cancelada').length}</strong>
                </div>
              </article>
              <article className="reasignado">
                <span><Package size={17} /></span>
                <div>
                  <small>Total</small>
                  <strong>{novedades.length}</strong>
                </div>
              </article>
            </section>

            {isLoadingNovedades ? <p className="status-message">Cargando novedades...</p> : null}
            {assignError && mainTab === 'mapa' ? <p className="status-message error-message">{assignError}</p> : null}
            {novedadesError ? (
              <div className="status-card">
                <p>{novedadesError}</p>
                <button type="button" onClick={() => setNovedadesRefreshKey((currentKey) => currentKey + 1)}>
                  Reintentar
                </button>
              </div>
            ) : null}

            {!isLoadingNovedades && !novedadesError ? (
              <div className="novedades-list">
                {novedades.length ? (
                  novedades.map((novedad) => {
                    const estadoLabel = NOVEDAD_ESTADO_FILTROS.find((filter) => filter.value === novedad.estado_novedad)?.label || novedad.estado_novedad
                    const issueText = novedad.motivo || novedad.tipo_novedad || 'Novedad reportada'
                    const descriptionText = novedad.descripcion || 'Sin descripcion'
                    const reportedLabel = eventDateTimeLabel(novedad.reportada_en) || 'Sin fecha'
                    const resolvedLabel = eventDateTimeLabel(novedad.resuelta_en) || null

                    return (
                      <article key={novedad.id_novedad} className="novedad-card">
                        <img
                          src={novedad.imagen_arreglo || novedad.imagenes_arreglo?.[0] || APP_LOGO_URL}
                          alt={novedad.arreglo || `Pedido ${novedad.numero_pedido}`}
                        />
                        <div className="novedad-card-content">
                          <div className="novedad-card-topline">
                            <strong>#{novedad.numero_pedido ?? 'N/A'}</strong>
                            <span className={`novedad-status ${novedad.estado_novedad}`}>{estadoLabel}</span>
                          </div>
                          <h2>{novedad.destinatario || novedad.cliente || 'Cliente sin nombre'}</h2>
                          <p className="order-arrangement">{novedad.arreglo || 'Arreglo sin especificar'}</p>
                          <p>
                            <MapPin size={13} />
                            {novedad.direccion || 'Sin direccion'}
                          </p>
                          <p>
                            <FileText size={13} />
                            {issueText}: {descriptionText}
                          </p>
                          <div className="novedad-meta">
                            <span>Reportada: {reportedLabel}</span>
                            {resolvedLabel ? <span>Resuelta: {resolvedLabel}</span> : null}
                          </div>
                          <div className="novedad-actions">
                            {novedad.puede_contactar_cliente ? (
                              <>
                                <a href={`tel:${novedad.telefono_destinatario || ''}`}>
                                  <Phone size={14} />
                                  Llamar
                                </a>
                                <a href={`https://wa.me/${String(novedad.telefono_destinatario || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                                  <MessageSquare size={14} />
                                  WhatsApp
                                </a>
                              </>
                            ) : null}
                            {novedad.evidencia_foto_url ? (
                              <a href={novedad.evidencia_foto_url} target="_blank" rel="noreferrer">
                                <Eye size={14} />
                                Evidencia
                              </a>
                            ) : null}
                            {novedad.estado_novedad === 'abierta' ? (
                              <button type="button" onClick={() => openResolveNovedad(novedad)}>
                                <CheckCircle2 size={14} />
                                Resolver
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    )
                  })
                ) : (
                  <div className="status-card">
                    <p>No hay novedades para estos filtros.</p>
                  </div>
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        {mainTab === 'historial' ? (
          <section className="history-view" aria-label="Historial de entregas">
            <header className="profile-topbar">
              <button type="button" aria-label="Menu" onClick={() => setIsMenuOpen(true)}>
                <Menu size={22} />
              </button>
              <strong>Historial</strong>
              <span aria-hidden="true" />
            </header>

            <section className="history-hero">
              <div>
                <h1>Hola, {session.domiciliario.nombre_empleado.split(' ')[0]}</h1>
                <p>Revisa tu historial de entregas</p>
              </div>
              {tenantLogoUrl ? (
                <img className="hero-tenant-logo" src={tenantLogoUrl} alt={tenantName} />
              ) : null}
            </section>

            <section className="history-tabs" aria-label="Tipo de pedidos">
              <button type="button" onClick={() => setMainTab('ordenes')}>
                <Package size={14} />
                Pedidos disponibles
              </button>
              <button
                type="button"
                onClick={() => {
                  setMainTab('ordenes')
                  setActiveTab('mis-pedidos')
                }}
              >
                <Clipboard size={14} />
                Mis pedidos
              </button>
              <button type="button" className="active">
                <History size={14} />
                Historial
              </button>
            </section>

            <section className="history-search">
              <label className="search-box">
                <Search size={18} />
                <span className="sr-only">Buscar en historial</span>
                <input
                  type="search"
                  placeholder="Buscar pedido, cliente o direccion"
                  value={historialSearchTerm}
                  onChange={(event) => setHistorialSearchTerm(event.target.value)}
                />
              </label>
              <label className="history-date-filter">
                <CalendarDays size={15} />
                <span className="sr-only">Filtrar historial por fecha</span>
                <input
                  type="date"
                  value={historialDateFilter}
                  onChange={(event) => setHistorialDateFilter(event.target.value)}
                />
              </label>
            </section>

            <section className="history-filters" aria-label="Filtros del historial">
              {HISTORIAL_FILTROS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={historialPeriodo === filter.value ? 'active' : undefined}
                  onClick={() => setHistorialPeriodo(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
              {historialDateFilter ? (
                <button type="button" onClick={() => setHistorialDateFilter('')}>
                  Limpiar fecha
                </button>
              ) : null}
            </section>

            <section className="history-metrics" aria-label="Filtrar historial por estado">
              <button
                type="button"
                className={`history-metric-card entregado ${historialStatusFilter === 'entregado' ? 'active' : ''}`}
                onClick={() => setHistorialStatusFilter(historialStatusFilter === 'entregado' ? 'todos' : 'entregado')}
              >
                <span><CheckCircle2 size={17} /></span>
                <div>
                  <small>Entregados</small>
                  <strong>{historialEntregadosCount}</strong>
                </div>
              </button>
              <button
                type="button"
                className={`history-metric-card con-novedad ${historialStatusFilter === 'con_novedad' ? 'active' : ''}`}
                onClick={() => setHistorialStatusFilter(historialStatusFilter === 'con_novedad' ? 'todos' : 'con_novedad')}
              >
                <span><FileText size={17} /></span>
                <div>
                  <small>Novedades</small>
                  <strong>{historialConNovedadCount}</strong>
                </div>
              </button>
              <button
                type="button"
                className={`history-metric-card cancelado ${historialStatusFilter === 'cancelado' ? 'active' : ''}`}
                onClick={() => setHistorialStatusFilter(historialStatusFilter === 'cancelado' ? 'todos' : 'cancelado')}
              >
                <span><EyeOff size={17} /></span>
                <div>
                  <small>Cancelados</small>
                  <strong>{historialCanceladosCount}</strong>
                </div>
              </button>
              <button
                type="button"
                className={`history-metric-card reasignado ${historialStatusFilter === 'reasignado' ? 'active' : ''}`}
                onClick={() => setHistorialStatusFilter(historialStatusFilter === 'reasignado' ? 'todos' : 'reasignado')}
              >
                <span><Radio size={17} /></span>
                <div>
                  <small>Reasignados</small>
                  <strong>{historialReasignadosCount}</strong>
                </div>
              </button>
            </section>

            {isLoadingHistorial ? <p className="status-message">Cargando historial...</p> : null}
            {historialError ? (
              <div className="status-card">
                <p>{historialError}</p>
                <button type="button" onClick={() => setHistorialRefreshKey((currentKey) => currentKey + 1)}>
                  Reintentar
                </button>
              </div>
            ) : null}

            {!isLoadingHistorial && !historialError ? (
              <div className="history-list">
                {filteredHistorialPedidos.length ? (
                  filteredHistorialPedidos.map((pedido) => {
                    const estadoFinal = pedido.estado_final || 'entregado'
                    const estadoLabel = HISTORIAL_ESTADO_LABEL[estadoFinal] || estadoFinal
                    const evidenceUrl = pedido.evidencia_entrega_url || pedido.evidencia_firma_url
                    const detailText = pedido.novedad || pedido.observaciones

                    return (
                      <article key={pedido.numero_pedido ?? `${pedido.destinatario}-${pedido.fecha_entrega}`} className="history-card">
                        <img
                          src={pedido.imagen_arreglo || pedido.imagenes_arreglo?.[0] || APP_LOGO_URL}
                          alt={pedido.arreglo || `Pedido ${pedido.numero_pedido}`}
                        />
                        <div className="history-card-content">
                          <strong className="history-order-number">#{pedido.numero_pedido ?? 'N/A'}</strong>
                          <h2>{pedido.destinatario || pedido.cliente || 'Cliente sin nombre'}</h2>
                          <p className="order-arrangement">{pedido.arreglo || 'Arreglo sin especificar'}</p>
                          <div className="history-location">
                            <span><MapPin size={12} /> {pedido.direccion || 'Sin direccion'}</span>
                            <span><Package size={12} /> {pedido.barrio || 'Sin barrio'}</span>
                          </div>
                          {detailText && ['con_novedad', 'cancelado', 'reasignado'].includes(estadoFinal) ? (
                            <p className="history-detail">
                              <FileText size={14} />
                              {detailText}
                            </p>
                          ) : null}
                        </div>
                        <span className={`history-status ${estadoFinal}`}>{estadoLabel}</span>
                        <div className="history-timeline">
                          <div>
                            <span>Asignado</span>
                            <strong>{formatDateControl(dateOnly(pedido.fecha_asignacion || '')) || 'N/A'}</strong>
                            <small>{pedido.hora_asignado || 'N/A'}</small>
                          </div>
                          <div>
                            <span>{estadoFinal === 'cancelado' ? 'Cancelado' : 'Entregado'}</span>
                            <strong>{formatDateControl(dateOnly(pedido.fecha_entrega || '')) || 'N/A'}</strong>
                            <small>{pedido.hora_entregado || 'N/A'}</small>
                          </div>
                        </div>
                        <div className="history-phone">
                          <Phone size={12} />
                          {pedido.telefono_destinatario || 'Sin telefono'}
                        </div>
                        {evidenceUrl ? (
                          <div className="history-actions">
                            <a href={evidenceUrl} target="_blank" rel="noreferrer">
                              <Eye size={13} />
                              Ver evidencia
                            </a>
                          </div>
                        ) : null}
                      </article>
                    )
                  })
                ) : (
                  <div className="status-card">
                    <p>No hay pedidos en el historial para este filtro.</p>
                  </div>
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        {mainTab === 'perfil' ? (
          <section className="profile-view" aria-label="Perfil del domiciliario">
            <header className="profile-topbar">
              <button type="button" aria-label="Menu" onClick={() => setIsMenuOpen(true)}>
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
                {isUploadingProfilePhoto ? <small>Subiendo foto...</small> : null}
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

            <section className="profile-info" aria-label="Informacion del domiciliario">
              <article>
                <span><User size={16} /> Usuario</span>
                <strong>{session.domiciliario.usuario || 'Sin usuario'}</strong>
              </article>
              <article>
                <span><MessageSquare size={16} /> Email</span>
                <strong>{session.domiciliario.email || 'Sin email'}</strong>
              </article>
              <article>
                <span><ShieldCheck size={16} /> Cargo</span>
                <strong>{session.domiciliario.cargo || 'Domiciliario'}</strong>
              </article>
              <article>
                <span><Package size={16} /> Empresa</span>
                <strong>{tenantName}</strong>
              </article>
              <article>
                <span><MapPin size={16} /> Sucursal</span>
                <strong>{activeSucursalId || 'N/A'}</strong>
              </article>
              <article>
                <span><FileText size={16} /> ID empleado</span>
                <strong>{session.domiciliario.id_empleado}</strong>
              </article>
            </section>

            <section className="profile-actions" aria-label="Acciones de perfil">
              <button type="button" onClick={onLogout}>
                <LogOut size={17} />
                Cerrar sesion
              </button>
            </section>
          </section>
        ) : null}

        {mainTab !== 'ordenes' && isMenuOpen ? (
          <div className="hamburger-overlay" role="presentation" onClick={() => setIsMenuOpen(false)}>
            <aside
              className="hamburger-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu principal"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="hamburger-header">
                <button type="button" aria-label="Cerrar menu" onClick={() => setIsMenuOpen(false)}>
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <strong>{session.domiciliario.nombre_empleado}</strong>
                  <span>{tenantName}</span>
                </div>
              </header>

              <section className="hamburger-summary" aria-label="Resumen de jornada">
                <article>
                  <strong>{misPedidosPorFecha.length}</strong>
                  <span>Asignados</span>
                </article>
                <article>
                  <strong>{entregadosKpiCount}</strong>
                  <span>Entregados</span>
                </article>
                <article>
                  <strong>{noEntregadosPedidos.length}</strong>
                  <span>Novedades</span>
                </article>
              </section>

              <nav className="hamburger-menu" aria-label="Opciones del menu">
                <button type="button" onClick={() => openMainTab('ordenes')}>
                  <span><Package size={18} /> Pedidos</span>
                  <ChevronRight size={17} />
                </button>
                <button type="button" onClick={() => openMainTab('mapa')}>
                  <span><FileText size={18} /> Novedades</span>
                  <ChevronRight size={17} />
                </button>
                <button type="button" onClick={() => openMainTab('historial')}>
                  <span><History size={18} /> Historial</span>
                  <ChevronRight size={17} />
                </button>
                <button type="button" onClick={() => openMainTab('perfil')}>
                  <span><Settings size={18} /> Perfil y ajustes</span>
                  <ChevronRight size={17} />
                </button>
                <button type="button" className="hamburger-logout" onClick={handleMenuLogout}>
                  <span><LogOut size={18} /> Cerrar sesion</span>
                  <ChevronRight size={17} />
                </button>
              </nav>
            </aside>
          </div>
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
                    src={selectedPedido.imagen_arreglo || selectedPedido.imagenes_arreglo?.[0] || APP_LOGO_URL}
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
                <button type="button" aria-label="Opciones" onClick={() => setIsMenuOpen(true)}>
                  <Menu size={20} />
                </button>
              </header>

              <section className="route-order">
                <img
                  src={routePedido.imagen_arreglo || routePedido.imagenes_arreglo?.[0] || APP_LOGO_URL}
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
                  src={proofPedido.imagen_arreglo || proofPedido.imagenes_arreglo?.[0] || APP_LOGO_URL}
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
                  src={proofPhotoUrl || proofPedido.imagen_arreglo || proofPedido.imagenes_arreglo?.[0] || APP_LOGO_URL}
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
                <button
                  type="button"
                  className="proof-link-action"
                  aria-label="Tomar foto de entrega con la camara"
                  onClick={() => proofPhotoInputRef.current?.click()}
                >
                  <Camera size={16} />
                  Tomar foto
                </button>
              </section>

              <section className="proof-section">
                <div className="proof-section-heading">
                  <h2>Firma del recibido</h2>
                  <button type="button" disabled={!hasProofSignature} onClick={handleClearProofSignature}>
                    Limpiar
                  </button>
                </div>
                <div className="signature-pad" aria-label="Firma capturada">
                  <canvas
                    ref={proofSignatureCanvasRef}
                    aria-label="Espacio para firmar"
                    onPointerDown={handleProofSignatureStart}
                    onPointerMove={handleProofSignatureMove}
                    onPointerUp={handleProofSignatureEnd}
                    onPointerCancel={handleProofSignatureEnd}
                    onLostPointerCapture={handleProofSignatureEnd}
                  />
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
                  src={novedadPedido.imagen_arreglo || novedadPedido.imagenes_arreglo?.[0] || APP_LOGO_URL}
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
                  <button
                    type="button"
                    aria-label="Tomar foto de la novedad con la camara"
                    onClick={() => novedadPhotoInputRef.current?.click()}
                  >
                    <Camera size={28} />
                    Tomar foto
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

        {resolvingNovedad ? (
          <div className="novedad-overlay" role="dialog" aria-modal="true" aria-label="Resolver novedad">
            <section className="novedad-view">
              <header className="proof-topbar">
                <button type="button" aria-label="Volver" onClick={() => setResolvingNovedad(null)}>
                  <ArrowLeft size={21} />
                </button>
                <strong>Resolver novedad</strong>
                <span aria-hidden="true" />
              </header>

              <section className="novedad-order">
                <img
                  src={resolvingNovedad.imagen_arreglo || resolvingNovedad.imagenes_arreglo?.[0] || APP_LOGO_URL}
                  alt={resolvingNovedad.arreglo || `Pedido ${resolvingNovedad.numero_pedido}`}
                />
                <div>
                  <strong>#{resolvingNovedad.numero_pedido ?? 'N/A'}</strong>
                  <span>{resolvingNovedad.motivo || resolvingNovedad.tipo_novedad || 'Novedad reportada'}</span>
                </div>
                <em>Abierta</em>
              </section>

              <section className="novedad-section">
                <h2>Que paso despues de la novedad</h2>
                <div className="resolve-actions">
                  {RESOLVE_NOVEDAD_ACTIONS.map((action) => (
                    <button
                      key={action.value}
                      type="button"
                      className={resolveAction === action.value ? 'active' : undefined}
                      onClick={() => setResolveAction(action.value)}
                    >
                      <span>
                        {action.value === 'entregar' ? <CheckCircle2 size={17} /> : null}
                        {action.value === 'reintentar' ? <Bike size={17} /> : null}
                        {action.value === 'devolver' ? <Package size={17} /> : null}
                        {action.label}
                      </span>
                      <small>{action.description}</small>
                    </button>
                  ))}
                </div>
              </section>

              {resolveAction === 'entregar' ? (
                <>
                  <section className="novedad-section">
                    <h2>Evidencia de entrega</h2>
                    <div className="novedad-photo-grid">
                      {resolveEvidenceUrl ? (
                        <img src={resolveEvidenceUrl} alt="Evidencia de entrega" />
                      ) : null}
                      <button type="button" onClick={() => resolveEvidenceInputRef.current?.click()}>
                        <Camera size={28} />
                        Agregar foto
                      </button>
                    </div>
                    <input
                      ref={resolveEvidenceInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      onChange={handleResolveEvidenceChange}
                    />
                  </section>

                  <label className="novedad-section resolve-field">
                    <h2>Nombre de quien recibe (opcional)</h2>
                    <input
                      type="text"
                      value={resolveSignatureName}
                      onChange={(event) => setResolveSignatureName(event.target.value)}
                      placeholder="Nombre del recibido"
                    />
                  </label>

                  <label className="novedad-section resolve-field">
                    <h2>Documento (opcional)</h2>
                    <input
                      type="text"
                      value={resolveSignatureDocument}
                      onChange={(event) => setResolveSignatureDocument(event.target.value)}
                      placeholder="Documento de quien recibe"
                    />
                  </label>
                </>
              ) : null}

              <label className="novedad-section">
                <h2>Observaciones (opcional)</h2>
                <textarea
                  value={resolveObservations}
                  onChange={(event) => setResolveObservations(event.target.value)}
                  placeholder="Notas internas"
                />
              </label>

              {assignError ? <p className="status-message error-message">{assignError}</p> : null}

              <button
                type="button"
                className="novedad-save-action"
                disabled={savingResolveNovedadId === resolvingNovedad.id_novedad}
                onClick={handleResolveNovedad}
              >
                {savingResolveNovedadId === resolvingNovedad.id_novedad ? 'Resolviendo...' : 'Confirmar resolucion'}
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
            Pedidos
          </button>
          <button
            type="button"
            className={mainTab === 'mapa' ? 'active' : undefined}
            onClick={() => setMainTab('mapa')}
          >
            <FileText size={20} />
            Novedades
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
    localStorage.removeItem(TENANT_KEY)
    localStorage.removeItem(EMPRESA_ID_KEY)
    localStorage.removeItem(SUCURSAL_ID_KEY)
    localStorage.removeItem(TOKEN_KEY)
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
