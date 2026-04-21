// Deno type declarations for TypeScript IDE support
// These types are built-in on Supabase Edge Functions runtime

declare namespace Deno {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;

  export namespace env {
    export function get(key: string): string | undefined;
  }
}

// Web APIs are available in Deno
declare var Request: typeof globalThis.Request;
declare var Response: typeof globalThis.Response;
declare var URL: typeof globalThis.URL;
declare var console: typeof globalThis.console;
declare var performance: typeof globalThis.performance;

