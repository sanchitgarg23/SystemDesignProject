import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import ingestRoutes from './routes/ingest.routes';
import queryRoutes from './routes/query.routes';
import streamRoutes from './routes/stream.routes';
import appRoutes from './routes/app.routes';
import conductorRoutes from './routes/conductor.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';

// Load environment variable
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_BASE = '/etm/v1';

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'mongodb',
  });
});

// API routes
// ETM routes
app.use(API_BASE, ingestRoutes);
app.use(API_BASE, queryRoutes);
app.use(API_BASE, streamRoutes);

// New API routes
app.use('/app/v1', appRoutes);
app.use('/conductor/v1', conductorRoutes);
app.use('/admin/v1', adminRoutes);
app.use('/admin/v1', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Endpoint not found',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
});

// Initialize database and start server
async function start() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    app.listen(PORT, () => {
      console.log('');
      console.log('✅ New Gov API Server (MongoDB) is running!');
      console.log('');
      console.log(`📍 Base URL: http://localhost:${PORT}${API_BASE}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log('');
      console.log('📥 Ingest Endpoints (require X-Device-Key):');
      console.log(`   POST ${API_BASE}/heartbeat`);
      console.log(`   POST ${API_BASE}/ticket`);
      console.log(`   POST ${API_BASE}/trip/start`);
      console.log(`   POST ${API_BASE}/trip/end`);
      console.log(`   POST ${API_BASE}/offline-batch`);
      console.log('');
      console.log('📤 Query Endpoints (require Authorization: Bearer):');
      console.log(`   GET  ${API_BASE}/bus/:bus_id/live`);
      console.log(`   GET  ${API_BASE}/route/:route_id/live-buses`);
      console.log(`   GET  ${API_BASE}/trip/:trip_id/tickets`);
      console.log(`   GET  ${API_BASE}/summary/revenue?date=YYYY-MM-DD`);
      console.log('');
      console.log('📡 Real-time Streaming:');
      console.log(`   GET  ${API_BASE}/stream?route_id=<optional>`);
      console.log('');
      console.log('📱 Passenger App Endpoints (/app/v1):');
      console.log('   POST /auth/login');
      console.log('   GET  /stops');
      console.log('   GET  /routes/search?query=...');
      console.log('   GET  /routes/search-by-stops?source=...&destination=...');
      console.log('   GET  /routes/:route_id/live-buses');
      console.log('   GET  /bus/:bus_id/track');
      console.log('   GET  /buses/live');
      console.log('   POST /booking (12:01 AM constraint)');
      console.log('   GET  /booking/:id');
      console.log('   GET  /bookings');
      console.log('   DELETE /booking/:id');
      console.log('');
      console.log('👨‍✈️ Conductor App Endpoints (/conductor/v1):');
      console.log('   POST /auth/login');
      console.log('   GET  /trip/active');
      console.log('   POST /ticket');
      console.log('   POST /offline-sync');
      console.log('   GET  /trip/tickets');
      console.log('   POST /verify-qr (QR code verification)');
      console.log('');
      console.log('🏛️  Admin/Gov Endpoints (/admin/v1):');
      console.log('   GET  /routes');
      console.log('   GET  /analytics/realtime');
      console.log('   GET  /analytics/revenue?date=YYYY-MM-DD');
      console.log('   GET  /analytics/tickets');
      console.log('   GET  /analytics/route-performance');
      console.log('   GET  /device-health');
      console.log('   GET  /fleet/buses');
      console.log('   GET  /fleet/drivers');
      console.log('   GET  /fleet/conductors');
      console.log('   GET  /buses/live');
      console.log('   GET  /bookings');
      console.log('');
      console.log('🔑 Default Credentials:');
      console.log('   ETM Bearer Token: demo_token_12345');
      console.log('   Admin Token: admin_demo_token_12345');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
