import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isOnline: boolean;
}

class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isOnline: navigator.onLine,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.setState({ isOnline: true });
    // Auto-retry when back online
    if (this.state.hasError) {
      setTimeout(() => {
        this.handleRetry();
      }, 1000);
    }
  };

  private handleOffline = () => {
    this.setState({ isOnline: false });
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    this.props.onRetry?.();
  };

  private isNetworkError = (error: Error): boolean => {
    const networkErrorMessages = [
      'network error',
      'failed to fetch',
      'connection error',
      'timeout',
      'abort',
      'cors',
    ];

    return networkErrorMessages.some(msg =>
      error.message.toLowerCase().includes(msg)
    );
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const isNetworkError = error && this.isNetworkError(error);

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
              {isNetworkError || !this.state.isOnline ? (
                <WifiOff className="h-6 w-6 text-destructive" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-destructive" />
              )}
            </div>
            <CardTitle className="text-lg">
              {isNetworkError || !this.state.isOnline ? 'Connection Problem' : 'Something went wrong'}
            </CardTitle>
            <CardDescription>
              {isNetworkError || !this.state.isOnline
                ? 'Unable to connect to our servers. Please check your internet connection.'
                : 'An error occurred while loading this content. Please try again.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
              {this.state.isOnline ? (
                <><Wifi className="h-4 w-4" /> Connected</>
              ) : (
                <><WifiOff className="h-4 w-4" /> Offline</>
              )}
            </div>
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

export default AsyncErrorBoundary;