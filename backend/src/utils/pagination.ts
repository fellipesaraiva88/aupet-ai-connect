/**
 * Pagination utilities for server-side data fetching
 */

import { Request } from 'express';
import { z } from 'zod';
import { logger } from './logger';

// Pagination configuration
export interface PaginationConfig {
  defaultLimit: number;
  maxLimit: number;
  defaultPage: number;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    self: string;
    first: string;
    last: string;
    next?: string;
    prev?: string;
  };
}

// Default configuration
const DEFAULT_CONFIG: PaginationConfig = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultPage: 1
};

// Validation schema for pagination parameters
const paginationSchema = z.object({
  page: z.string().transform(val => {
    const num = parseInt(val);
    return isNaN(num) || num < 1 ? 1 : num;
  }).optional().default('1'),
  limit: z.string().transform(val => {
    const num = parseInt(val);
    return isNaN(num) || num < 1 ? DEFAULT_CONFIG.defaultLimit :
           num > DEFAULT_CONFIG.maxLimit ? DEFAULT_CONFIG.maxLimit : num;
  }).optional().default(String(DEFAULT_CONFIG.defaultLimit)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  // Dynamic filters will be parsed separately
});

/**
 * Extract pagination parameters from request
 */
export function extractPaginationParams(
  req: Request,
  config: Partial<PaginationConfig> = {}
): PaginationParams {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Parse and validate base pagination params
    const validated = paginationSchema.parse(req.query);

    const page = parseInt(String(validated.page));
    const limit = parseInt(String(validated.limit));
    const offset = (page - 1) * limit;

    // Extract filters (all query params except pagination ones)
    const filters: Record<string, any> = {};
    const reservedKeys = ['page', 'limit', 'sortBy', 'sortOrder', 'search'];

    for (const [key, value] of Object.entries(req.query)) {
      if (!reservedKeys.includes(key)) {
        filters[key] = value;
      }
    }

    return {
      page,
      limit,
      offset,
      sortBy: validated.sortBy,
      sortOrder: validated.sortOrder,
      search: validated.search,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    };
  } catch (error) {
    logger.error('Failed to parse pagination params:', error);

    // Return defaults on error
    return {
      page: mergedConfig.defaultPage,
      limit: mergedConfig.defaultLimit,
      offset: 0
    };
  }
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  params: PaginationParams,
  totalCount: number
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / params.limit);
  const hasNext = params.page < totalPages;
  const hasPrevious = params.page > 1;

  return {
    page: params.page,
    limit: params.limit,
    total: totalCount,
    totalPages,
    hasNext,
    hasPrevious,
    nextPage: hasNext ? params.page + 1 : null,
    previousPage: hasPrevious ? params.page - 1 : null
  };
}

/**
 * Create pagination links
 */
export function createPaginationLinks(
  baseUrl: string,
  params: PaginationParams,
  meta: PaginationMeta
): PaginatedResponse<any>['links'] {
  const createUrl = (page: number): string => {
    const url = new URL(baseUrl);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(params.limit));

    if (params.sortBy) {
      url.searchParams.set('sortBy', params.sortBy);
      url.searchParams.set('sortOrder', params.sortOrder || 'desc');
    }

    if (params.search) {
      url.searchParams.set('search', params.search);
    }

    if (params.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  };

  const links: PaginatedResponse<any>['links'] = {
    self: createUrl(params.page),
    first: createUrl(1),
    last: createUrl(meta.totalPages || 1)
  };

  if (meta.hasNext && meta.nextPage) {
    links.next = createUrl(meta.nextPage);
  }

  if (meta.hasPrevious && meta.previousPage) {
    links.prev = createUrl(meta.previousPage);
  }

  return links;
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  totalCount: number,
  params: PaginationParams,
  baseUrl?: string
): PaginatedResponse<T> {
  const meta = createPaginationMeta(params, totalCount);

  const response: PaginatedResponse<T> = {
    data,
    meta
  };

  if (baseUrl) {
    response.links = createPaginationLinks(baseUrl, params, meta);
  }

  return response;
}

