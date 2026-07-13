import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { useDeliveryStore } from '../store/deliveryStore'

export const useOrders = (date?: string) => {
  const setOrders = useDeliveryStore((state) => state.setOrders)

  return useQuery({
    queryKey: ['orders', date ?? 'all'],
    queryFn: async () => {
      const orders = await api.fetchOrders(date)
      setOrders(orders)
      return orders
    },
    staleTime: 0,
    refetchInterval: 1000 * 15,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  })
}

export const useAvailableOrders = (date?: string) =>
  useQuery({
    queryKey: ['available-orders', date ?? 'all'],
    queryFn: () => api.fetchAvailableOrders(date),
    staleTime: 0,
    refetchInterval: 1000 * 15,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  })

export const useDomicilioCounters = (date?: string) =>
  useQuery({
    queryKey: ['domicilio-counters', date ?? 'all'],
    queryFn: () => api.fetchDomicilioCounters(date),
    staleTime: 0,
    refetchInterval: 1000 * 15,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  })
