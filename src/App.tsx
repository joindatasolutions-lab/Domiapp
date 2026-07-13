import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './routes/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PedidoDetalle from './pages/PedidoDetalle'
import Navegacion from './pages/Navegacion'
import RutaSugerida from './pages/RutaSugerida'
import Historial from './pages/Historial'
import Novedades from './pages/Novedades'
import Perfil from './pages/Perfil'
import { api } from './services/api'

function ProtectedLayout() {
  return api.hasAuth() ? <Layout /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="pedido/:id" element={<PedidoDetalle />} />
        <Route path="ruta" element={<RutaSugerida />} />
        <Route path="navegacion/:id" element={<Navegacion />} />
        <Route path="historial" element={<Historial />} />
        <Route path="novedades" element={<Novedades />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
