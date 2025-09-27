import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/index';

// ===================================================================
// AUDIT LOGGING MIDDLEWARE
// OBJETIVO: Log completo de todas as ações para compliance e segurança
// ===================================================================

interface AuditLogEntry {
  timestamp: string;
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  statusCode?: number;
  duration?: number;
  requestId: string;
  body?: any;
  query?: any;
  params?: any;
  responseSize?: number;
  error?: string;
}

export const auditLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Add request ID to request for tracing
  (req as any).requestId = requestId;

  // Capture original res.end
  const originalEnd = res.end.bind(res);
  let responseSize = 0;

  res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
    if (chunk) {
      responseSize = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
    }

    const duration = Date.now() - startTime;
    const authReq = req as AuthenticatedRequest;

    const auditEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId: authReq.user?.id,
      organizationId: authReq.user?.organizationId,
      action: determineAction(req.method, req.path),
      resource: determineResource(req.path),
      method: req.method,
      path: req.path,
      ip: getClientIp(req),
      userAgent: req.get('User-Agent') || 'Unknown',
      statusCode: res.statusCode,
      duration,
      requestId,
      responseSize
    };

    // Add request data for sensitive operations
    if (shouldLogRequestData(req)) {
      auditEntry.body = sanitizeForLogging(req.body);
      auditEntry.query = sanitizeForLogging(req.query);
      auditEntry.params = sanitizeForLogging(req.params);
    }

    // Add error information if applicable
    if (res.statusCode >= 400) {
      auditEntry.error = `HTTP ${res.statusCode}`;
    }

    // Log different levels based on operation type and status
    if (res.statusCode >= 500) {
      logger.error('Audit: Server Error', auditEntry);
    } else if (res.statusCode >= 400) {
      logger.warn('Audit: Client Error', auditEntry);
    } else if (isSensitiveOperation(req)) {
      logger.warn('Audit: Sensitive Operation', auditEntry);
    } else {
      logger.info('Audit: Request', auditEntry);
    }

    // Call original end
    return originalEnd(chunk, encoding, cb);
  } as any;

  next();
};

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIp(req: Request): string {
  return (
    req.get('CF-Connecting-IP') ||
    req.get('X-Forwarded-For')?.split(',')[0] ||
    req.get('X-Real-IP') ||
    (req as any).connection?.remoteAddress ||
    (req as any).socket?.remoteAddress ||
    'unknown'
  ).trim();
}

function determineAction(method: string, path: string): string {
  const pathLower = path.toLowerCase();

  if (pathLower.includes('/login')) return 'LOGIN_ATTEMPT';
  if (pathLower.includes('/logout')) return 'LOGOUT';
  if (pathLower.includes('/refresh')) return 'TOKEN_REFRESH';
  if (pathLower.includes('/webhook')) return 'WEBHOOK_RECEIVED';
  if (pathLower.includes('/message')) return method === 'POST' ? 'SEND_MESSAGE' : 'GET_MESSAGES';
  if (pathLower.includes('/instance')) return method === 'POST' ? 'CREATE_INSTANCE' : 'MANAGE_INSTANCE';
  if (pathLower.includes('/evolution')) return 'EVOLUTION_API_CALL';
  if (pathLower.includes('/settings')) return 'SETTINGS_CHANGE';
  if (pathLower.includes('/dashboard')) return 'DASHBOARD_ACCESS';

  return `${method}_${path.split('/')[2] || 'UNKNOWN'}`.toUpperCase();
}

function determineResource(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 2) {
    return segments[1] || 'unknown'; // /api/[resource]
  }
  return 'unknown';
}

function shouldLogRequestData(req: Request): boolean {
  const sensitiveOperations = [
    '/api/auth/',
    '/api/settings/',
    '/api/evolution/',
    '/api/webhook/'
  ];

  return sensitiveOperations.some(op => req.path.startsWith(op));
}

function isSensitiveOperation(req: Request): boolean {
  const sensitivePaths = [
    '/api/auth/',
    '/api/settings/',
    '/api/evolution/instance',
    '/api/webhook/'
  ];

  const sensitiveActions = ['POST', 'PUT', 'DELETE'];

  return sensitivePaths.some(path => req.path.startsWith(path)) ||
         (sensitiveActions.includes(req.method) && !req.path.includes('/health'));
}

function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password', 'token', 'key', 'secret', 'auth', 'authorization',
    'jwt', 'bearer', 'apikey', 'api_key', 'refreshToken', 'accessToken'
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Also check nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    }
  }

  return sanitized;
}

// ===================================================================
// SECURITY EVENT LOGGER
// ===================================================================

export const logSecurityEvent = (
  event: string,
  details: any,
  req?: Request,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    details: sanitizeForLogging(details),
    ip: req ? getClientIp(req) : undefined,
    userAgent: req?.get('User-Agent'),
    requestId: (req as any)?.requestId
  };

  if (severity === 'critical') {
    logger.error('SECURITY ALERT', securityLog);
  } else if (severity === 'high') {
    logger.error('Security Event', securityLog);
  } else if (severity === 'medium') {
    logger.warn('Security Event', securityLog);
  } else {
    logger.info('Security Event', securityLog);
  }
};