import { AlertCircle, Home, MapPinned, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../lib/utils'

const items = [
  { to: '/', label: 'Pedidos', icon: Home, end: true },
  { to: '/ruta', label: 'Ruta', icon: MapPinned },
  { to: '/novedades', label: 'Novedades', icon: AlertCircle },
  { to: '/perfil', label: 'Perfil', icon: User }
]

export default function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/96 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-nav backdrop-blur-xl dark:border-white/10 dark:bg-ink/95">
      <div className="mx-auto grid max-w-4xl grid-cols-4 gap-2">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex h-16 flex-col items-center justify-center gap-1 rounded-[1.35rem] text-sm font-semibold text-muted transition active:scale-[0.98] dark:text-white/60',
                  isActive && 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white'
                )
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
