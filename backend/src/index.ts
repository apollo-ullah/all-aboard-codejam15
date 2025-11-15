import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './api/routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3001', // Allaboard (Next.js)
  'http://localhost:5173', // Old frontend (Vite) - for backwards compatibility
  'http://localhost:3001',
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400 // 24 hours
};
console.log('🔧 CORS Allowed Origins:', allowedOrigins);
app.use(cors(corsOptions));

// Handle preflight requests explicitly (Express 5 compatible)
// Note: Express 5 doesn't support wildcard patterns like '/api/*'
// Instead, we use a regex pattern or handle it in the routes
app.options('/health', cors(corsOptions));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n📥 ${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin || 'N/A'}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'N/A'}`);
  console.log(`   Content-Type: ${req.headers['content-type'] || 'N/A'}`);
  if (req.method === 'OPTIONS') {
    console.log(`   ✅ Handling CORS preflight request`);
  }
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Product Storyteller API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      scrape: 'POST /api/scrape',
      generateSlides: 'POST /api/generate-slides'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connection test endpoint
app.get('/api/test-connection', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is reachable',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'N/A'
  });
});

// API routes
app.use('/api', routes);

// Start server - bind to 0.0.0.0 to accept connections from all interfaces (needed for Vite proxy)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
  console.log(`✅ Ready to accept connections from Vite proxy`);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the other process or change PORT in .env`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

