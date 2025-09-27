import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

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

// Basic API endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Auzap.ai Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    },
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
});

export default app;