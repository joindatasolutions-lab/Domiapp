import { Outlet, useLocation } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import Header from '../components/Header'

export default function Layout() {
  const location = useLocation()
  const isMap = location.pathname.startsWith('/navegacion')
  const isOrders = location.pathname === '/'
  const isOrderDetail = location.pathname.startsWith('/pedido/')

  return (
    <div className="min-h-screen bg-app text-ink">
      {!isMap && !isOrders && !isOrderDetail && <Header />}
      <main className={isMap ? 'min-h-screen pb-32' : isOrderDetail ? 'px-0 pb-0 pt-0 sm:px-4 sm:py-4' : 'px-4 pb-36 pt-4'}>
        <Outlet />
      </main>
      {!isOrderDetail && <BottomNavigation />}
    </div>
  )
}
