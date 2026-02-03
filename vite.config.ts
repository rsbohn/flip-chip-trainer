import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/flip-chip-trainer/',
  plugins: [react()],
});
