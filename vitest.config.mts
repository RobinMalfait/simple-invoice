import path from 'path'
import { defineConfig } from 'vitest/config'

console.log(path.resolve(__dirname, 'src'))
export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },
})
