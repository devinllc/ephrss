import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
    preprocessorOptions: {
      // Force CSS processing
      scss: {}
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://ephrssbackend.vercel.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Log the actual URL being requested
            console.log('Proxying request to:', req.method, req.url, '->', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received response from:', req.url, '->', proxyRes.statusCode);
          });
        }
      }
    },
    cors: true
  },
  build: {
    // Force CSS extraction
    cssCodeSplit: false,
    cssMinify: true
  }
})
