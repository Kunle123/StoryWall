const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { logger } = require('../utils/logger');

// In-memory MongoDB instance
let mongod = null;

/**
 * Connect to MongoDB (either real or in-memory)
 */
async function connectDB() {
  try {
    // Check if we should use in-memory database
    if (process.env.USE_MEMORY_DB === 'true') {
      logger.info('Using in-memory MongoDB instance');
      
      // Create in-memory MongoDB instance
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      
      // Connect to in-memory database
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      logger.info(`Connected to in-memory MongoDB at ${uri}`);
    } else {
      // Connect to real MongoDB instance
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      logger.info('Connected to MongoDB');
    }
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    
    if (mongod) {
      await mongod.stop();
    }
    
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error(`MongoDB disconnection error: ${error.message}`);
  }
}

module.exports = { connectDB, disconnectDB }; 