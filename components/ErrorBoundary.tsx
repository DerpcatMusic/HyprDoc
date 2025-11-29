import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui-components';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
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
                {this.state.error && (
                    <div className="bg-muted p-2 text-[10px] font-mono text-left mb-6 overflow-x-auto border">
                        {this.state.error.toString()}
                    </div>
                )}
                <Button onClick={() => window.location.reload()}>
                    <RotateCcw size={14} className="mr-2" /> Reload Application
                </Button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}