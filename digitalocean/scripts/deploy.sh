#!/bin/bash

# Auzap AI Connect - DigitalOcean Deployment Script
# This script automates the deployment process to DigitalOcean infrastructure

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DO_CONFIG_DIR="$PROJECT_ROOT/digitalocean"
APP_DIR="/opt/auzap"
APP_USER="auzap"

# Environment
ENVIRONMENT="${1:-staging}"
DEPLOY_TARGET="${2:-app-platform}"  # app-platform or droplet

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"; exit 1; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"; }

# Help function
show_help() {
    cat << EOF
Auzap AI Connect - DigitalOcean Deployment Script

Usage: $0 [ENVIRONMENT] [TARGET]

ENVIRONMENT:
    staging     Deploy to staging environment (default)
    production  Deploy to production environment

TARGET:
    app-platform    Deploy to DigitalOcean App Platform (default)
    droplet         Deploy to DigitalOcean Droplet with Docker

Examples:
    $0                          # Deploy staging to App Platform
    $0 staging app-platform     # Deploy staging to App Platform
    $0 production droplet       # Deploy production to Droplet
    $0 staging droplet          # Deploy staging to Droplet

Prerequisites for App Platform:
    - doctl CLI tool installed and configured
    - GitHub repository connected to DigitalOcean

Prerequisites for Droplet:
    - SSH access to target droplet
    - Docker and docker-compose installed on droplet
    - Environment variables configured

EOF
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites for $DEPLOY_TARGET deployment..."

    if [[ "$DEPLOY_TARGET" == "app-platform" ]]; then
        # Check doctl
        if ! command -v doctl &> /dev/null; then
            error "doctl CLI not found. Install it from: https://github.com/digitalocean/doctl"
        fi

        # Check doctl authentication
        if ! doctl account get &> /dev/null; then
            error "doctl not authenticated. Run: doctl auth init"
        fi

        # Check Git status
        if [[ -n $(git status --porcelain) ]]; then
            warn "You have uncommitted changes. Consider committing them first."
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                error "Deployment cancelled"
            fi
        fi
    elif [[ "$DEPLOY_TARGET" == "droplet" ]]; then
        # Check SSH access
        if [[ -z "${DROPLET_HOST:-}" ]]; then
            error "DROPLET_HOST environment variable not set"
        fi

        # Check Docker Compose file
        if [[ ! -f "$DO_CONFIG_DIR/docker-compose.do.yml" ]]; then
            error "Docker Compose file not found: $DO_CONFIG_DIR/docker-compose.do.yml"
        fi
    fi

    log "Prerequisites check completed ✓"
}

# Validate environment configuration
validate_config() {
    log "Validating configuration for $ENVIRONMENT environment..."

    local config_file
    if [[ "$ENVIRONMENT" == "production" ]]; then
        config_file="$DO_CONFIG_DIR/app.production.yaml"
    else
        config_file="$DO_CONFIG_DIR/app.staging.yaml"
    fi

    if [[ "$DEPLOY_TARGET" == "app-platform" ]]; then
        if [[ ! -f "$config_file" ]]; then
            error "Configuration file not found: $config_file"
        fi
        log "Configuration file found: $config_file ✓"
    fi

    log "Configuration validation completed ✓"
}

# Deploy to DigitalOcean App Platform
deploy_app_platform() {
    log "Deploying to DigitalOcean App Platform ($ENVIRONMENT)..."

    local config_file
    local app_name
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        config_file="$DO_CONFIG_DIR/app.production.yaml"
        app_name="auzap-ai-connect-production"
    else
        config_file="$DO_CONFIG_DIR/app.staging.yaml"
        app_name="auzap-ai-connect-staging"
    fi

    # Check if app exists
    if doctl apps list --format Name --no-header | grep -q "^$app_name$"; then
        log "Updating existing app: $app_name"
        
        # Get app ID
        local app_id
        app_id=$(doctl apps list --format ID,Name --no-header | grep "$app_name" | cut -f1)
        
        # Update the app
        doctl apps update "$app_id" --spec "$config_file"
        
        log "App update initiated. Deployment ID: $(doctl apps list-deployments "$app_id" --format ID --no-header | head -1)"
        
    else
        log "Creating new app: $app_name"
        
        # Create new app
        local app_info
        app_info=$(doctl apps create --spec "$config_file" --format ID,Name --no-header)
        local app_id
        app_id=$(echo "$app_info" | cut -f1)
        
        log "App created successfully. App ID: $app_id"
    fi

    # Wait for deployment to complete
    if [[ "${WAIT_FOR_DEPLOYMENT:-true}" == "true" ]]; then
        log "Waiting for deployment to complete..."
        wait_for_app_deployment "$app_id"
    fi

    # Show app info
    show_app_info "$app_name"
}

