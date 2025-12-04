import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.CLERK_PUBLISHABLE_KEY': JSON.stringify(env.CLERK_PUBLISHABLE_KEY),
      // Polyfill process.env for other usages if necessary
      'process.env': process.env
    }
  };
});