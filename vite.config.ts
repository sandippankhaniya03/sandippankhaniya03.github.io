import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // This is a GitHub Pages user site (username.github.io), so it is served at `/`.
  base: '/',
  plugins: [react(), tailwindcss()],
})
