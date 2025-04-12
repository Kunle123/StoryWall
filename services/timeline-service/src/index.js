const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { logger } = require('./utils/logger');
const timelinesRoutes = require('./api/routes/timelineRoutes');
const eventsRoutes = require('./api/routes/eventRoutes');
const { errorHandler } = require('./api/middleware/errorHandler');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

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

// Routes
app.use('/api/timelines', timelinesRoutes);
app.use('/api/events', eventsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'timeline-service',
    dbConnection: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
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
      dbState: mongoose.connection.readyState
    });
  });
}

// Custom error handler
app.use(errorHandler);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      logger.info('Connected to MongoDB');
    } else {
      logger.warn('No MongoDB URI provided, running without database');
    }
    
    app.listen(PORT, () => {
      logger.info(`Timeline service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
startServer();

module.exports = app; // For testing 