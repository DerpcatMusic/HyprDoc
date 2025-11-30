'use client'

import React, { ReactNode, useState, useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui-components';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | undefined;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: undefined
  });

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error("Uncaught error:", error, errorInfo);
    
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error reporting service (Sentry, etc.)
      console.error('Error logged to service:', { error, errorInfo });
    }
  };

  useEffect(() => {
    if (state.hasError && state.error) {
      handleError(state.error, {} as React.ErrorInfo);
    }
  }, [state.hasError, state.error]);

  if (state.hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10 p-4">
          <div className="max-w-md w-full bg-white dark:bg-black border-2 border-red-500 shadow-sharp p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded-full mb-4">
                  <AlertTriangle size={24} />
              </div>
              <h1 className="text-xl font-black uppercase mb-2">Something went wrong</h1>
              <p className="text-sm text-muted-foreground mb-4">
                  The application encountered an unexpected error.
              </p>
              {state.error && (
                  <div className="bg-muted p-2 text-[10px] font-mono text-left mb-6 overflow-x-auto border" role="alert">
                      <strong className="block mb-1">Error Details:</strong>
                      {state.error.toString()}
                      {state.error.stack && (
                          <details className="mt-2">
                              <summary className="cursor-pointer text-xs">Stack Trace</summary>
                              <pre className="mt-1 whitespace-pre-wrap text-xs">{state.error.stack}</pre>
                          </details>
                      )}
                  </div>
              )}
              <div className="flex gap-2 justify-center">
                  <Button onClick={() => window.location.reload()}>
                      <RotateCcw size={14} className="mr-2" /> Reload Application
                  </Button>
                  <Button 
                      variant="outline" 
                      onClick={() => setState({ hasError: false, error: undefined })}
                  >
                      Try Again
                  </Button>
              </div>
          </div>
      </div>
    );
  }

  return children;
};