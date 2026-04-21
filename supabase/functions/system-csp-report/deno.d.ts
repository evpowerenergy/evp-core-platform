/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
  
  function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

