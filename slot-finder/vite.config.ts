import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load all environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Log the environment variables for debugging
  console.log('Vite environment variables:', env);
  
  return {
    plugins: [react()],
    define: {
      // Expose all VITE_* environment variables to the client
      'import.meta.env': JSON.stringify(env)
    },
    build: {
      rollupOptions: {
        input: {
          sidepanel: resolve(__dirname, 'sidepanel.html'),
          options: resolve(__dirname, 'options.html'),
          popup: resolve(__dirname, 'popup.html'),
          background: resolve(__dirname, 'src/background.ts')
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]'
        }
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react']
    },
    server: {
      // This helps with HMR in some cases
      hmr: true
    }
  };
});