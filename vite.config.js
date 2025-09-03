import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change "steering-experiment" to your repo name exactly
export default defineConfig({
  plugins: [react()],
  base: '/steering-experiment/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
