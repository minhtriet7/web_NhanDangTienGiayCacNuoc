import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Xóa dòng import tailwindcss đi
export default defineConfig({
  plugins: [react()],
})