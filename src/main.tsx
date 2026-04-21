import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDOMErrorHandling } from './utils/domErrorHandler';

// Initialize DOM error handling
initializeDOMErrorHandling();

// เพิ่ม network optimization
if (typeof window !== 'undefined') {
  // เพิ่ม performance monitoring
  if ('performance' in window) {
    // Track API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Log slow requests
        if (duration > 5000) {
          console.warn(`🐌 Slow API request: ${args[0]} took ${duration.toFixed(2)}ms`);
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.error(`❌ API request failed: ${args[0]} after ${duration.toFixed(2)}ms`, error);
        throw error;
      }
    };
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

