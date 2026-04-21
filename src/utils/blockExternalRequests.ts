
const isExternalUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    return parsedUrl.origin !== window.location.origin;
  } catch (e) {
    return false;
  }
};

export const initializeRequestBlocking = () => {
  // Block external requests for fetch
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      let url: string;

      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else {
        url = input.url;
      }

      if (isExternalUrl(url)) {
        console.warn(`[Fetch] Blocked external request to: ${url}`);
        return Promise.reject(new Error('External fetch requests are not allowed'));
      }

      return originalFetch(input, init);
    };
  }

  // Block external EventSource connections
  if (typeof window !== 'undefined') {
    const originalEventSource = window.EventSource;
    
    window.EventSource = class extends EventSource {
      constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
        if (typeof url === 'string' && isExternalUrl(url)) {
          console.warn(`[EventSource] Blocked external request to: ${url}`);
          throw new Error('External EventSource connections are not allowed');
        }
        super(url, eventSourceInitDict);
      }
    };
  }

  // Block external requests for WebSocket
  if (typeof WebSocket !== 'undefined') {
    const OriginalWebSocket = WebSocket;

    // @ts-ignore
    window.WebSocket = class extends OriginalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        if (typeof url === 'string' && isExternalUrl(url)) {
          console.warn(`[WebSocket] Blocked external request to: ${url}`);
          throw new Error('External WebSocket connections are not allowed');
        }
        super(url, protocols);
      }
    } as typeof WebSocket;
  }
};

export const monitorBlockedRequests = () => {
  // Monitor and log blocked requests
  
};
