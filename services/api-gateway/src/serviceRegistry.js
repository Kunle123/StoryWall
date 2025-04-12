const axios = require('axios');
const { logger } = require('./utils/logger');

/**
 * Service Registry for managing and monitoring microservices
 */
class ServiceRegistry {
  constructor() {
    // Configure services
    this.services = {
      'user-service': {
        url: process.env.USER_SERVICE_URL || 'http://localhost:3000',
        healthEndpoint: '/health',
        status: 'UNKNOWN',
        lastChecked: null
      },
      'timeline-service': {
        url: process.env.TIMELINE_SERVICE_URL || 'http://localhost:3001',
        healthEndpoint: '/health',
        status: 'UNKNOWN',
        lastChecked: null
      }
    };
    
    this.monitoringInterval = null;
    this.monitoringIntervalMs = process.env.SERVICE_CHECK_INTERVAL || 30000; // 30 seconds
  }
  
  /**
   * Get status of all services
   */
  getServicesStatus() {
    const result = {};
    for (const [service, config] of Object.entries(this.services)) {
      result[service] = config.status;
    }
    return result;
  }
  
  /**
   * Get configuration of all services (for debugging)
   */
  getServicesConfig() {
    return this.services;
  }
  
  /**
   * Mark a service as down
   */
  markServiceDown(serviceName) {
    if (this.services[serviceName]) {
      this.services[serviceName].status = 'DOWN';
      this.services[serviceName].lastChecked = new Date();
      logger.warn(`Service ${serviceName} marked as DOWN`);
    }
  }
  
  /**
   * Check health of a specific service
   */
  async checkServiceHealth(serviceName) {
    const service = this.services[serviceName];
    if (!service) {
      logger.error(`Attempted to check unknown service: ${serviceName}`);
      return false;
    }
    
    try {
      const response = await axios.get(`${service.url}${service.healthEndpoint}`, {
        timeout: 5000, // 5 second timeout
        headers: { 'X-Request-ID': require('crypto').randomUUID() }
      });
      
      const isUp = response.status === 200 && response.data.status === 'UP';
      
      service.status = isUp ? 'UP' : 'DOWN';
      service.lastChecked = new Date();
      
      if (!isUp) {
        logger.warn(`Service ${serviceName} health check failed: ${response.status} ${JSON.stringify(response.data)}`);
      } else {
        logger.debug(`Service ${serviceName} health check passed`);
      }
      
      return isUp;
    } catch (error) {
      service.status = 'DOWN';
      service.lastChecked = new Date();
      
      logger.error(`Service ${serviceName} health check error: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Check health of all services
   */
  async checkAllServices() {
    logger.info('Performing health check on all services');
    
    const checkPromises = Object.keys(this.services).map(serviceName => 
      this.checkServiceHealth(serviceName)
    );
    
    try {
      const results = await Promise.all(checkPromises);
      
      // Log overall status
      const allUp = results.every(result => result === true);
      if (allUp) {
        logger.info('All services are UP');
      } else {
        const downServices = Object.keys(this.services)
          .filter(serviceName => this.services[serviceName].status === 'DOWN')
          .join(', ');
        
        logger.warn(`Some services are DOWN: ${downServices}`);
      }
    } catch (error) {
      logger.error(`Error checking services: ${error.message}`);
    }
  }
  
  /**
   * Start monitoring services
   */
  startMonitoring() {
    logger.info(`Starting service monitoring with interval: ${this.monitoringIntervalMs}ms`);
    
    // Perform initial check
    this.checkAllServices();
    
    // Set up interval for regular checks
    this.monitoringInterval = setInterval(() => {
      this.checkAllServices();
    }, this.monitoringIntervalMs);
  }
  
  /**
   * Stop monitoring services
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Service monitoring stopped');
    }
  }
}

// Create and export singleton instance
const serviceRegistry = new ServiceRegistry();
module.exports = { serviceRegistry }; 