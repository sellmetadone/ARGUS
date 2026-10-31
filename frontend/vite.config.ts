import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadPort(): number {
  try {
    const raw = readFileSync(join(__dirname, 'argus.config.json'), 'utf8')
    const cfg = JSON.parse(raw) as { port?: number }
    if (typeof cfg.port === 'number' && cfg.port > 0) return cfg.port
  } catch {
    /* use default */
  }
  return 3030
}

const port = loadPort()

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port,
    strictPort: false,
    open: false,
  },
  preview: {
    host: true,
    port,
    strictPort: false,
  },
})
