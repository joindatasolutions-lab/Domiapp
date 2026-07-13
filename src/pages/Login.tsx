import React, { useState } from 'react'
import {
  BarChart3,
  Cloud,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Package,
  ShieldCheck,
  TrendingUp,
  Truck,
  User
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function Login() {
  const nav = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await api.login(login.trim().toLowerCase(), password)
      nav('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-view">
      <section className="auth-shell">
        <aside className="auth-brand-panel" aria-label="PetalOps">
          <div className="auth-brand-lockup">
            <img src="/logo.png" alt="PetalOps" className="auth-brand-logo" />
            <div>
              <strong>PetalOps</strong>
              <span>Plataforma de Gestion Empresarial</span>
            </div>
          </div>

          <div className="auth-brand-copy">
            <span className="auth-brand-rule" aria-hidden="true" />
            <h1>
              Opera tu negocio. <strong>Crecemos contigo.</strong>
            </h1>
            <p>
              PetalOps centraliza ventas, operaciones y administracion en un solo lugar para que tu empresa sea mas
              eficiente cada dia.
            </p>
          </div>

          <div className="auth-product-preview" aria-hidden="true">
            <div className="auth-preview-rail">
              <span className="is-active">
                <BarChart3 size={15} strokeWidth={2} />
              </span>
              <span>
                <Package size={15} strokeWidth={2} />
              </span>
              <span>
                <Truck size={15} strokeWidth={2} />
              </span>
              <span>
                <CreditCard size={15} strokeWidth={2} />
              </span>
              <span>
                <User size={15} strokeWidth={2} />
              </span>
            </div>
            <div className="auth-preview-board">
              <h2>Hola, Ana</h2>
              <p>Resumen de tu negocio</p>
              <div className="auth-preview-kpis">
                <span>
                  <b>24</b>
                  <small>Pedidos hoy</small>
                </span>
                <span>
                  <b>8</b>
                  <small>Pendientes</small>
                </span>
                <span>
                  <b>12</b>
                  <small>Entrega hoy</small>
                </span>
                <span>
                  <b>156</b>
                  <small>Productos</small>
                </span>
              </div>
              <div className="auth-preview-list">
                <span>
                  <Package size={16} strokeWidth={2} />
                  <b>Pedido #1024</b>
                  <small>Nuevo pedido recibido</small>
                </span>
                <span>
                  <Truck size={16} strokeWidth={2} />
                  <b>Entrega #834</b>
                  <small>En camino</small>
                </span>
                <span>
                  <CreditCard size={16} strokeWidth={2} />
                  <b>Pago recibido</b>
                  <small>Pedido #1023</small>
                </span>
              </div>
            </div>
          </div>

          <div className="auth-benefits">
            <span>
              <ShieldCheck size={24} strokeWidth={1.8} />
              <b>Acceso seguro</b>
              <small>Tus datos siempre protegidos</small>
            </span>
            <span>
              <Cloud size={24} strokeWidth={1.8} />
              <b>En la nube</b>
              <small>Accede desde cualquier lugar</small>
            </span>
            <span>
              <TrendingUp size={24} strokeWidth={1.8} />
              <b>Escalable</b>
              <small>Crece tu negocio con PetalOps</small>
            </span>
          </div>
        </aside>

        <section className="auth-card">
          <header className="auth-hero">
            <img src="/logo.png" alt="PetalOps" className="auth-logo" />
            <h1 className="auth-title">
              Bienvenido a <span>PetalOps</span>
            </h1>
            <p className="auth-subtitle">
              Accede a tu plataforma de gestion empresarial e inicia sesion para continuar.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="usuario">Usuario o correo electronico</label>
            <div className="auth-input-field">
              <User size={22} strokeWidth={1.8} aria-hidden="true" />
              <input
                id="usuario"
                type="text"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                placeholder="Ingresa tu usuario o correo"
                autoComplete="username"
                required
              />
            </div>

            <label htmlFor="password">Contrasena</label>
            <div className="auth-password-field auth-input-field">
              <Lock size={22} strokeWidth={1.8} aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ingresa tu contrasena"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                title={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              >
                {showPassword ? <EyeOff size={20} strokeWidth={1.8} /> : <Eye size={20} strokeWidth={1.8} />}
              </button>
            </div>

            <button type="button" className="auth-forgot-link">
              Olvidaste tu contrasena?
            </button>

            {error ? <p className="auth-error">{error}</p> : null}

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Lock size={20} strokeWidth={2} aria-hidden="true" />
              {isSubmitting ? 'Ingresando...' : 'Ingresar a PetalOps'}
            </button>

            <div className="auth-divider">
              <span>o</span>
            </div>

            <button type="button" className="auth-google-btn">
              <Globe size={22} strokeWidth={1.8} aria-hidden="true" />
              Continuar con Google
            </button>

            <p className="auth-security-note">
              <ShieldCheck size={18} strokeWidth={1.8} />
              Acceso seguro y cifrado
            </p>
          </form>
        </section>
      </section>
    </main>
  )
}
