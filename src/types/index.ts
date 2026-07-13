export type OrderStatus = 'SIN_ASIGNAR' | 'ASIGNADO' | 'PENDIENTE' | 'EN_RUTA' | 'ENTREGADO' | 'RETRASADO'
export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia'

export interface OrderItem {
  id: string
  name: string
  qty: number
  image?: string
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface Order {
  id: string
  pedidoId?: string
  number: string
  customer: string
  address: string
  neighborhood?: string
  zone?: string
  time: string
  value: number
  earnings: number
  phone: string
  status: OrderStatus
  priority?: string
  items: OrderItem[]
  paymentMethod: PaymentMethod
  currentLocation: Coordinates
  customerLocation: Coordinates
  etaMinutes: number
  distanceKm: number
  notes?: string
  deliveredAt?: string
  assignedAt?: string
  courierId?: string
}
