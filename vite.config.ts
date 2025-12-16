import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'create-nojekyll',
      closeBundle() {
        writeFileSync('dist/.nojekyll', '')
      }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large color/accessibility libraries into separate chunk
          'vendor-color': ['culori', 'apca-w3'],
          // Split Radix UI components into separate chunk
          'vendor-ui': ['@radix-ui/themes', '@radix-ui/react-icons'],
          // Split React core into separate chunk
          'vendor-react': ['react', 'react-dom', 'zustand'],
        },
      },
    },
    // Increase chunk size warning limit since we're intentionally creating larger vendor chunks
    chunkSizeWarningLimit: 600,
  },
})
