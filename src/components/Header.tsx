import { Bell } from 'lucide-react'
import { api } from '../services/api'
import Button from './ui/Button'

export default function Header() {
  const user = api.getSession()?.user
  const name = user?.nombre || user?.login || 'Domiciliario'
  const initial = name.trim().charAt(0).toUpperCase() || 'D'

  return (
    <header className="sticky top-0 z-30 bg-app/95 px-4 pb-3 pt-4 backdrop-blur-xl dark:bg-ink/95">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.35rem] bg-primary text-2xl font-black text-white shadow-[0_0_0_10px_rgba(138,50,82,0.08)]">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xl font-black leading-tight text-ink dark:text-white sm:text-2xl">
              Hola {name}
            </div>
            <div className="mt-0.5 truncate text-xs font-semibold text-muted dark:text-white/60 sm:text-sm">
              Turno activo <span className="px-1">-</span> 08:00 AM - 06:00 PM
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs font-bold text-muted dark:text-white/60 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.14)]" />
              En linea
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Notificaciones"
          className="relative h-14 w-14 shrink-0 rounded-[1.25rem] dark:bg-white/10 dark:text-white dark:ring-white/10"
        >
          <Bell size={19} />
          <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-red-600 text-xs font-black text-white ring-4 ring-app dark:ring-ink">
            2
          </span>
        </Button>
      </div>
    </header>
  )
}
