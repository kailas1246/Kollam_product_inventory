import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable'],
  },
  build: {
    commonjsOptions: {
      include: [/jspdf/, /node_modules/],
    },
  },
});
