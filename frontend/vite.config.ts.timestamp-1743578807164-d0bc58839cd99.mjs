// vite.config.ts
import { defineConfig } from "file:///C:/Users/Administrator/Downloads/almost%20perfect/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Administrator/Downloads/almost%20perfect/frontend/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/Administrator/Downloads/almost%20perfect/frontend/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/Users/Administrator/Downloads/almost%20perfect/frontend/node_modules/vite-plugin-pwa/dist/index.js";
import fs from "fs";
var __vite_injected_original_dirname = "C:\\Users\\Administrator\\Downloads\\almost perfect\\frontend";
var caPath = `C:/Users/Administrator/AppData/Local/mkcert/rootCA.pem`;
var caCert = fs.readFileSync(caPath);
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__vite_injected_original_dirname, "192.168.131.181-key.pem")),
      cert: fs.readFileSync(path.resolve(__vite_injected_original_dirname, "192.168.131.181.pem")),
      ca: caCert
    },
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      protocol: "ws",
      host: "localhost",
      clientPort: 5173,
      overlay: true
    },
    cors: true,
    proxy: {
      "/api": {
        target: "https://192.168.131.181:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.error("Proxy error:", err);
            res.writeHead(500, {
              "Content-Type": "application/json"
            });
            res.end(JSON.stringify({
              error: "Proxy error occurred"
            }));
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            proxyRes.headers["Access-Control-Allow-Origin"] = "https://192.168.131.181:5173";
            proxyRes.headers["Access-Control-Allow-Credentials"] = "true";
            proxyRes.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
            proxyRes.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico"],
      devOptions: {
        enabled: false
      },
      manifest: {
        name: "Your App Name",
        short_name: "App",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBZG1pbmlzdHJhdG9yXFxcXERvd25sb2Fkc1xcXFxhbG1vc3QgcGVyZmVjdFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQWRtaW5pc3RyYXRvclxcXFxEb3dubG9hZHNcXFxcYWxtb3N0IHBlcmZlY3RcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0FkbWluaXN0cmF0b3IvRG93bmxvYWRzL2FsbW9zdCUyMHBlcmZlY3QvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG5jb25zdCBjYVBhdGggPSBgQzovVXNlcnMvQWRtaW5pc3RyYXRvci9BcHBEYXRhL0xvY2FsL21rY2VydC9yb290Q0EucGVtYDtcbmNvbnN0IGNhQ2VydCA9IGZzLnJlYWRGaWxlU3luYyhjYVBhdGgpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBodHRwczoge1xuICAgICAga2V5OiBmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJzE5Mi4xNjguMTMxLjE4MS1rZXkucGVtJykpLFxuICAgICAgY2VydDogZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcxOTIuMTY4LjEzMS4xODEucGVtJykpLFxuICAgICAgY2E6IGNhQ2VydFxuICAgIH0sXG4gICAgaG9zdDogXCIwLjAuMC4wXCIsXG4gICAgcG9ydDogNTE3MyxcbiAgICBobXI6IHtcbiAgICAgIHByb3RvY29sOiAnd3MnLFxuICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICBjbGllbnRQb3J0OiA1MTczLFxuICAgICAgb3ZlcmxheTogdHJ1ZVxuICAgIH0sXG4gICAgY29yczogdHJ1ZSxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vMTkyLjE2OC4xMzEuMTgxOjUwMDAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHdzOiB0cnVlLFxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgb3B0aW9ucykgPT4ge1xuICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdQcm94eSBlcnJvcjonLCBlcnIpO1xuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHtcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgZXJyb3I6ICdQcm94eSBlcnJvciBvY2N1cnJlZCdcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBwcm94eS5vbigncHJveHlSZXMnLCAocHJveHlSZXMsIHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICBwcm94eVJlcy5oZWFkZXJzWydBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nXSA9ICdodHRwczovLzE5Mi4xNjguMTMxLjE4MTo1MTczJztcbiAgICAgICAgICAgIHByb3h5UmVzLmhlYWRlcnNbJ0FjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJ10gPSAndHJ1ZSc7XG4gICAgICAgICAgICBwcm94eVJlcy5oZWFkZXJzWydBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJ10gPSAnR0VULCBQT1NULCBQVVQsIERFTEVURSwgT1BUSU9OUyc7XG4gICAgICAgICAgICBwcm94eVJlcy5oZWFkZXJzWydBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJ10gPSAnQ29udGVudC1UeXBlLCBBdXRob3JpemF0aW9uJztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJiBjb21wb25lbnRUYWdnZXIoKSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ3Byb21wdCcsIFxuICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbyddLFxuICAgICAgZGV2T3B0aW9uczoge1xuICAgICAgICBlbmFibGVkOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgIG5hbWU6ICdZb3VyIEFwcCBOYW1lJyxcbiAgICAgICAgc2hvcnRfbmFtZTogJ0FwcCcsXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxuICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjZmZmZmZmJyxcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjMDAwMDAwJyxcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICcvcHdhLTE5MngxOTIucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJy9wd2EtNTEyeDUxMi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIH0pXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG59KSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF3VyxTQUFTLG9CQUFvQjtBQUNyWSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsZUFBZTtBQUN4QixPQUFPLFFBQVE7QUFMZixJQUFNLG1DQUFtQztBQU96QyxJQUFNLFNBQVM7QUFDZixJQUFNLFNBQVMsR0FBRyxhQUFhLE1BQU07QUFFckMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxLQUFLLEdBQUcsYUFBYSxLQUFLLFFBQVEsa0NBQVcseUJBQXlCLENBQUM7QUFBQSxNQUN2RSxNQUFNLEdBQUcsYUFBYSxLQUFLLFFBQVEsa0NBQVcscUJBQXFCLENBQUM7QUFBQSxNQUNwRSxJQUFJO0FBQUEsSUFDTjtBQUFBLElBQ0EsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsVUFBVTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1osU0FBUztBQUFBLElBQ1g7QUFBQSxJQUNBLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLElBQUk7QUFBQSxRQUNKLFdBQVcsQ0FBQyxPQUFPLFlBQVk7QUFDN0IsZ0JBQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxLQUFLLFFBQVE7QUFDbkMsb0JBQVEsTUFBTSxnQkFBZ0IsR0FBRztBQUNqQyxnQkFBSSxVQUFVLEtBQUs7QUFBQSxjQUNqQixnQkFBZ0I7QUFBQSxZQUNsQixDQUFDO0FBQ0QsZ0JBQUksSUFBSSxLQUFLLFVBQVU7QUFBQSxjQUNyQixPQUFPO0FBQUEsWUFDVCxDQUFDLENBQUM7QUFBQSxVQUNKLENBQUM7QUFDRCxnQkFBTSxHQUFHLFlBQVksQ0FBQyxVQUFVLEtBQUssUUFBUTtBQUMzQyxxQkFBUyxRQUFRLDZCQUE2QixJQUFJO0FBQ2xELHFCQUFTLFFBQVEsa0NBQWtDLElBQUk7QUFDdkQscUJBQVMsUUFBUSw4QkFBOEIsSUFBSTtBQUNuRCxxQkFBUyxRQUFRLDhCQUE4QixJQUFJO0FBQUEsVUFDckQsQ0FBQztBQUFBLFFBQ0g7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQWlCLGdCQUFnQjtBQUFBLElBQzFDLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLGVBQWUsQ0FBQyxhQUFhO0FBQUEsTUFDN0IsWUFBWTtBQUFBLFFBQ1YsU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLFdBQVc7QUFBQSxRQUNYLFNBQVM7QUFBQSxRQUNULGtCQUFrQjtBQUFBLFFBQ2xCLGFBQWE7QUFBQSxRQUNiLE9BQU87QUFBQSxVQUNMO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNILEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
