
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from 'rollup-plugin-visualizer';
import { apiPlugin } from './vite-plugin-api';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      // API endpoint handler for development
      apiPlugin(env),
      // Bundle analyzer - สร้างไฟล์ stats.html หลัง build
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME || 'EV Power Energy CRM'),
    },
    // Production optimizations
    build: {
      target: 'es2015',
      minify: 'esbuild',
      chunkSizeWarningLimit: 500, // ลดจาก 1000 เป็น 500
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React
            'react-vendor': ['react', 'react-dom'],
            'react-router': ['react-router-dom'],
            
            // State Management
            'query': ['@tanstack/react-query'],
            'supabase': ['@supabase/supabase-js'],
            
            // UI Components - แยกเป็น chunks เล็กๆ
            'radix-ui': [
              '@radix-ui/react-dialog', 
              '@radix-ui/react-dropdown-menu', 
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-label',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-switch',
              '@radix-ui/react-toggle',
              '@radix-ui/react-tooltip'
            ],
            
            // Charts - แยก ECharts และ Recharts
            'echarts': ['echarts', 'echarts-for-react'],
            'recharts': ['recharts'],
            'victory': ['victory'],
            
            // Icons และ Utils
            'icons': ['lucide-react'],
            'utils': ['date-fns', 'clsx', 'class-variance-authority', 'tailwind-merge', 'zod'],
            
            // Forms
            'forms': ['react-hook-form', '@hookform/resolvers'],
            
            // Other libraries
            'date-picker': ['react-day-picker'],
            'carousel': ['embla-carousel-react'],
            'panels': ['react-resizable-panels'],
            'otp': ['input-otp'],
            'cmdk': ['cmdk'],
            'vaul': ['vaul'],
            'sonner': ['sonner'],
            'themes': ['next-themes']
          },
        },
      },
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        '@supabase/supabase-js',
        'lucide-react',
        'recharts',
        'date-fns',
      ],
    },
  };
});
