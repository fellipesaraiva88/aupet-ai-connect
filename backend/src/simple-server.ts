import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 10000;

// Debug environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('EVOLUTION_API_URL:', process.env.EVOLUTION_API_URL ? 'SET' : 'NOT SET');
console.log('EVOLUTION_API_KEY:', process.env.EVOLUTION_API_KEY ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('=== END DEBUG ===');

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auzap Backend is healthy! 💝',
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV,
      port: process.env.PORT,
      supabase_configured: !!process.env.SUPABASE_URL,
      evolution_configured: !!process.env.EVOLUTION_API_URL,
      jwt_configured: !!process.env.JWT_SECRET
    }
  });
});

// Basic auth middleware
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de autorização necessário',
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = { id: decoded.sub, organizationId: decoded.organization_id };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido',
      timestamp: new Date().toISOString()
    });
  }
};

// Basic API endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Auzap.ai Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      whatsapp_status: 'POST /api/whatsapp/status',
      whatsapp_connect: 'POST /api/whatsapp/connect',
      whatsapp_disconnect: 'POST /api/whatsapp/disconnect'
    },
    timestamp: new Date().toISOString()
  });
});

// WhatsApp Status endpoint
app.get('/api/whatsapp/status', authMiddleware, (req, res) => {
  // Mock response for now - will be replaced with real WhatsApp manager later
  const mockStatus = {
    status: 'disconnected',
    needsQR: false,
    phoneNumber: null,
    instanceName: null,
    lastUpdate: new Date().toISOString()
  };

  res.json({
    success: true,
    data: mockStatus,
    message: 'WhatsApp disconnected',
    timestamp: new Date().toISOString()
  });
});

// WhatsApp Connect endpoint
app.post('/api/whatsapp/connect', authMiddleware, (req, res) => {
  // Mock response for now
  const mockResult = {
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    message: 'QR Code gerado! Escaneie com seu WhatsApp para conectar'
  };

  res.json({
    success: true,
    data: mockResult,
    message: mockResult.message,
    timestamp: new Date().toISOString()
  });
});

// WhatsApp Disconnect endpoint
app.post('/api/whatsapp/disconnect', authMiddleware, (req, res) => {
  // Mock response for now
  const mockResult = {
    success: true,
    message: 'WhatsApp desconectado com sucesso'
  };

  res.json({
    success: true,
    data: mockResult,
    message: mockResult.message,
    timestamp: new Date().toISOString()
  });
});

// WhatsApp QR Code endpoint
app.get('/api/whatsapp/qrcode', authMiddleware, (req, res) => {
  // Mock response for now
  const mockData = {
    available: false,
    qrCode: null
  };

  res.json({
    success: true,
    data: mockData,
    message: 'QR Code não disponível',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auzap Backend started successfully!`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💝 Ready to transform pet care with AI!`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api - API information`);
  console.log(`   POST /api/webhook/whatsapp - WhatsApp webhook`);
  console.log(`   GET  /api/evolution/* - Evolution API routes`);
  console.log(`   POST /api/ai/* - AI service routes`);
  console.log(`   GET  /api/dashboard/* - Dashboard routes`);
  console.log(`   PUT  /api/settings/* - Settings routes`);
});

export default app;