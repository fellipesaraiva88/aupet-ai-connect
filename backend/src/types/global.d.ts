// Global type definitions and augmentations

// Express Request augmentation
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        organizationId: string;
        role: string;
      };
    }
  }
}

// Helper types for strict mode
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T>;
export type ErrorOrResult<T> = { error: Error } | { data: T };

// Type guards
export function isError(obj: unknown): obj is Error {
  return obj instanceof Error;
}

export function isDefined<T>(val: T | undefined): val is T {
  return val !== undefined;
}

export function isNotNull<T>(val: T | null): val is T {
  return val !== null;
}

// Safe array access
export function safeArrayAccess<T>(arr: T[] | undefined, index: number, defaultValue: T): T {
  if (!arr || index < 0 || index >= arr.length) {
    return defaultValue;
  }
  return arr[index] ?? defaultValue;
}

// Safe object property access
export function safeGet<T, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  defaultValue: T[K]
): T[K] {
  if (!obj) return defaultValue;
  return obj[key] ?? defaultValue;
}

export {};