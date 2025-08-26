#!/bin/bash

# Crypto Investment Committee Deployment Script
set -e

echo "🚀 Deploying Crypto Investment Committee Backend..."

# Configuration
ENVIRONMENT=${1:-local}
SERVICE_NAME="crypto-committee"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    REQUIRED_VERSION="18.0.0"
    if ! printf '%s\n%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V -C; then
        print_error "Node.js version $NODE_VERSION is too old. Requires 18.0.0+"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci --omit=dev
    print_success "Dependencies installed"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment for: $ENVIRONMENT"
    
    if [ "$ENVIRONMENT" = "local" ]; then
        if [ ! -f ".env" ]; then
            print_warning ".env file not found. Copying from .env.example..."
            cp .env.example .env
            print_warning "Please edit .env file with your configuration"
        fi
    elif [ "$ENVIRONMENT" = "production" ]; then
        if [ ! -f ".env.production" ]; then
            print_error ".env.production file not found"
            exit 1
        fi
        cp .env.production .env
    fi
    
    print_success "Environment configured"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    if npm test; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
}

# Start services
start_services() {
    print_status "Starting services..."
    
    if [ "$ENVIRONMENT" = "local" ]; then
        print_status "Starting in development mode..."
        npm run dev &
        SERVER_PID=$!
        echo $SERVER_PID > server.pid
    elif [ "$ENVIRONMENT" = "production" ]; then
        print_status "Starting in production mode..."
        npm start &
        SERVER_PID=$!
        echo $SERVER_PID > server.pid
    elif [ "$ENVIRONMENT" = "docker" ]; then
        print_status "Starting with Docker Compose..."
        docker-compose up -d
        SERVER_PID="docker"
    fi
    
    print_success "Services started"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    PORT=${PORT:-3000}
    MAX_ATTEMPTS=30
    ATTEMPT=1
    
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        if curl -f "http://localhost:$PORT/health" >/dev/null 2>&1; then
            print_success "Health check passed"
            return 0
        fi
        
        print_status "Health check attempt $ATTEMPT/$MAX_ATTEMPTS..."
        sleep 2
        ATTEMPT=$((ATTEMPT + 1))
    done
    
    print_error "Health check failed after $MAX_ATTEMPTS attempts"
    return 1
}

# Test API endpoints
test_endpoints() {
    print_status "Testing API endpoints..."
    
    PORT=${PORT:-3000}
    BASE_URL="http://localhost:$PORT"
    
    # Test health endpoint
    if ! curl -f "$BASE_URL/health" >/dev/null 2>&1; then
        print_error "Health endpoint failed"
        return 1
    fi
    
    # Test agents endpoint
    if ! curl -f "$BASE_URL/api/agents" >/dev/null 2>&1; then
        print_error "Agents endpoint failed"
        return 1
    fi
    
    # Test session creation
    SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/session" -H "Content-Type: application/json")
    if [ $? -ne 0 ]; then
        print_error "Session creation failed"
        return 1
    fi
    
    print_success "API endpoints test passed"
}

# Display deployment info
show_deployment_info() {
    print_success "🎉 Deployment completed successfully!"
    echo
    print_status "Service Information:"
    echo "  Service Name: $SERVICE_NAME"
    echo "  Environment: $ENVIRONMENT"
    echo "  Port: ${PORT:-3000}"
    echo
    print_status "Available Endpoints:"
    echo "  Health Check: http://localhost:${PORT:-3000}/health"
    echo "  API Base: http://localhost:${PORT:-3000}/api"
    echo "  Agents List: http://localhost:${PORT:-3000}/api/agents"
    echo "  Daily Analysis: http://localhost:${PORT:-3000}/api/daily"
    echo
    print_status "Example API Calls:"
    echo "  curl http://localhost:${PORT:-3000}/health"
    echo "  curl http://localhost:${PORT:-3000}/api/agents"
    echo "  curl -X POST http://localhost:${PORT:-3000}/api/chat -H 'Content-Type: application/json' -d '{\"query\":\"Should I buy Bitcoin today?\"}'"
    echo
    if [ "$ENVIRONMENT" != "docker" ] && [ -f "server.pid" ]; then
        print_status "To stop the service: kill \$(cat server.pid)"
    elif [ "$ENVIRONMENT" = "docker" ]; then
        print_status "To stop the service: docker-compose down"
    fi
}

# Cleanup function
cleanup() {
    if [ -f "server.pid" ] && [ "$ENVIRONMENT" != "docker" ]; then
        PID=$(cat server.pid)
        if ps -p $PID > /dev/null; then
            print_status "Stopping server..."
            kill $PID
            rm server.pid
        fi
    fi
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Main deployment flow
main() {
    echo "Starting deployment for environment: $ENVIRONMENT"
    echo
    
    check_prerequisites
    setup_environment
    install_dependencies
    
    # Skip tests for quick deployment
    if [ "$2" != "--skip-tests" ]; then
        run_tests
    fi
    
    start_services
    
    # Wait a moment for services to start
    sleep 5
    
    if health_check && test_endpoints; then
        show_deployment_info
        
        # Keep running in foreground for local/development
        if [ "$ENVIRONMENT" = "local" ] || [ "$ENVIRONMENT" = "development" ]; then
            print_status "Service is running. Press Ctrl+C to stop."
            wait $SERVER_PID
        fi
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Help text
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Crypto Investment Committee Deployment Script"
    echo
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo
    echo "Environments:"
    echo "  local       - Local development (default)"
    echo "  production  - Production deployment"
    echo "  docker      - Docker Compose deployment"
    echo
    echo "Options:"
    echo "  --skip-tests  - Skip running tests"
    echo "  --help, -h    - Show this help"
    echo
    echo "Examples:"
    echo "  $0                    # Deploy locally"
    echo "  $0 production         # Deploy to production"
    echo "  $0 docker             # Deploy with Docker"
    echo "  $0 local --skip-tests # Deploy locally without tests"
    exit 0
fi

# Run main function
main "$@"