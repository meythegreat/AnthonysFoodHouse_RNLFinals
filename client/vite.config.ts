import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

function reactCompilerPreset(options: Record<string, unknown> = {}) {
  return {
    preset: () => ({ plugins: [['babel-plugin-react-compiler', options]] }),
    rolldown: {
      filter: {
        code:
          options.compilationMode === 'annotation'
            ? /['"]use memo['"]/
            : /\b[A-Z]|\buse/,
      },
      applyToEnvironmentHook: (env: { config: { consumer: string } }) =>
        env.config.consumer === 'client',
      optimizeDeps: {
        include:
          options.target === '17' || options.target === '18'
            ? ['react-compiler-runtime']
            : ['react/compiler-runtime'],
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/sanctum': 'http://localhost:8000',
    },
  },
})
