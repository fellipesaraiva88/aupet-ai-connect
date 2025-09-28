import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from 'rollup-plugin-visualizer';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),

    // Bundle analyzer (apenas em build com flag)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações de build
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    cssCodeSplit: true,

    // Configurações de cache e hash
    rollupOptions: {
      output: {
        // Separar chunks para melhor cache
        manualChunks: {
          // Vendor chunks para bibliotecas que mudam menos
          vendor: [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ],
          utils: [
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
            'date-fns',
            'zod'
          ]
        },
        // Nomes de arquivo com hash para cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      },
      // Otimizações de bundling
      external: [],
    },

    // Configurações de compressão
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
      },
      mangle: true,
      format: {
        comments: false,
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets menores que 4KB como data URLs
  },

  // Otimizações de desenvolvimento
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ],
    exclude: ['@vitejs/plugin-react-swc']
  },

  // Configurações de CSS
  css: {
    devSourcemap: false,
    postcss: {
      plugins: []
    }
  },

  // Configurações de preview
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  }
}));
