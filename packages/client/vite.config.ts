import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 8085,
    allowedHosts: ['caderno.app', 'localhost', '127.0.0.1', 'caderno.jezzlucena.com', 'caderno.jezzlucena.xyz'],
    proxy: {
      '/api': {
        target: 'http://server:5055',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
