const winston = require('winston');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  process.env.NODE_ENV === 'production'
    ? winston.format.json()
    : winston.format.printf(({ level, message, timestamp, requestId, ...meta }) => {
        return `${timestamp} [${level.toUpperCase()}] ${requestId ? `[${requestId}] ` : ''}${message} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`;
      })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'api-gateway' },
  transports: [
    // Write logs with level 'error' and below to error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs to combined.log
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// If not in production, also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }));
}

// Simplified logger for serverless environments
const createServerlessLogger = () => {
  return winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'api-gateway' },
    transports: [
      new winston.transports.Console()
    ]
  });
};

module.exports = {
  logger: process.env.VERCEL ? createServerlessLogger() : logger
}; 