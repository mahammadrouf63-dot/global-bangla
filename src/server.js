require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pool = require('./config/db');

const app = express();

// Initialize session store with error handling
let sessionStore;
try {
  sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    clearExpired: true,
    checkExpirationInterval: 300000,
    expiration: 86400000,
    createDatabaseTable: true,
    schema: {
      tableName: 'sessions',
      columnNames: {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data'
      }
    }
  });
} catch (error) {
  console.error('Session store initialization failed:', error.message);
  // Fallback to memory store if MySQL session store fails
  sessionStore = new session.MemoryStore();
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://api.razorpay.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "http:", "https:"],
      frameSrc: ["'self'", "https://checkout.razorpay.com", "https://api.razorpay.com"],
    },
  },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(session({
  key: 'gb_session',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: 'lax',
    path: '/'
  }
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/user', express.static(path.join(__dirname, '../user-site')));
app.use('/admin', express.static(path.join(__dirname, '../admin-site')));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (_req, res) => {
  return res.sendFile(path.join(__dirname, '../user-site/index.html'));
});

// Health check endpoint for Railway
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 5000;

// Start server with error handling
async function startServer() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await pool.getConnection();
    console.log('✅ Database connection successful');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Global Bangla server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    
    // Start server anyway even if DB fails (Railway will retry)
    app.listen(PORT, () => {
      console.log(`⚠️  Global Bangla server running on port ${PORT} (database issues detected)`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
