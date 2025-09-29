import React, { ComponentType, ErrorInfo } from 'react';
import ErrorBoundary from './ErrorBoundary';
import AsyncErrorBoundary from './AsyncErrorBoundary';
import ChunkErrorBoundary from './ChunkErrorBoundary';

interface ErrorBoundaryOptions {
  level?: 'page' | 'component' | 'route';
  isolate?: boolean;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableAsync?: boolean;
  enableChunk?: boolean;
  chunkName?: string;
}

interface WithErrorBoundaryProps {
  errorBoundaryOptions?: ErrorBoundaryOptions;
}

function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: ErrorBoundaryOptions = {}
) {
  const {
    level = 'component',
    isolate = false,
    fallback: FallbackComponent,
    onError,
    enableAsync = false,
    enableChunk = false,
    chunkName,
  } = options;

  const WithErrorBoundaryComponent = React.forwardRef<any, P & WithErrorBoundaryProps>(
    (props, ref) => {
      const { errorBoundaryOptions, ...wrappedProps } = props;
      const mergedOptions = { ...options, ...errorBoundaryOptions };

      const renderWithBoundaries = (children: React.ReactNode) => {
        let result = children;

        // Wrap with ChunkErrorBoundary if enabled
        if (enableChunk || mergedOptions.enableChunk) {
          result = (
            <ChunkErrorBoundary chunkName={chunkName || mergedOptions.chunkName}>
              {result}
            </ChunkErrorBoundary>
          );
        }

        // Wrap with AsyncErrorBoundary if enabled
        if (enableAsync || mergedOptions.enableAsync) {
          result = (
            <AsyncErrorBoundary>
              {result}
            </AsyncErrorBoundary>
          );
        }

        // Wrap with main ErrorBoundary
        const fallback = FallbackComponent ? (
          <FallbackComponent
            error={new Error('Component error')}
            retry={() => window.location.reload()}
          />
        ) : undefined;

        result = (
          <ErrorBoundary
            level={mergedOptions.level || level}
            isolate={mergedOptions.isolate ?? isolate}
            fallback={fallback}
            onError={mergedOptions.onError || onError}
          >
            {result}
          </ErrorBoundary>
        );

        return result;
      };

      return renderWithBoundaries(
        <WrappedComponent {...(wrappedProps as P)} ref={ref} />
      );
    }
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

// Convenience decorators
export function withPageErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: Omit<ErrorBoundaryOptions, 'level'> = {}
) {
  return withErrorBoundary(Component, { ...options, level: 'page' });
}

export function withComponentErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: Omit<ErrorBoundaryOptions, 'level' | 'isolate'> = {}
) {
  return withErrorBoundary(Component, { ...options, level: 'component', isolate: true });
}

export function withAsyncErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: Omit<ErrorBoundaryOptions, 'enableAsync'> = {}
) {
  return withErrorBoundary(Component, { ...options, enableAsync: true });
}

export function withChunkErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  chunkName?: string,
  options: Omit<ErrorBoundaryOptions, 'enableChunk' | 'chunkName'> = {}
) {
  return withErrorBoundary(Component, { ...options, enableChunk: true, chunkName });
}

export function withAllErrorBoundaries<P extends object>(
  Component: ComponentType<P>,
  chunkName?: string,
  options: ErrorBoundaryOptions = {}
) {
  return withErrorBoundary(Component, {
    ...options,
    enableAsync: true,
    enableChunk: true,
    chunkName,
  });
}

export default withErrorBoundary;