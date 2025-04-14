# StoryWall Application Startup Script
Write-Host "Starting StoryWall Application..." -ForegroundColor Cyan

# More thorough cleanup of any existing Node.js processes
Write-Host "Cleaning up any existing Node.js processes..." -ForegroundColor Yellow

# First attempt with process name
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Host "Killing Node.js process $($_.Id)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Give processes time to fully terminate
Start-Sleep -Seconds 2

# Second verification to make sure all processes are gone
$remainingNodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($remainingNodeProcesses) {
    Write-Host "Some Node.js processes are still running. Forcing termination..." -ForegroundColor Red
    $remainingNodeProcesses | ForEach-Object {
        Write-Host "Force killing Node.js process $($_.Id)" -ForegroundColor Red
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# Free up ports directly (3000-3010 range to cover all possible ports)
Write-Host "Ensuring all relevant ports are free..." -ForegroundColor Yellow
foreach ($port in 3000..3010) {
    $connections = netstat -ano | Select-String -Pattern ":$port\s" | Select-String -Pattern "LISTENING"
    foreach ($connection in $connections) {
        $pidPattern = "\s+(\d+)$"
        if ($connection -match $pidPattern) {
            $processPid = $matches[1]
            Write-Host "Releasing port $port (PID: $processPid)" -ForegroundColor Gray
            Stop-Process -Id $processPid -Force -ErrorAction SilentlyContinue
        }
    }
}

# Function to start a service in a new window
function Start-ServiceInNewWindow {
    param (
        [string]$ServiceName,
        [string]$Path,
        [hashtable]$Env = @{},
        [int]$Port
    )
    
    # Check if the port is already in use
    $portInUse = netstat -ano | Select-String -Pattern ":$Port\s" | Select-String -Pattern "LISTENING"
    if ($portInUse) {
        Write-Host "Warning: Port $Port is already in use. Service may not start correctly." -ForegroundColor Red
        $portInUse
    }
    
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Green
    
    # Create environment variable string for PowerShell
    $EnvVarString = ""
    foreach ($key in $Env.Keys) {
        # Set environment variables using proper PowerShell syntax
        $EnvVarString += "`$env:$key='$($Env[$key])'; "
    }
    
    # Command to run in the new window
    $Command = "cd '$Path'; $EnvVarString npm start"
    
    # Start a new PowerShell process for this service
    Start-Process powershell -ArgumentList "-NoExit -Command `"$Command`""
    
    # Give the service time to start
    Start-Sleep -Seconds 5
}

# Configure service ports
$USER_SERVICE_PORT = 3000
$TIMELINE_SERVICE_PORT = 3001
$API_GATEWAY_PORT = 3002
$FRONTEND_PORT = 3003

# Get the current directory
$ROOT_DIR = $PWD.Path

# Start User Service
Start-ServiceInNewWindow -ServiceName "User Service" -Path "$ROOT_DIR\services\user-service" -Env @{PORT=$USER_SERVICE_PORT} -Port $USER_SERVICE_PORT

# Start Timeline Service
Start-ServiceInNewWindow -ServiceName "Timeline Service" -Path "$ROOT_DIR\services\timeline-service" -Env @{PORT=$TIMELINE_SERVICE_PORT} -Port $TIMELINE_SERVICE_PORT

# Start API Gateway
Start-ServiceInNewWindow -ServiceName "API Gateway" -Path "$ROOT_DIR\services\api-gateway" -Env @{PORT=$API_GATEWAY_PORT} -Port $API_GATEWAY_PORT

# Start Frontend
Start-ServiceInNewWindow -ServiceName "Frontend" -Path "$ROOT_DIR\frontend" -Env @{PORT=$FRONTEND_PORT} -Port $FRONTEND_PORT

Write-Host "All services started!" -ForegroundColor Cyan
Write-Host "User Service: http://localhost:$USER_SERVICE_PORT" -ForegroundColor Magenta
Write-Host "Timeline Service: http://localhost:$TIMELINE_SERVICE_PORT" -ForegroundColor Magenta
Write-Host "API Gateway: http://localhost:$API_GATEWAY_PORT" -ForegroundColor Magenta
Write-Host "Frontend: http://localhost:$FRONTEND_PORT" -ForegroundColor Magenta

Write-Host "`nDemo user credentials:" -ForegroundColor Yellow
Write-Host "Email: demo@example.com" -ForegroundColor White
Write-Host "Password: Demo123!" -ForegroundColor White

Write-Host "`nTimeline demo page: http://localhost:$FRONTEND_PORT/timeline-demo" -ForegroundColor Green 