/**
 * Build SQL ORDER BY clause from pagination params
 */
export function buildOrderByClause(
  params: PaginationParams,
  allowedColumns: string[],
  columnMapping?: Record<string, string>
): string {
  if (!params.sortBy) {
    return 'created_at DESC'; // Default sorting
  }

  // Check if column is allowed
  if (!allowedColumns.includes(params.sortBy)) {
    logger.warn(`Attempt to sort by unauthorized column: ${params.sortBy}`);
    return 'created_at DESC';
  }

  // Map column name if mapping provided
  const column = columnMapping?.[params.sortBy] || params.sortBy;

  // Sanitize order direction
  const order = params.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return `${column} ${order}`;
}

/**
 * Build SQL WHERE clause from filters
 */
export function buildWhereClause(
  params: PaginationParams,
  allowedFilters: string[],
  columnMapping?: Record<string, string>
): { clause: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Add search condition if present
  if (params.search) {
    // This is a generic search - customize based on your needs
    conditions.push(`(
      LOWER(name) LIKE $${paramIndex} OR
      LOWER(description) LIKE $${paramIndex} OR
      LOWER(email) LIKE $${paramIndex}
    )`);
    values.push(`%${params.search.toLowerCase()}%`);
    paramIndex++;
  }

  // Add filter conditions
  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (!allowedFilters.includes(key)) {
        logger.warn(`Attempt to filter by unauthorized column: ${key}`);
        continue;
      }

      const column = columnMapping?.[key] || key;

      // Handle different filter types
      if (value === 'null') {
        conditions.push(`${column} IS NULL`);
      } else if (value === 'not_null') {
        conditions.push(`${column} IS NOT NULL`);
      } else if (typeof value === 'string' && value.startsWith('>=')) {
        conditions.push(`${column} >= $${paramIndex}`);
        values.push(value.substring(2));
        paramIndex++;
      } else if (typeof value === 'string' && value.startsWith('<=')) {
        conditions.push(`${column} <= $${paramIndex}`);
        values.push(value.substring(2));
        paramIndex++;
      } else if (typeof value === 'string' && value.startsWith('>')) {
        conditions.push(`${column} > $${paramIndex}`);
        values.push(value.substring(1));
        paramIndex++;
      } else if (typeof value === 'string' && value.startsWith('<')) {
        conditions.push(`${column} < $${paramIndex}`);
        values.push(value.substring(1));
        paramIndex++;
      } else if (typeof value === 'string' && value.includes(',')) {
        // Handle IN clause for comma-separated values
        const items = value.split(',').map(v => v.trim());
        const placeholders = items.map((_, i) => `$${paramIndex + i}`).join(',');
        conditions.push(`${column} IN (${placeholders})`);
        values.push(...items);
        paramIndex += items.length;
      } else {
        conditions.push(`${column} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
  }

  const clause = conditions.length > 0 ?
    `WHERE ${conditions.join(' AND ')}` : '';

  return { clause, values };
}

/**
 * Apply pagination to Supabase query
 */
export function applyPaginationToQuery(
  query: any, // Supabase query builder
  params: PaginationParams
): any {
  // Apply pagination
  query = query
    .range(params.offset, params.offset + params.limit - 1);

  // Apply sorting
  if (params.sortBy) {
    query = query.order(params.sortBy, {
      ascending: params.sortOrder === 'asc'
    });
  } else {
    // Default sorting
    query = query.order('created_at', { ascending: false });
  }

  return query;
}

/**
 * Middleware to attach pagination params to request
 */
export function paginationMiddleware(config?: Partial<PaginationConfig>) {
  return (req: Request, res: any, next: any) => {
    (req as any).pagination = extractPaginationParams(req, config);
    next();
  };
}

// Type augmentation for Express Request
declare module 'express' {
  interface Request {
    pagination?: PaginationParams;
  }
}