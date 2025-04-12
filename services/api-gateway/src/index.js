const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const { logger } = require('./utils/logger');
const { verifyToken } = require('./middleware/auth');
const { serviceRegistry } = require('./serviceRegistry');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3002;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  // Include trailing slash variations
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) }}));

// Add request ID middleware
app.use((req, res, next) => {
  req.id = require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' }
  }
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const serviceStatus = serviceRegistry.getServicesStatus();
  
  // Check if any of the required services are down
  const servicesDown = Object.entries(serviceStatus)
    .filter(([, status]) => status === 'DOWN')
    .map(([service]) => service);
  
  if (servicesDown.length > 0) {
    return res.status(503).json({
      status: 'DEGRADED',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      servicesDown
    });
  }
  
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    services: serviceStatus
  });
});

// Public routes
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'StoryWall API Gateway',
    version: '1.0.0',
    status: 'UP'
  });
});

// Service Discovery & Status
app.get('/services', (req, res) => {
  res.status(200).json({
    services: serviceRegistry.getServicesStatus()
  });
});

// Debug endpoint (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug', (req, res) => {
    res.status(200).json({
      env: process.env.NODE_ENV,
      nodeVersion: process.version,
      requestId: req.id,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      services: serviceRegistry.getServicesConfig()
    });
  });
}

// Proxy middleware configuration for each service
// User Service Routes
app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:3000',
  pathRewrite: {
    '^/api/users': '/api/users',
  },
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    // Add request ID to the forwarded request
    proxyReq.setHeader('X-Request-ID', req.id);
    logger.debug('Proxying request to user service', { 
      path: req.path, 
      method: req.method,
      requestId: req.id
    });
  },
  onError: (err, req, res) => {
    logger.error('User service proxy error', { 
      error: err.message, 
      requestId: req.id,
      stack: err.stack
    });
    serviceRegistry.markServiceDown('user-service');
    res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'User service temporarily unavailable' }
    });
  }
}));

// Auth Service Routes
app.use('/api/auth', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:3000',
  pathRewrite: {
    '^/api/auth': '/api/auth',
  },
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-Request-ID', req.id);
    logger.debug('Proxying request to auth service', { 
      path: req.path, 
      method: req.method,
      requestId: req.id
    });
  },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', { 
      error: err.message, 
      requestId: req.id,
      stack: err.stack
    });
    serviceRegistry.markServiceDown('user-service');
    res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Authentication service temporarily unavailable' }
    });
  }
}));

// Timeline Service Routes
app.use('/api/timelines', createProxyMiddleware({
  target: process.env.TIMELINE_SERVICE_URL || 'http://localhost:3001',
  pathRewrite: {
    '^/api/timelines': '/api/timelines',
  },
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-Request-ID', req.id);
    logger.debug('Proxying request to timeline service', { 
      path: req.path, 
      method: req.method,
      requestId: req.id
    });
  },
  onError: (err, req, res) => {
    logger.error('Timeline service proxy error', { 
      error: err.message, 
      requestId: req.id,
      stack: err.stack
    });
    serviceRegistry.markServiceDown('timeline-service');
    res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Timeline service temporarily unavailable' }
    });
  }
}));

// Events Service Routes
app.use('/api/events', createProxyMiddleware({
  target: process.env.TIMELINE_SERVICE_URL || 'http://localhost:3001',
  pathRewrite: {
    '^/api/events': '/api/events',
  },
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-Request-ID', req.id);
    logger.debug('Proxying request to events service', { 
      path: req.path, 
      method: req.method,
      requestId: req.id
    });
  },
  onError: (err, req, res) => {
    logger.error('Events service proxy error', { 
      error: err.message, 
      requestId: req.id,
      stack: err.stack
    });
    serviceRegistry.markServiceDown('timeline-service');
    res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Events service temporarily unavailable' }
    });
  }
}));

// Error handler
app.use((err, req, res, next) => {
  logger.error('API Gateway error', { 
    error: err.message, 
    requestId: req.id,
    stack: err.stack
  });
  
  res.status(500).json({
    success: false,
    error: { 
      code: 'SERVER_ERROR', 
      message: 'Internal server error'
    }
  });
});

// Handle 404
app.use((req, res) => {
  logger.warn('Route not found', { 
    path: req.path, 
    method: req.method,
    requestId: req.id
  });
  
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Resource not found' }
  });
});

// Start service discovery and monitoring
serviceRegistry.startMonitoring();

// Start the server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  serviceRegistry.stopMonitoring();
  process.exit(0);
});

module.exports = app; // For testing 