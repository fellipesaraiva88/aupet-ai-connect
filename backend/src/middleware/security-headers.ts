import { Request, Response, NextFunction } from 'express';
import { envValidator } from '../config/env-validator';

// ===================================================================
// SECURITY HEADERS MIDDLEWARE
// OBJETIVO: Headers de segurança robustos para proteção completa
// ===================================================================

export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  const isProduction = envValidator.isProduction();
  const frontendUrl = envValidator.get('FRONTEND_URL');

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.supabase.co https://*.supabase.co wss://*.supabase.co",
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  // Apply security headers
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  if (isProduction) {
    // HSTS (only in production)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // Expect-CT (Certificate Transparency)
    res.setHeader('Expect-CT', 'max-age=86400, enforce');
  }

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'Auzap-Server');

  // Cache control for sensitive endpoints
  if (req.path.includes('/api/auth') || req.path.includes('/api/user')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

// ===================================================================
// CORS CONFIGURATION
// ===================================================================
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // In development, allow all localhost origins and Lovable
    if (process.env.NODE_ENV === 'development') {
      if (!origin ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.includes('lovableproject.com')) {
        return callback(null, true);
      }
    }

    const frontendUrl = envValidator.get('FRONTEND_URL');
    const allowedOrigins = [
      frontendUrl,
      // Local development
      'http://localhost:8083',
      'http://localhost:8082',
      'http://localhost:8081',
      'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5173',
      // Production Render URLs - Frontend
      'https://auzap-frontend-final.onrender.com',
      'https://auzap-frontend-v3.onrender.com',
      'https://auzap-frontend-v2.onrender.com',
      'https://auzap-frontend.onrender.com',
      'https://test-experimental-fix.onrender.com',
      'https://test-visual-indicators.onrender.com',
      'https://test-render-cache.onrender.com',
      'https://test-signup-form.onrender.com',
      // Production Render URLs - Backend
      'https://auzap-backend.onrender.com',
      'https://aupet-ai-connect.onrender.com',
      'https://darkzone-md-oxcx.onrender.com'
    ];

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-api-key',
    'x-organization-id'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ]
};