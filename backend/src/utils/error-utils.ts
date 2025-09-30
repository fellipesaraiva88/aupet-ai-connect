/**
 * Utility functions for handling errors in TypeScript strict mode
 */

import { logger } from './logger';

/**
 * Type guard to check if a value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if a value has a message property
 */
export function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as any).message === 'string'
  );
}

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }

  if (hasMessage(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * Safely extract error stack from unknown error type
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isError(error)) {
    return error.stack;
  }

  return undefined;
}

/**
 * Log error with appropriate context
 */
export function logError(context: string, error: unknown): void {
  const message = getErrorMessage(error);
  const stack = getErrorStack(error);

  logger.error(`${context}: ${message}`, {
    error: error,
    stack: stack
  });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown, statusCode: number = 500) {
  return {
    success: false,
    error: getErrorMessage(error),
    statusCode
  };
}

/**
 * Wrap async functions to handle errors
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError('Async handler error', error);
      throw error;
    }
  }) as T;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T = any>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    logError('JSON parse error', error);
    return fallback;
  }
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string = 'Value is not defined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Get a value with a default if undefined
 */
export function getOrDefault<T>(value: T | undefined, defaultValue: T): T {
  return value !== undefined ? value : defaultValue;
}

/**
 * Get a value with null if undefined
 */
export function getOrNull<T>(value: T | undefined): T | null {
  return value !== undefined ? value : null;
}