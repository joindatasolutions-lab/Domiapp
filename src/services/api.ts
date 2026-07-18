import { Order, OrderStatus } from '../types'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'https://join-flower-708265049038.us-central1.run.app'
).replace(/\/$/, '')
const SESSION_KEY = 'domiapp.session'
const ACCESS_TOKEN_KEY = 'accessToken'
const AVAILABLE_PAGE_SIZE = 200
const MAX_AVAILABLE_PAGES = 20

interface LoginResponse {
  accessToken: string
  tokenType?: string
  expiresIn?: number
  user: AuthUser
}

export interface AuthUser {
  userID: number
  empresaID: number
  sucursalID?: number | null
  rolID: number
  rol: string
  nombre: string
  login: string
  email: string
}

export interface AuthSession {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}

interface DomicilioCourierCard {
  idEntrega: number
  pedidoID: number
  numeroPedido: number
  codigoPedido?: string | null
  cliente?: string | null
  destinatario?: string | null
  direccion?: string | null
  barrio?: string | null
  zona?: string | null
  telefonoDestino?: string | null
  mensaje?: string | null
  observacion?: string | null
  estado: string
  horaEntrega?: string | null
  fechaEntregaProgramada?: string | null
  latitudDestino?: number | null
  longitudDestino?: number | null
  latitudEntrega?: number | null
  longitudEntrega?: number | null
  distanciaKm?: number | null
  prioridad?: string | null
  fechaAsignacion?: string | null
  domiciliarioID?: number | null
  items?: unknown[] | null
  productos?: unknown[] | null
  detalle?: unknown[] | null
  detalles?: unknown[] | null
}

interface DomicilioListResponse {
  items: DomicilioCourierCard[]
  total: number
}

interface PedidoDisponible {
  id: number
  idEntrega?: number | null
  pedidoID?: number | null
  produccionID?: number | null
  numeroPedido: string
  codigoPedido?: string | null
  arreglo?: string | null
  nombreArreglo?: string | null
  nombre_arreglo?: string | null
  producto?: string | null
  resumenProductos?: string | null
  resumen_productos?: string | null
  cliente: string
  destinatario?: string | null
  direccion: string | null
  telefonoDestino?: string | null
  telefonoDestinatario?: string | null
  celularDestinatario?: string | null
  barrio?: string | null
  nombreBarrio?: string | null
  zona?: string | null
  nombreZona?: string | null
  horaEntrega?: string | null
  fechaEntregaProgramada?: string | null
  latitudDestino?: number | null
  longitudDestino?: number | null
  imageUrl?: string | null
  image_url?: string | null
  imagenUrl?: string | null
  imagen_url?: string | null
  imagenProductoUrl?: string | null
  imagen_producto_url?: string | null
  estado: 'SIN_ASIGNAR'
  prioridad: string | null
  items?: unknown[] | null
  productos?: unknown[] | string[] | null
  detalle?: unknown[] | null
  detalles?: unknown[] | null
}

interface PedidoAsignado {
  id: number
  numeroPedido: string
  cliente: string
  direccion: string | null
  barrio?: string | null
  zona?: string | null
  horaEntrega?: string | null
  fechaEntregaProgramada?: string | null
  estado: 'ASIGNADO'
  prioridad: string | null
  idEntrega: number
  domiciliarioID: number
  fechaAsignacion: string
  contadores: DomicilioContadores | null
}

interface PedidoDevuelto {
  pedido?: PedidoDisponible | null
  contadores?: DomicilioContadores | null
}

interface BarrioApiItem {
  barrioID?: number | null
  idBarrio?: number | null
  id?: number | null
  nombreBarrio?: string | null
  barrio?: string | null
  nombre?: string | null
  zonaID?: number | null
  zonaId?: number | null
  idZona?: number | null
  nombreZona?: string | null
  zonaNombre?: string | null
  zona?: string | { nombre?: string | null; nombreZona?: string | null; descripcion?: string | null } | null
}

export interface DomicilioContadores {
  asignados: number
  enCamino: number
  entregados: number
  disponibles: number
}

interface CompleteDeliveryOptions {
  proofFiles?: File[]
  latitude?: number
  longitude?: number
  signatureName?: string
  signatureDocument?: string
  observations?: string
}

