import React, { Component, ReactNode } from 'react';
import { Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ChunkErrorBoundaryProps {
  children: ReactNode;
  chunkName?: string;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
}

class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  private maxRetries = 3;
  private retryTimeout: number | null = null;

  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChunkErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error) {
    // Check if this is a chunk loading error
    if (this.isChunkLoadError(error)) {
      console.warn('Chunk loading error detected:', error.message);

      // Auto-retry chunk loading errors
      if (this.state.retryCount < this.maxRetries) {
        this.handleAutoRetry();
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private isChunkLoadError = (error: Error): boolean => {
    const chunkErrorMessages = [
      'loading chunk',
      'loading css chunk',
      'loading js chunk',
      'failed to import',
      'module not found',
      'script error',
      'network error',
    ];

    return chunkErrorMessages.some(msg =>
      error.message.toLowerCase().includes(msg)
    );
  };

  private handleAutoRetry = () => {
    this.setState(prevState => ({
      isRetrying: true,
      retryCount: prevState.retryCount + 1,
    }));

    // Wait a bit before retrying
    this.retryTimeout = window.setTimeout(() => {
      this.handleRetry();
    }, 1000 + this.state.retryCount * 500); // Exponential backoff
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      isRetrying: false,
    });
  };

  private handleForceReload = () => {
    // Clear caches and reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }

    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Force hard reload
    window.location.reload();
  };

  render() {
    const { hasError, error, isRetrying, retryCount } = this.state;
    const { chunkName } = this.props;

    if (hasError && error) {
      const isChunkError = this.isChunkLoadError(error);

      if (isRetrying) {
        return (
          <div className="flex items-center justify-center p-8">
            <Card className="w-full max-w-sm">
              <CardContent className="pt-6 text-center">
                <Download className="h-8 w-8 mx-auto mb-4 animate-bounce text-primary" />
                <div className="space-y-3">
                  <p className="font-medium">Reloading {chunkName || 'component'}...</p>
                  <Progress value={((retryCount + 1) / (this.maxRetries + 1)) * 100} />
                  <p className="text-sm text-muted-foreground">
                    Attempt {retryCount} of {this.maxRetries}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      if (isChunkError) {
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Update Required</CardTitle>
              <CardDescription>
                A new version of {chunkName || 'this feature'} is available.
                Please refresh to load the latest version.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {retryCount < this.maxRetries ? (
                <Button onClick={this.handleRetry} size="lg" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Loading Again
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Multiple retry attempts failed
                  </p>
                  <Button onClick={this.handleForceReload} size="lg" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Page
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      }

      // Generic error fallback
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-lg">Loading Error</CardTitle>
            <CardDescription>
              Failed to load {chunkName || 'this component'}. This might be due to a network issue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={this.handleRetry} size="lg" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;