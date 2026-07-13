import { create } from 'zustand'
import { Order, OrderStatus } from '../types'

interface DeliveryState {
  orders: Order[]
  activeOrder?: Order | null
  setOrders: (orders: Order[]) => void
  setActiveOrder: (order?: Order | null) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
}

const deliveredTime = () =>
  new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  })

export const useDeliveryStore = create<DeliveryState>((set) => ({
  orders: [],
  activeOrder: null,
  setOrders: (orders) => set({ orders }),
  setActiveOrder: (order) => set({ activeOrder: order }),
  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id
          ? {
              ...order,
              status,
              deliveredAt: status === 'ENTREGADO' ? deliveredTime() : order.deliveredAt,
              etaMinutes: status === 'ENTREGADO' ? 0 : order.etaMinutes,
              distanceKm: status === 'ENTREGADO' ? 0 : order.distanceKm
            }
          : order
      ),
      activeOrder:
        state.activeOrder?.id === id
          ? {
              ...state.activeOrder,
              status,
              deliveredAt: status === 'ENTREGADO' ? deliveredTime() : state.activeOrder.deliveredAt,
              etaMinutes: status === 'ENTREGADO' ? 0 : state.activeOrder.etaMinutes,
              distanceKm: status === 'ENTREGADO' ? 0 : state.activeOrder.distanceKm
            }
          : state.activeOrder
    }))
}))