const saveSession = (session: AuthSession) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
}

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

const getSession = (): AuthSession | null => {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    clearSession()
    return null
  }
}

const authHeaders = () => {
  const session = getSession()
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || session?.accessToken
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

const hasAuth = () => Boolean(localStorage.getItem(ACCESS_TOKEN_KEY) && getSession())

const currentUserLabel = () => {
  const user = getSession()?.user
  return user?.login || user?.nombre || 'domiapp'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const body = init.body

  Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, value))
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  })

  if (response.status === 401) {
    clearSession()
    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
    throw new Error('Tu sesion expiro. Inicia sesion nuevamente.')
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const message = data?.error?.message || data?.detail?.message || data?.detail || data?.message
    const error = new Error(typeof message === 'string' ? message : `Error ${response.status}`)
    Object.assign(error, {
      status: response.status,
      code: data?.error?.code
    })
    throw error
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const isNotFoundError = (error: unknown) => (error as { status?: number })?.status === 404

const statusFromApi = (status: string): OrderStatus => {
  const normalized = status.trim().toUpperCase().replace(/[_\s-]/g, '')
  if (normalized === 'SINASIGNAR') return 'SIN_ASIGNAR'
  if (normalized === 'ASIGNADO') return 'ASIGNADO'
  if (normalized === 'ENRUTA') return 'EN_RUTA'
  if (normalized === 'ENCAMINO') return 'EN_RUTA'
  if (normalized === 'ENTREGADO') return 'ENTREGADO'
  if (normalized === 'NOENTREGADO' || normalized === 'CANCELADO') return 'RETRASADO'
  return 'PENDIENTE'
}

const formatTime = (value?: string | null) => {
  if (!value) return '--:--'
  const text = value.trim()
  if (!text) return '--:--'
  if (/^\d{1,2}:\d{2}/.test(text)) return text.slice(0, 5)

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return '--:--'

  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const timeFromApi = (item: Record<string, unknown>) => {
  const directTime = optionalText(
    firstValue(
      item.horaEntrega,
      item.hora_entrega,
      item.hora,
      item.deliveryTime,
      item.time,
      (item.pedido as Record<string, unknown> | undefined)?.horaEntrega,
      (item.pedido as Record<string, unknown> | undefined)?.hora,
      (item.entrega as Record<string, unknown> | undefined)?.horaEntrega,
      (item.entrega as Record<string, unknown> | undefined)?.hora
    )
  )

  if (directTime) return formatTime(directTime)

  return formatTime(
    optionalText(
      firstValue(
        item.fechaEntregaProgramada,
        item.fecha_entrega_programada,
        item.fechaEntrega,
        item.fecha_entrega,
        item.fechaProgramada,
        item.fecha_programada,
        item.deliveryDate,
        item.scheduledDeliveryDate,
        item.scheduledAt,
        item.createdAt,
        (item.pedido as Record<string, unknown> | undefined)?.fechaEntregaProgramada,
        (item.pedido as Record<string, unknown> | undefined)?.fechaEntrega,
        (item.entrega as Record<string, unknown> | undefined)?.fechaEntregaProgramada,
        (item.entrega as Record<string, unknown> | undefined)?.fechaEntrega
      )
    )
  )
}

const optionalText = (value?: unknown) => {
  const text = String(value ?? '').trim()
  return text || undefined
}

const textFromNested = (value: unknown) => {
  if (!value || typeof value !== 'object') return optionalText(value)
  const item = value as Record<string, unknown>
  return optionalText(item.nombre ?? item.name ?? item.descripcion ?? item.description ?? item.zona ?? item.barrio)
}

const zoneFromApi = (item: Record<string, unknown>) =>
  textFromNested(
    firstValue(
      item.zona,
      item.nombreZona,
      item.zonaNombre,
      item.nombre_zona,
      item.zona_nombre,
      item.zone,
      item.zoneName,
      item.sector,
      item.localidad,
      (item.pedido as Record<string, unknown> | undefined)?.zona,
      (item.direccionEntrega as Record<string, unknown> | undefined)?.zona,
      (item.destino as Record<string, unknown> | undefined)?.zona
    )
  )

const neighborhoodFromApi = (item: Record<string, unknown>) =>
  textFromNested(
    firstValue(
      item.barrio,
      item.nombreBarrio,
      item.barrioNombre,
      item.nombre_barrio,
      item.neighborhood,
      (item.pedido as Record<string, unknown> | undefined)?.barrio,
      (item.direccionEntrega as Record<string, unknown> | undefined)?.barrio,
      (item.destino as Record<string, unknown> | undefined)?.barrio
    )
  )

const mapDomicilioToOrder = (item: DomicilioCourierCard): Order => {
  const neighborhood = neighborhoodFromApi(item as unknown as Record<string, unknown>)
  const addressParts = [item.direccion, neighborhood].filter(Boolean)
  const status = statusFromApi(item.estado)

  return {
    id: String(item.idEntrega),
    pedidoId: String(item.pedidoID),
    number: item.codigoPedido || `#${item.numeroPedido}`,
    customer: item.destinatario || item.cliente || 'Cliente',
    address: addressParts.join(', ') || 'Direccion no registrada',
    neighborhood,
    zone: zoneFromApi(item as unknown as Record<string, unknown>),
    time: timeFromApi(item as unknown as Record<string, unknown>),
    value: 0,
    earnings: 0,
    phone: item.telefonoDestino || '',
    status,
    priority: item.prioridad || undefined,
    items: mapProductItems(item) ?? fallbackOrderItem(item.pedidoID, item.codigoPedido || item.numeroPedido),
    paymentMethod: 'Transferencia',
    currentLocation: {
      lat: item.latitudEntrega ?? item.latitudDestino ?? 0,
      lng: item.longitudEntrega ?? item.longitudDestino ?? 0
    },
    customerLocation: {
      lat: item.latitudDestino ?? 0,
      lng: item.longitudDestino ?? 0
    },
    etaMinutes: 0,
    distanceKm: item.distanciaKm ?? 0,
    // Keep only the official observation; do not include customer's free-text message.
    notes: item.observacion || undefined,
    deliveredAt: status === 'ENTREGADO' ? formatTime(item.fechaEntregaProgramada) : undefined,
    assignedAt: item.fechaAsignacion || undefined,
    courierId: item.domiciliarioID ? String(item.domiciliarioID) : undefined
  }
}

const mapAvailablePedidoToOrder = (item: PedidoDisponible): Order => {
  const arrangement = availableArrangementText(item)

  return {
    id: String(item.id),
    pedidoId: String(item.pedidoID ?? item.id),
    number: item.codigoPedido || item.numeroPedido,
    customer: item.destinatario || item.cliente || 'Cliente',
    address: item.direccion || 'Direccion no registrada',
    neighborhood: neighborhoodFromApi(item as unknown as Record<string, unknown>),
    zone: zoneFromApi(item as unknown as Record<string, unknown>),
    time: timeFromApi(item as unknown as Record<string, unknown>),
    value: 0,
    earnings: 0,
    phone: item.celularDestinatario || item.telefonoDestinatario || item.telefonoDestino || '',
    status: 'SIN_ASIGNAR',
    priority: item.prioridad || undefined,
    arrangement,
    items: availableProductItems(item),
    paymentMethod: 'Transferencia',
    currentLocation: { lat: 0, lng: 0 },
    customerLocation: { lat: item.latitudDestino ?? 0, lng: item.longitudDestino ?? 0 },
    etaMinutes: 0,
    distanceKm: 0
  }
}

const mapAssignedPedidoToOrder = (item: PedidoAsignado): Order => ({
  id: String(item.idEntrega),
  pedidoId: String(item.id),
  number: item.numeroPedido,
  customer: item.cliente || 'Cliente',
  address: item.direccion || 'Direccion no registrada',
  neighborhood: neighborhoodFromApi(item as unknown as Record<string, unknown>),
  zone: zoneFromApi(item as unknown as Record<string, unknown>),
  time: timeFromApi(item as unknown as Record<string, unknown>),
  value: 0,
  earnings: 0,
  phone: '',
  status: 'ASIGNADO',
  priority: item.prioridad || undefined,
  items: fallbackOrderItem(item.id, item.numeroPedido),
  paymentMethod: 'Transferencia',
  currentLocation: { lat: 0, lng: 0 },
  customerLocation: { lat: 0, lng: 0 },
  etaMinutes: 0,
  distanceKm: 0,
  assignedAt: item.fechaAsignacion,
  courierId: String(item.domiciliarioID)
})

const orderToAvailable = (order: Order): Order => ({
  ...order,
  id: order.pedidoId ?? order.id,
  pedidoId: order.pedidoId ?? order.id,
  status: 'SIN_ASIGNAR',
  assignedAt: undefined,
  courierId: undefined
})

const normalizeImageUrl = (value?: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const url = value.trim()
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('/')) return url
  return `${API_BASE_URL}/${url.replace(/^\/+/, '')}`
}

const firstValue = (...values: unknown[]) =>
  values.find((value) => value !== null && value !== undefined && String(value).trim() !== '')

const stripProductCode = (value: unknown) =>
  optionalText(value)?.replace(/^\s*[A-Z]*\d+[A-Z0-9-]*\s*[-–—]\s*/i, '')

const textField = (data: Record<string, unknown>, ...keys: string[]) => firstValue(...keys.map((key) => data[key]))

const looseTextField = (data: Record<string, unknown>, ...keys: string[]) => {
  const normalized = new Map(Object.entries(data).map(([key, value]) => [normalizeText(key), value]))
  return firstValue(...keys.map((key) => normalized.get(normalizeText(key))))
}

const arrangementKeys = [
  'arreglo',
  'nombreArreglo',
  'arregloNombre',
  'nombre_arreglo',
  'arreglo_nombre',
  'producto',
  'nombreProducto',
  'productoNombre',
  'nombre_producto',
  'producto_nombre',
  'descripcionProducto',
  'productoDescripcion',
  'descripcion_producto',
  'producto_descripcion',
  'resumenProductos',
  'resumen_productos'
]

const arrangementTextField = (data: Record<string, unknown>) =>
  firstValue(textField(data, ...arrangementKeys), looseTextField(data, ...arrangementKeys))

const isUsefulArrangementKey = (key: string) => {
  const normalized = normalizeText(key)
  if (!/(arreglo|producto)/.test(normalized)) return false
  return !/(id|codigo|code|sku|imagen|image|foto|url|precio|valor|cantidad|qty|subtotal|total)/.test(normalized)
}

const findArrangementText = (value: unknown, depth = 0): unknown => {
  if (!value || depth > 4) return undefined
  if (typeof value === 'string') return stripProductCode(value)
  if (Array.isArray(value)) {
    return firstValue(...value.map((item) => findArrangementText(item, depth + 1)))
  }
  if (typeof value !== 'object') return undefined

  const data = value as Record<string, unknown>
  const direct = arrangementTextField(data)
  if (direct) return direct

  const keyed = firstValue(
    ...Object.entries(data)
      .filter(([key]) => isUsefulArrangementKey(key))
      .map(([, item]) => findArrangementText(item, depth + 1))
  )
  if (keyed) return keyed

  return firstValue(...Object.values(data).map((item) => findArrangementText(item, depth + 1)))
}

const availableArrangementText = (item: PedidoDisponible) => {
  const data = item as unknown as Record<string, unknown>
  const pedido = (data.pedido as Record<string, unknown> | undefined) ?? {}
  const produccion = (data.produccion as Record<string, unknown> | undefined) ?? {}
  const entrega = (data.entrega as Record<string, unknown> | undefined) ?? {}
  const products = Array.isArray(item.productos)
    ? item.productos
        .map((product) => {
          if (typeof product === 'string') return product
          const raw = product as Record<string, unknown>
          return firstValue(arrangementTextField(raw), textField(raw, 'descripcion', 'description', 'name', 'nombre'))
        })
        .filter(Boolean)
        .join(', ')
    : typeof item.productos === 'string'
      ? item.productos
      : undefined

  return stripProductCode(
    firstValue(
      arrangementTextField(data),
      arrangementTextField(pedido),
      arrangementTextField(produccion),
      arrangementTextField(entrega),
      products,
      findArrangementText(data)
    )
  )
}

const availableProductItems = (item: PedidoDisponible): Order['items'] => {
  const name = availableArrangementText(item)
  const image = normalizeImageUrl(
    firstValue(item.imageUrl, item.image_url, item.imagenUrl, item.imagen_url, item.imagenProductoUrl, item.imagen_producto_url)
  )
  const mappedItems = mapProductItems(item)

  return name || image
    ? [
        {
          id: String(item.id),
          name: name || `Pedido ${item.codigoPedido || item.numeroPedido || item.id}`,
          qty: 1,
          image
        }
      ]
    : mappedItems ?? fallbackOrderItem(item.id, item.codigoPedido || item.numeroPedido)
}

const productCollections = (data: any): unknown[] | null => {
  const candidates = [
    data?.items,
    data?.productos,
    data?.detalle,
    data?.detalles,
    data?.pedidoDetalle,
    data?.pedido_detalle,
    data?.lineas,
    data?.productosPedido,
    data?.pedido?.items,
    data?.pedido?.productos,
    data?.pedido?.detalle,
    data?.pedido?.detalles
  ]

  const found = candidates.find((candidate) => Array.isArray(candidate) && candidate.length > 0)
  return found as unknown[] | null
}

const mapProductItems = (data: any): Order['items'] | null => {
  const products = productCollections(data)
  if (!products) return null

  return products.map((raw, index) => {
    if (typeof raw === 'string') {
      return {
        id: String(index),
        name: stripProductCode(raw) || raw,
        qty: 1
      }
    }

    const item = raw as any
    const product = item.producto ?? item.product ?? item.inventario ?? item.catalogo ?? {}
    const id = firstValue(
      item.id,
      item.detalleID,
      item.detalleId,
      item.productoID,
      item.productoId,
      product.id,
      product.productoID,
      product.productoId,
      index
    )
    const name = firstValue(
      item.nombreArreglo,
      item.producto,
      item.nombreProducto,
      item.nombre,
      item.name,
      item.productoNombre,
      item.product_name,
      item.descripcion,
      item.description,
      product.nombreArreglo,
      product.producto,
      product.nombreProducto,
      product.nombre,
      product.name,
      product.descripcion,
      `Producto ${index + 1}`
    )
    const code = optionalText(
      firstValue(
        item.codigo,
        item.code,
        item.referencia,
        item.reference,
        item.sku,
        item.codigoProducto,
        item.codigoCatalogo,
        item.codigoArreglo,
        item.productoCodigo,
        item.product_code,
        item.codProducto,
        item.codigoInventario,
        product.codigo,
        product.code,
        product.referencia,
        product.reference,
        product.sku,
        product.codigoProducto,
        product.codigoCatalogo,
        product.codigoArreglo,
        product.productoCodigo,
        product.product_code,
        product.codProducto,
        product.codigoInventario
      )
    )
    const qty = Number(firstValue(item.cantidad, item.qty, item.quantity, item.unidades, 1)) || 1
    const image = normalizeImageUrl(
      firstValue(
        item.imagen,
        item.imagenUrl,
        item.imagenURL,
        item.image,
        item.imageUrl,
        item.image_url,
        item.foto,
        item.fotoUrl,
        item.urlImagen,
        product.imagen,
        product.imagenUrl,
        product.image,
        product.imageUrl,
        product.foto,
        product.fotoUrl,
        product.urlImagen
      )
    )

    return {
      id: String(id),
      name: stripProductCode(name) || String(name),
      qty,
      code,
      image
    }
  })
}

const fallbackOrderItem = (id: string | number, number?: string | number | null): Order['items'] => [
  {
    id: String(id),
    name: `Pedido ${number || id}`,
    qty: 1
  }
]

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

const neighborhoodKey = (value?: string) => (value ? normalizeText(value) : '')

const barrioNameFromApi = (item: BarrioApiItem) =>
  optionalText(item.nombreBarrio ?? item.barrio ?? item.nombre)

const barrioZoneFromApi = (item: BarrioApiItem) =>
  textFromNested(
    firstValue(
      item.nombreZona,
      item.zonaNombre,
      item.zona,
      item.zonaID,
      item.zonaId,
      item.idZona
    )
  )

const fetchNeighborhoodZoneMap = async () => {
  const sucursalID = getSession()?.user.sucursalID
  if (!sucursalID) return new Map<string, string>()

  try {
    const response = await request<BarrioApiItem[] | { items?: BarrioApiItem[] }>(`/barrios?sucursalID=${sucursalID}`)
    const items = Array.isArray(response) ? response : response.items ?? []

    return items.reduce((map, item) => {
      const neighborhood = barrioNameFromApi(item)
      const zone = barrioZoneFromApi(item)
      if (neighborhood && zone) map.set(neighborhoodKey(neighborhood), zone)
      return map
    }, new Map<string, string>())
  } catch {
    return new Map<string, string>()
  }
}

const enrichOrdersWithZones = async (orders: Order[]) => {
  const missingZone = orders.some((order) => !order.zone && order.neighborhood)
  if (!missingZone) return orders

  const zonesByNeighborhood = await fetchNeighborhoodZoneMap()
  if (!zonesByNeighborhood.size) return orders

  return orders.map((order) => {
    if (order.zone || !order.neighborhood) return order
    const zone = zonesByNeighborhood.get(neighborhoodKey(order.neighborhood))
    return zone ? { ...order, zone } : order
  })
}

const isStorePickupOrder = (order: Pick<Order, 'address' | 'customer'>) => {
  const address = normalizeText(order.address)
  const customer = normalizeText(order.customer)
  return address.includes('recoger en tienda') || customer.includes('recoger en tienda')
}

const onlyAssignableDeliveryOrders = (orders: Order[]) => orders.filter((order) => !isStorePickupOrder(order))

const buildDomiciliosQuery = (date?: string, pagination?: { page?: number; pageSize?: number }) => {
  const user = getSession()?.user
  if (!user?.empresaID) {
    throw new Error('Debes iniciar sesion para consultar domicilios.')
  }

  const params = new URLSearchParams({
    empresaID: String(user.empresaID)
  })

  if (user.sucursalID) {
    params.set('sucursalID', String(user.sucursalID))
  }

  if (date) {
    params.set('fecha', date)
  }

  if (pagination?.page) {
    params.set('page', String(pagination.page))
  }

  if (pagination?.pageSize) {
    params.set('pageSize', String(pagination.pageSize))
  }

  return params.toString()
}

function uniqueOrders(orders: Order[]) {
  const seen = new Set<string>()
  return orders.filter((order) => {
    const key = order.pedidoId ?? order.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const api = {
  login: async (login: string, password: string): Promise<AuthSession> => {
    clearSession()
    const response = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password })
    })
    const session: AuthSession = {
      accessToken: response.accessToken,
      tokenType: response.tokenType || 'Bearer',
      expiresIn: response.expiresIn ?? 0,
      user: response.user
    }
    saveSession(session)
    return session
  },
  logout: () => {
    clearSession()
  },
  getSession,
  hasAuth,
  fetchOrders: async (date?: string): Promise<Order[]> => {
    const params = buildDomiciliosQuery(date)
    const response = await request<DomicilioListResponse>(`/domicilios/mis-pedidos?${params}`)
    return enrichOrdersWithZones(response.items.map(mapDomicilioToOrder))
  },
  fetchAvailableOrders: async (date?: string): Promise<Order[]> => {
    try {
      const orders: Order[] = []

      for (let page = 1; page <= MAX_AVAILABLE_PAGES; page += 1) {
        const params = buildDomiciliosQuery(date, { page, pageSize: AVAILABLE_PAGE_SIZE })
        const response = await request<PedidoDisponible[]>(`/api/domicilios/pedidos/disponibles?${params}`)
        orders.push(...response.map(mapAvailablePedidoToOrder))

        if (response.length < AVAILABLE_PAGE_SIZE) break
      }

      return enrichOrdersWithZones(onlyAssignableDeliveryOrders(uniqueOrders(orders)))
    } catch (error) {
      throw error
    }
  },
  fetchDomicilioCounters: async (date?: string): Promise<DomicilioContadores> => {
    const params = buildDomiciliosQuery(date)
    try {
      return await request<DomicilioContadores>(`/api/domicilios/contadores?${params}`)
    } catch (error) {
      if (!isNotFoundError(error)) throw error
      return {
        asignados: 0,
        enCamino: 0,
        entregados: 0,
        disponibles: 0
      }
    }
  },
  assignOrderToMe: async (pedidoId: string): Promise<{ order: Order; counters: DomicilioContadores | null }> => {
    const params = buildDomiciliosQuery()
    const response = await request<PedidoAsignado>(`/api/domicilios/pedidos/${pedidoId}/asignar?${params}`, {
      method: 'POST'
    })

    return {
      order: mapAssignedPedidoToOrder(response),
      counters: response.contadores
    }
  },
  returnOrderToAvailable: async (order: Order): Promise<{ order: Order; counters: DomicilioContadores | null }> => {
    const params = buildDomiciliosQuery()
    const pedidoId = order.pedidoId ?? order.id
    const candidates: Array<{ path: string; init: RequestInit }> = [
      {
        path: `/api/domicilios/pedidos/${pedidoId}/asignacion?${params}`,
        init: { method: 'DELETE', body: JSON.stringify({ usuarioCambio: currentUserLabel() }) }
      },
      {
        path: `/api/domicilios/pedidos/${pedidoId}/desasignar?${params}`,
        init: { method: 'POST', body: JSON.stringify({ usuarioCambio: currentUserLabel() }) }
      },
      {
        path: `/api/domicilios/pedidos/${pedidoId}/liberar?${params}`,
        init: { method: 'POST', body: JSON.stringify({ usuarioCambio: currentUserLabel() }) }
      },
      {
        path: `/domicilios/${order.id}/desasignar`,
        init: { method: 'PUT', body: JSON.stringify({ usuarioCambio: currentUserLabel() }) }
      },
      {
        path: `/domicilios/${order.id}/liberar`,
        init: { method: 'PUT', body: JSON.stringify({ usuarioCambio: currentUserLabel() }) }
      }
    ]

    let lastError: unknown
    for (const candidate of candidates) {
      try {
        const response = await request<PedidoDevuelto | PedidoDisponible | undefined>(candidate.path, candidate.init)
        const returnedOrder =
          response && 'pedido' in response && response.pedido
            ? mapAvailablePedidoToOrder(response.pedido)
            : response && 'estado' in response
              ? mapAvailablePedidoToOrder(response as PedidoDisponible)
              : orderToAvailable(order)

        return {
          order: returnedOrder,
          counters: response && 'contadores' in response ? response.contadores ?? null : null
        }
      } catch (error) {
        lastError = error
        const status = (error as { status?: number })?.status
        if (status !== 404 && status !== 405) throw error
      }
    }

    const error = new Error('El API aun no tiene una ruta activa para devolver pedidos a disponibles.')
    Object.assign(error, { cause: lastError })
    throw error
  },
  fetchOrderById: async (id: string): Promise<Order | undefined> => {
    const orders = await api.fetchOrders()
    const summary = orders.find((order) => order.id === id)
    if (!summary) return undefined

    const pedidoId = summary.pedidoId
    if (!pedidoId) return summary

    try {
      const detail = await request<any>(`/pedido/${pedidoId}/detalle`)
      const items = mapProductItems(detail)
      return items?.length ? { ...summary, items } : summary
    } catch {
      return summary
    }
  },
  fetchOrderItems: async (pedidoId: string): Promise<Order['items'] | null> => {
    const detail = await request<any>(`/pedido/${pedidoId}/detalle`)
    return mapProductItems(detail)
  },
  updateOrderStatus: async (
    id: string,
    status: Order['status'],
    options: CompleteDeliveryOptions = {}
  ): Promise<Order | undefined> => {
    if (status === 'EN_RUTA') {
      await request(`/domicilios/${id}/en-ruta`, {
        method: 'PUT',
        body: JSON.stringify({ usuarioCambio: currentUserLabel() })
      })
    }

    if (status === 'ENTREGADO') {
      const formData = new FormData()
      formData.set('usuarioCambio', currentUserLabel())
      formData.set('firmaNombre', options.signatureName || 'Recibido')
      formData.set('firmaDocumento', options.signatureDocument || '0000')
      formData.set('latitudEntrega', String(options.latitude ?? 0))
      formData.set('longitudEntrega', String(options.longitude ?? 0))
      if (options.observations) formData.set('observaciones', options.observations)
      if (options.proofFiles?.[0]) formData.set('evidenciaFoto', options.proofFiles[0])

      await request(`/domicilios/${id}/entregado`, {
        method: 'PUT',
        body: formData
      })
    }

    return api.fetchOrderById(id)
  }
}