# Deploy to DigitalOcean Droplet
deploy_droplet() {
    log "Deploying to DigitalOcean Droplet ($ENVIRONMENT)..."

    local droplet_host="${DROPLET_HOST}"
    local ssh_user="${SSH_USER:-auzap}"

    # Create deployment package
    log "Creating deployment package..."
    local temp_dir
    temp_dir=$(mktemp -d)
    
    # Copy necessary files
    cp -r "$DO_CONFIG_DIR" "$temp_dir/"
    cp -r "$PROJECT_ROOT/backend" "$temp_dir/" 2>/dev/null || warn "Backend directory not found"
    cp -r "$PROJECT_ROOT/frontend" "$temp_dir/" 2>/dev/null || warn "Frontend directory not found"
    
    # Create deployment tarball
    local package_file="/tmp/auzap-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$package_file" -C "$temp_dir" .
    rm -rf "$temp_dir"
    
    log "Deployment package created: $package_file"

    # Upload to droplet
    log "Uploading to droplet: $droplet_host"
    scp "$package_file" "$ssh_user@$droplet_host:$APP_DIR/"

    # Extract and deploy on droplet
    log "Extracting and deploying on droplet..."
    ssh "$ssh_user@$droplet_host" << EOF
        set -e
        cd $APP_DIR
        
        # Backup current deployment
        if [ -d "current" ]; then
            mv current "backup-\$(date +%Y%m%d-%H%M%S)" || true
        fi
        
        # Extract new deployment
        mkdir -p current
        tar -xzf $(basename "$package_file") -C current
        rm $(basename "$package_file")
        
        # Set permissions
        chown -R $APP_USER:$APP_USER current/
        chmod +x current/digitalocean/scripts/*.sh
        
        # Stop current services
        cd current
        if [ -f docker-compose.do.yml ]; then
            docker-compose -f docker-compose.do.yml down || true
        fi
        
        # Start new services
        docker-compose -f digitalocean/docker-compose.do.yml up -d --build
        
        # Health check
        sleep 30
        ./digitalocean/scripts/../health-check.sh || echo "Health check failed, but deployment continued"
        
        echo "Deployment completed on droplet!"
EOF

    # Clean up local package
    rm "$package_file"

    log "Droplet deployment completed ✓"
}

# Wait for App Platform deployment to complete
wait_for_app_deployment() {
    local app_id="$1"
    local max_wait=1200  # 20 minutes
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        local status
        status=$(doctl apps list-deployments "$app_id" --format Phase --no-header | head -1)
        
        case "$status" in
            "ACTIVE")
                log "Deployment completed successfully! ✓"
                return 0
                ;;
            "ERROR"|"CANCELED")
                error "Deployment failed with status: $status"
                ;;
            *)
                info "Deployment in progress... Status: $status"
                sleep 30
                wait_time=$((wait_time + 30))
                ;;
        esac
    done
    
    error "Deployment timed out after $max_wait seconds"
}

# Show app information
show_app_info() {
    local app_name="$1"
    
    log "App Platform deployment information:"
    
    # Get app details
    local app_info
    app_info=$(doctl apps list --format ID,Name,DefaultIngress,Phase --no-header | grep "$app_name")
    
    if [[ -n "$app_info" ]]; then
        local app_id
        local app_url
        local app_phase
        
        app_id=$(echo "$app_info" | cut -f1)
        app_url=$(echo "$app_info" | cut -f3)
        app_phase=$(echo "$app_info" | cut -f4)
        
        echo "📱 App Name: $app_name"
        echo "🆔 App ID: $app_id"
        echo "🌐 URL: https://$app_url"
        echo "📊 Status: $app_phase"
        echo ""
        
        # Show recent deployments
        echo "Recent deployments:"
        doctl apps list-deployments "$app_id" --format ID,Phase,CreatedAt --no-header | head -5
        echo ""
        
        echo "🔗 View in DigitalOcean Console:"
        echo "   https://cloud.digitalocean.com/apps/$app_id"
    else
        warn "Could not find app information for: $app_name"
    fi
}

# Rollback function
rollback() {
    log "Initiating rollback..."
    
    if [[ "$DEPLOY_TARGET" == "app-platform" ]]; then
        local app_name
        if [[ "$ENVIRONMENT" == "production" ]]; then
            app_name="auzap-ai-connect-production"
        else
            app_name="auzap-ai-connect-staging"
        fi
        
        local app_id
        app_id=$(doctl apps list --format ID,Name --no-header | grep "$app_name" | cut -f1)
        
        if [[ -n "$app_id" ]]; then
            # Get previous deployment
            local prev_deployment
            prev_deployment=$(doctl apps list-deployments "$app_id" --format ID --no-header | sed -n '2p')
            
            if [[ -n "$prev_deployment" ]]; then
                log "Rolling back to deployment: $prev_deployment"
                # Note: DigitalOcean App Platform doesn't have direct rollback, 
                # you would need to redeploy with previous configuration
                warn "App Platform rollback requires manual intervention or redeployment with previous config"
            else
                error "No previous deployment found for rollback"
            fi
        else
            error "App not found: $app_name"
        fi
        
    elif [[ "$DEPLOY_TARGET" == "droplet" ]]; then
        local droplet_host="${DROPLET_HOST}"
        local ssh_user="${SSH_USER:-auzap}"
        
        ssh "$ssh_user@$droplet_host" << 'EOF'
            cd /opt/auzap
            
            # Find most recent backup
            BACKUP_DIR=$(ls -dt backup-* 2>/dev/null | head -1)
            
            if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
                echo "Rolling back to: $BACKUP_DIR"
                
                # Stop current services
                cd current 2>/dev/null && docker-compose -f digitalocean/docker-compose.do.yml down || true
                cd ..
                
                # Swap directories
                mv current "failed-$(date +%Y%m%d-%H%M%S)" || true
                mv "$BACKUP_DIR" current
                
                # Start services
                cd current
                docker-compose -f digitalocean/docker-compose.do.yml up -d
                
                echo "Rollback completed!"
            else
                echo "No backup found for rollback"
                exit 1
            fi
EOF
        
        log "Droplet rollback completed ✓"
    fi
}

# Main execution
main() {
    # Parse arguments
    if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
        show_help
        exit 0
    fi
    
    if [[ "${1:-}" == "rollback" ]]; then
        rollback
        exit 0
    fi

    # Validate inputs
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        error "Invalid environment: $ENVIRONMENT. Use 'staging' or 'production'"
    fi

    if [[ "$DEPLOY_TARGET" != "app-platform" && "$DEPLOY_TARGET" != "droplet" ]]; then
        error "Invalid target: $DEPLOY_TARGET. Use 'app-platform' or 'droplet'"
    fi

    log "🚀 Starting deployment to DigitalOcean"
    log "Environment: $ENVIRONMENT"
    log "Target: $DEPLOY_TARGET"
    echo ""

    # Run deployment
    check_prerequisites
    validate_config

    if [[ "$DEPLOY_TARGET" == "app-platform" ]]; then
        deploy_app_platform
    else
        deploy_droplet
    fi

    log "🎉 Deployment completed successfully!"
    
    # Show next steps
    info "Next steps:"
    if [[ "$DEPLOY_TARGET" == "app-platform" ]]; then
        echo "1. Verify the application is running correctly"
        echo "2. Check logs in the DigitalOcean console"
        echo "3. Run any necessary post-deployment tests"
    else
        echo "1. SSH to droplet and verify services: docker-compose ps"
        echo "2. Check application logs: docker-compose logs -f"
        echo "3. Run health checks: ./health-check.sh"
    fi
}

# Run main function
main "$@"