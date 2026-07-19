import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET === 'local' ? 'local' : 'production'
  const proxyTarget = env.VITE_API_PROXY_TARGET ||
    (apiTarget === 'local'
      ? env.VITE_API_LOCAL_PROXY_TARGET || 'http://127.0.0.1:8000'
      : env.VITE_API_PRODUCTION_PROXY_TARGET || 'https://domicilios-708265049038.us-central1.run.app')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  }
})
