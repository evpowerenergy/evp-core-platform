import { supabase } from "@/integrations/supabase/client";

class KeepAliveService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 2 * 60 * 1000; // 2 minutes - ลดลงจาก 5 นาที

  start() {
    if (this.intervalId) {
      this.stop();
    }

  
    
    // Initial ping
    this.ping();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.PING_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
  
    }
  }

  private async ping() {
    try {
      const startTime = performance.now();
      
      // Simple ping query - just check connection
      const { data, error } = await supabase
        .from('leads')
        .select('id')
        .limit(1)
        .single();
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      

      
      // Log if response is unusually slow (possible cold start)
      if (responseTime > 2000) {
        console.warn(`🐌 Slow keep-alive response: ${responseTime.toFixed(2)}ms (possible cold start)`);
      }
    } catch (error) {
      console.error('❌ Keep-alive ping failed:', error);
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

export const keepAliveService = new KeepAliveService();

// Remove auto-start functionality to prevent interference with logout
// The service should only be started/stopped explicitly by the App component
