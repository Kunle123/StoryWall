# Debugging Lessons Learned: Microservices Architecture

## Docker and Container Issues

1. **Memory Limitations**
   - Split dependency installations into smaller chunks to avoid memory errors during builds
   - Prefer incremental installations grouped by related packages

2. **File Structure**
   - Ensure proper file paths in COPY commands
   - Use explicit paths (`./file`) instead of implicit ones (`file`)

3. **Dockerfile Best Practices**
   - Always include a proper `FROM` statement at the beginning
   - Explicitly install all dependencies to avoid missing packages
   - Run basic verification commands to check installations
   - Use multi-stage builds for complex applications

## Deployment Configuration

1. **Railway Deployments**
   - Use `DOCKERFILE` builder explicitly in railway.json when using custom Dockerfiles
   - Remove database migration commands from initial deployments to reduce complexity
   - Set a proper health check endpoint with reasonable timeout and retries
   - Configure appropriate restart policies

2. **Vercel Deployments**
   - Set the explicit VERCEL environment variable for conditional logic
   - Export modules correctly for serverless functions
   - Disable operations that don't work well in serverless (file system writes)
   - Create proper vercel.json configurations specifying builds and routes

## Microservices Communication

1. **CORS Configuration**
   - Configure CORS correctly on all services with appropriate origins
   - Test CORS with the actual frontend domain
   - Include trailing slash variations in CORS configs

2. **API Gateway Best Practices**
   - Implement robust error handling when services are unavailable
   - Track service availability status
   - Return proper status codes (503 instead of 500) for unavailable services
   - Include diagnostic endpoints for troubleshooting

## Error Handling and Debugging

1. **Application Structure**
   - Use standalone files to simplify module imports
   - Create self-contained applications for easier deployment
   - Implement clear error boundaries between services

2. **Logging Strategy**
   - Set up environment-specific logging (simplified for serverless)
   - Use request IDs to track requests across services
   - Include timestamps, service names, and error details in logs
   - Add debug endpoints in production for diagnostic information

3. **Fallback Behavior**
   - Implement graceful degradation when services are unavailable
   - Use mock data or stubs for testing before all services are ready

## Testing Approach

1. **Incremental Testing**
   - Test each service in isolation before integration
   - Verify connectivity using health checks before full testing
   - Create comprehensive smoke tests for each deployment

2. **Environment Variables**
   - Double-check environment variable configuration in each deployment
   - Use defaults that make sense for the environment
   - Include environment-specific configuration for testing

## General Patterns

1. **Avoid Magic Paths**
   - Don't rely on directory structures that might change between environments
   - Use absolute module imports and avoid relative paths when possible

2. **Early Validation**
   - Add validation steps early in the deployment process
   - Return helpful error messages that explain what's missing

3. **Incremental Development**
   - Complete one component fully before moving to the next
   - Deploy services incrementally and verify each before proceeding 

## Database Connectivity

1. **MongoDB Connection Issues**
   - Use `127.0.0.1` instead of `localhost` in connection strings to avoid IPv6 resolution issues
   - Add connection options like `directConnection=true` and `serverSelectionTimeoutMS=5000` to improve reliability
   - Look for "Operation buffering timed out" errors which indicate connection issues despite successful initial connection
   - Ensure MongoDB binaries are in system PATH or use absolute paths
   - Create required data directories before starting MongoDB
   - Check for proper port availability with `netstat -ano | findstr :<port>` before starting services

2. **Dependency Management**
   - Add `dotenv` package and ensure it's loaded at the top of the entry file
   - Explicitly check for environment variables and provide useful defaults
   - Include appropriate error messages when database connection fails
   - Use database connection pooling for microservices

## PowerShell Specifics

1. **Command Syntax Differences**
   - Use semicolons `;` instead of `&&` for command chaining in PowerShell
   - For complex commands, create PowerShell scripts instead of one-liners
   - Use `-ErrorAction SilentlyContinue` when checking for running processes
   - Format JSON data properly with single quotes for PowerShell commands

2. **Process Management**
   - Use `Get-Process` and `Stop-Process` to manage running services
   - Check port usage with `netstat -ano | findstr :<port>` before starting services
   - Use `Start-Process -NoNewWindow` for background processes
   - Add tools like MongoDB to PATH temporarily with `$env:PATH += ";path/to/bin"`

## Health Check Patterns

1. **Service Health Monitoring**
   - Implement standardized health check endpoints at `/health` on all services
   - Include status, uptime, service name, and timestamp in health responses
   - Create separate debug endpoints with more detailed diagnostic information
   - Add memory usage and connection status to health checks

2. **Service Recovery**
   - Implement proper port release when services stop unexpectedly
   - Handle common error cases like `EADDRINUSE` with clear error messages
   - Include explicit shutdown handlers for database connections
   - Use SIGTERM handlers to close resources gracefully 