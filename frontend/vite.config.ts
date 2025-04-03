import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import fs from 'fs';

const caPath = `C:/Users/Administrator/AppData/Local/mkcert/rootCA.pem`;
const caCert = fs.readFileSync(caPath);

export default defineConfig(({ mode }) => ({
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '192.168.131.181-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '192.168.131.181.pem')),
      ca: caCert
    },
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      clientPort: 5173,
      overlay: true
    },
    cors: true,
    proxy: {
      '/api': {
        target: 'https://192.168.131.181:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
            res.writeHead(500, {
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
              error: 'Proxy error occurred'
            }));
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = 'https://192.168.131.181:5173';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'prompt', 
      includeAssets: ['favicon.ico'],
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'Your App Name',
        short_name: 'App',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));