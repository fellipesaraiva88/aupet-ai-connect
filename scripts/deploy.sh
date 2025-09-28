#!/bin/bash

# Auzap Production Deployment Script
# Automated deployment with health checks and rollback capability

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="https://auzap-backend-api.onrender.com"
FRONTEND_URL="https://auzap-frontend.onrender.com"
HEALTH_CHECK_TIMEOUT=300 # 5 minutes
ROLLBACK_ON_FAILURE=${ROLLBACK_ON_FAILURE:-true}

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to check if URL is responding
check_url() {
    local url=$1
    local timeout=${2:-30}
    local max_attempts=${3:-5}
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        print_status "Checking $url (attempt $attempt/$max_attempts)"

        if curl -f -s --max-time $timeout "$url" > /dev/null; then
            print_success "$url is responding"
            return 0
        else
            print_warning "$url not responding, waiting 30s..."
            sleep 30
            ((attempt++))
        fi
    done

    print_error "$url failed health check after $max_attempts attempts"
    return 1
}

# Function to perform comprehensive health check
health_check() {
    local service_name=$1
    local health_url=$2

    print_header "Health check for $service_name"

    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$health_url" || echo "HTTPSTATUS:000")
    local body=$(echo "$response" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
    local status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

    if [ "$status" -eq 200 ]; then
        print_success "$service_name health check passed"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        print_error "$service_name health check failed (HTTP $status)"
        echo "$body"
        return 1
    fi
}

# Function to send Slack notification
send_notification() {
    local message=$1
    local color=${2:-"good"}

    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
}

# Function to trigger GitHub workflow
trigger_workflow() {
    local workflow=$1

    if command -v gh &> /dev/null; then
        print_status "Triggering GitHub workflow: $workflow"
        gh workflow run "$workflow" || print_warning "Failed to trigger workflow"
    else
        print_warning "GitHub CLI not found, skipping workflow trigger"
    fi
}

# Function to rollback deployment
rollback_deployment() {
    print_error "Deployment failed, initiating rollback..."

    if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
        print_status "Triggering automatic rollback"
        trigger_workflow "rollback.yml"
        send_notification "🔄 Automatic rollback initiated due to deployment failure" "warning"
    else
        print_warning "Automatic rollback disabled"
        send_notification "❌ Deployment failed - manual intervention required" "danger"
    fi
}

# Main deployment function
main() {
    print_header "Starting Auzap Production Deployment"
    echo "========================================"

    local start_time=$(date +%s)
    local deployment_success=true

    # Pre-deployment checks
    print_header "Pre-deployment validation"

    # Check if required environment variables are set
    if [ -z "$RENDER_API_KEY" ]; then
        print_warning "RENDER_API_KEY not set, manual deployment verification required"
    fi

    # Trigger deployment via GitHub Actions
    print_header "Triggering deployment pipeline"

    if command -v gh &> /dev/null && [ -n "$GITHUB_TOKEN" ]; then
        print_status "Triggering production deployment via GitHub Actions"
        gh workflow run deploy-production.yml --ref main

        print_status "Waiting for deployment to start..."
        sleep 60
    else
        print_warning "GitHub CLI not available or token not set"
        print_status "Deployment should be triggered automatically via push to main branch"
        print_status "Continuing with health checks..."
    fi

    # Wait for services to be deployed
    print_header "Waiting for services to be ready"

    print_status "Waiting 2 minutes for deployment to complete..."
    sleep 120

    # Health checks
    print_header "Performing health checks"

    # Backend health check
    if ! health_check "Backend" "$BACKEND_URL/health"; then
        deployment_success=false
    fi

    # Frontend accessibility check
    if ! check_url "$FRONTEND_URL" 30 5; then
        deployment_success=false
    fi

    # Additional backend endpoint checks
    print_header "Testing API endpoints"

    endpoints=(
        "$BACKEND_URL/api"
        "$BACKEND_URL/ready"
        "$BACKEND_URL/live"
        "$BACKEND_URL/metrics"
    )

    for endpoint in "${endpoints[@]}"; do
        if ! check_url "$endpoint" 15 3; then
            print_warning "Endpoint check failed: $endpoint"
            # Don't fail deployment for non-critical endpoints
        fi
    done

    # Performance verification
    print_header "Performance verification"

    response_time=$(curl -o /dev/null -s -w "%{time_total}" "$BACKEND_URL/health" || echo "0")
    if (( $(echo "$response_time > 5.0" | bc -l) )); then
        print_warning "High response time detected: ${response_time}s"
    else
        print_success "Response time: ${response_time}s"
    fi

    # Final status
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [ "$deployment_success" = true ]; then
        print_success "🎉 Deployment completed successfully!"
        print_success "⏱️  Total deployment time: ${duration}s"
        print_success "🌐 Frontend: $FRONTEND_URL"
        print_success "🔧 Backend: $BACKEND_URL"

        send_notification "✅ Auzap production deployment successful! Duration: ${duration}s" "good"

        # Post-deployment actions
        print_header "Post-deployment actions"

        # Update health check monitoring
        print_status "Deployment completed, monitoring active"

        # Create deployment record
        if command -v git &> /dev/null; then
            local commit=$(git rev-parse HEAD)
            local branch=$(git branch --show-current)
            print_status "Deployed commit: $commit ($branch)"
        fi

    else
        print_error "❌ Deployment failed!"
        send_notification "❌ Auzap production deployment failed after ${duration}s" "danger"

        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            rollback_deployment
        fi

        exit 1
    fi
}

# Script usage
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --no-rollback    Disable automatic rollback on failure"
    echo "  --help          Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  RENDER_API_KEY        Render.com API key"
    echo "  GITHUB_TOKEN          GitHub token for workflow triggers"
    echo "  SLACK_WEBHOOK_URL     Slack webhook for notifications"
    echo "  ROLLBACK_ON_FAILURE   Enable/disable automatic rollback (default: true)"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-rollback)
            ROLLBACK_ON_FAILURE=false
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check dependencies
print_header "Checking dependencies"

dependencies=("curl" "jq")
missing_deps=()

for dep in "${dependencies[@]}"; do
    if ! command -v "$dep" &> /dev/null; then
        missing_deps+=("$dep")
    fi
done

if [ ${#missing_deps[@]} -gt 0 ]; then
    print_error "Missing required dependencies: ${missing_deps[*]}"
    print_status "Install with: apt-get install ${missing_deps[*]} (Ubuntu/Debian)"
    print_status "Or: brew install ${missing_deps[*]} (macOS)"
    exit 1
fi

# Run main deployment
main