/**
 * Utility functions for handling DOM manipulation errors
 * This helps prevent the "removeChild" and other DOM errors that cause white screens
 */

interface DOMErrorInfo {
  error: Error;
  componentName?: string;
  operation?: string;
  timestamp: number;
}

class DOMErrorHandler {
  private static errors: DOMErrorInfo[] = [];
  private static maxErrors = 10;

  /**
   * Safely execute DOM operations with error handling
   */
  static safeExecute<T>(
    operation: () => T,
    fallback: T,
    componentName?: string,
    operationName?: string
  ): T {
    try {
      return operation();
    } catch (error) {
      if (error instanceof Error) {
        this.logError(error, componentName, operationName);
      }
      return fallback;
    }
  }

  /**
   * Safely remove a DOM node
   */
  static safeRemoveNode(node: Node | null, parent?: Node): boolean {
    if (!node) return false;

    try {
      // Check if node is actually a child of the parent
      if (parent && !parent.contains(node)) {
        console.warn('🔧 Attempting to remove node that is not a child of parent');
        return false;
      }

      // Check if node is still in the DOM
      if (!document.contains(node)) {
        console.warn('🔧 Attempting to remove node that is not in the DOM');
        return false;
      }

      if (parent) {
        parent.removeChild(node);
      } else {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
      }
      return true;
    } catch (error) {
      if (error instanceof Error) {
        this.logError(error, 'DOM', 'removeNode');
      }
      return false;
    }
  }

  /**
   * Safely add a DOM node
   */
  static safeAddNode(parent: Node, child: Node): boolean {
    try {
      // Check if parent is still in the DOM
      if (!document.contains(parent)) {
        console.warn('🔧 Attempting to add node to parent that is not in the DOM');
        return false;
      }

      // Check if child is already a child of parent
      if (parent.contains(child)) {
        console.warn('🔧 Attempting to add node that is already a child');
        return false;
      }

      parent.appendChild(child);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        this.logError(error, 'DOM', 'addNode');
      }
      return false;
    }
  }

  /**
   * Log DOM errors for debugging
   */
  private static logError(error: Error, componentName?: string, operation?: string): void {
    const errorInfo: DOMErrorInfo = {
      error,
      componentName,
      operation,
      timestamp: Date.now()
    };

    // Add to errors array
    this.errors.push(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console with context
    console.group('🚨 DOM Error Detected');
    console.error('Error:', error.message);
    console.error('Component:', componentName || 'Unknown');
    console.error('Operation:', operation || 'Unknown');
    console.error('Stack:', error.stack);
    console.error('Timestamp:', new Date(errorInfo.timestamp).toISOString());
    console.groupEnd();

    // Log to console.error for better visibility
    console.error(`🚨 DOM Error in ${componentName || 'Unknown'}:`, {
      message: error.message,
      operation,
      timestamp: errorInfo.timestamp,
      stack: error.stack
    });
  }

  /**
   * Get all logged errors
   */
  static getErrors(): DOMErrorInfo[] {
    return [...this.errors];
  }

  /**
   * Clear all logged errors
   */
  static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Check if there are any recent DOM errors
   */
  static hasRecentErrors(withinMinutes: number = 5): boolean {
    const cutoff = Date.now() - (withinMinutes * 60 * 1000);
    return this.errors.some(error => error.timestamp > cutoff);
  }

  /**
   * Get error summary for debugging
   */
  static getErrorSummary(): string {
    if (this.errors.length === 0) {
      return 'No DOM errors detected';
    }

    const recentErrors = this.errors.filter(
      error => Date.now() - error.timestamp < 5 * 60 * 1000
    );

    return `Found ${this.errors.length} total DOM errors, ${recentErrors.length} in last 5 minutes`;
  }
}

/**
 * React hook for safe DOM operations
 */
export const useSafeDOM = (componentName: string) => {
  const safeExecute = <T>(
    operation: () => T,
    fallback: T,
    operationName?: string
  ): T => {
    return DOMErrorHandler.safeExecute(operation, fallback, componentName, operationName);
  };

  const safeRemoveNode = (node: Node | null, parent?: Node): boolean => {
    return DOMErrorHandler.safeRemoveNode(node, parent);
  };

  const safeAddNode = (parent: Node, child: Node): boolean => {
    return DOMErrorHandler.safeAddNode(parent, child);
  };

  return {
    safeExecute,
    safeRemoveNode,
    safeAddNode
  };
};

/**
 * Global error handler for unhandled DOM errors
 */
export const initializeDOMErrorHandling = (): void => {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && 
        (event.reason.message.includes('removeChild') || 
         event.reason.message.includes('Failed to execute'))) {
      console.error('🚨 Unhandled DOM Error Promise Rejection:', event.reason);
      event.preventDefault();
    }
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && 
        (event.error.message.includes('removeChild') || 
         event.error.message.includes('Failed to execute'))) {
      console.error('🚨 Global DOM Error:', event.error);
      const handler = new DOMErrorHandler();
      (handler as any).logError(event.error, 'Global', 'unhandled');
    }
  });


};

export default DOMErrorHandler;
