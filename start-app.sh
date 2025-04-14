#!/bin/bash
# StoryWall Application Startup Script for Unix systems

# Text colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}Starting StoryWall Application...${NC}"

# Kill any existing Node.js processes that might be using the same ports
echo -e "${YELLOW}Cleaning up any existing Node.js processes...${NC}"
pkill -f "node" || true

# Configure service ports
USER_SERVICE_PORT=3000
TIMELINE_SERVICE_PORT=3001
API_GATEWAY_PORT=3002
FRONTEND_PORT=3003

# Get the current directory
ROOT_DIR=$(pwd)

# Function to start a service in a new terminal
start_service() {
    SERVICE_NAME=$1
    SERVICE_PATH=$2
    SERVICE_PORT=$3
    ENV_VARS=$4

    echo -e "${GREEN}Starting $SERVICE_NAME on port $SERVICE_PORT...${NC}"
    
    # Start in a new terminal window
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "tell app \"Terminal\" to do script \"cd $SERVICE_PATH && $ENV_VARS npm start\""
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux - try various terminal emulators
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "cd $SERVICE_PATH && $ENV_VARS npm start; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd $SERVICE_PATH && $ENV_VARS npm start; exec bash" &
        elif command -v konsole &> /dev/null; then
            konsole -e "cd $SERVICE_PATH && $ENV_VARS npm start; exec bash" &
        else
            # Fallback: run in background with nohup
            echo "No suitable terminal found. Running in background with logs in nohup.out"
            cd $SERVICE_PATH && nohup $ENV_VARS npm start > $SERVICE_NAME.log 2>&1 &
            cd $ROOT_DIR
        fi
    fi
    
    # Give the service time to start
    sleep 5
}

# Start User Service
start_service "User Service" "$ROOT_DIR/services/user-service" $USER_SERVICE_PORT ""

# Start Timeline Service
start_service "Timeline Service" "$ROOT_DIR/services/timeline-service" $TIMELINE_SERVICE_PORT ""

# Start API Gateway
start_service "API Gateway" "$ROOT_DIR/services/api-gateway" $API_GATEWAY_PORT ""

# Start Frontend
start_service "Frontend" "$ROOT_DIR/frontend" $FRONTEND_PORT "PORT=$FRONTEND_PORT"

echo -e "${CYAN}All services started!${NC}"
echo -e "${MAGENTA}User Service: http://localhost:$USER_SERVICE_PORT${NC}"
echo -e "${MAGENTA}Timeline Service: http://localhost:$TIMELINE_SERVICE_PORT${NC}"
echo -e "${MAGENTA}API Gateway: http://localhost:$API_GATEWAY_PORT${NC}"
echo -e "${MAGENTA}Frontend: http://localhost:$FRONTEND_PORT${NC}"

echo -e "\n${YELLOW}Demo user credentials:${NC}"
echo -e "${WHITE}Email: demo@example.com${NC}"
echo -e "${WHITE}Password: Demo123!${NC}"

echo -e "\n${GREEN}Timeline demo page: http://localhost:$FRONTEND_PORT/timeline-demo${NC}" 