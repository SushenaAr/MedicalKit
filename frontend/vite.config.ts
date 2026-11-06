import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Запросы /api уходят на backend (FastAPI). Для браузера это один адрес с frontend,
    // поэтому httpOnly-cookie с refresh-токеном работает без настроек CORS
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
