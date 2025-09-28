#!/bin/bash

# Auzap AI Connect - SSL Certificate Renewal Script
# Automated Let's Encrypt certificate renewal with Docker integration

set -euo pipefail

# Configuration
DOMAIN_NAME="${DOMAIN_NAME:-example.com}"
EMAIL="${CERT_EMAIL:-admin@$DOMAIN_NAME}"
WEBROOT_PATH="${WEBROOT_PATH:-/var/www/certbot}"
NGINX_CONTAINER_NAME="${NGINX_CONTAINER_NAME:-auzap-nginx}"
COMPOSE_FILE="${COMPOSE_FILE:-/opt/auzap/current/digitalocean/docker-compose.do.yml}"

# Notification settings
NOTIFICATION_WEBHOOK="${NOTIFICATION_WEBHOOK:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Colors and logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"; }

# Check if certificate exists and when it expires
check_certificate() {
    local domain="$1"
    local cert_path="/etc/letsencrypt/live/$domain/fullchain.pem"
    
    if [[ ! -f "$cert_path" ]]; then
        info "Certificate not found for $domain"
        return 1
    fi
    
    # Check expiration date
    local expire_date
    expire_date=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
    local expire_timestamp
    expire_timestamp=$(date -d "$expire_date" +%s)
    local current_timestamp
    current_timestamp=$(date +%s)
    
    local days_until_expiry=$(( (expire_timestamp - current_timestamp) / 86400 ))
    
    info "Certificate for $domain expires in $days_until_expiry days"
    
    # Return 0 if renewal needed (< 30 days), 1 if not needed
    if [[ $days_until_expiry -lt 30 ]]; then
        return 0
    else
        return 1
    fi
}

# Install certbot if not present
install_certbot() {
    if command -v certbot &> /dev/null; then
        info "Certbot already installed"
        return 0
    fi
    
    log "Installing Certbot..."
    
    # Update package list
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot
    elif command -v yum &> /dev/null; then
        yum update -y
        yum install -y certbot
    elif command -v apk &> /dev/null; then
        apk add --no-cache certbot
    else
        error "Could not install certbot - unsupported package manager"
        return 1
    fi
    
    log "Certbot installed successfully"
}

# Create or renew certificate
obtain_certificate() {
    local domain="$1"
    local email="$2"
    local webroot="$3"
    
    log "Obtaining/renewing certificate for $domain..."
    
    # Ensure webroot directory exists
    mkdir -p "$webroot"
    
    # Set proper permissions
    chmod 755 "$webroot"
    
    # Check if this is initial certificate or renewal
    if [[ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
        info "Attempting certificate renewal..."
        
        # Renew existing certificate
        if certbot renew \
            --webroot \
            --webroot-path="$webroot" \
            --email="$email" \
            --agree-tos \
            --non-interactive \
            --quiet; then
            
            log "Certificate renewed successfully"
            return 0
        else
            error "Certificate renewal failed"
            return 1
        fi
    else
        info "Obtaining new certificate..."
        
        # Obtain new certificate
        if certbot certonly \
            --webroot \
            --webroot-path="$webroot" \
            --email="$email" \
            --agree-tos \
            --non-interactive \
            --domains="$domain" \
            --domains="www.$domain"; then
            
            log "Certificate obtained successfully"
            return 0
        else
            error "Certificate acquisition failed"
            return 1
        fi
    fi
}

# Test Nginx configuration
test_nginx_config() {
    log "Testing Nginx configuration..."
    
    if docker exec "$NGINX_CONTAINER_NAME" nginx -t; then
        log "Nginx configuration test passed"
        return 0
    else
        error "Nginx configuration test failed"
        return 1
    fi
}

# Reload Nginx to apply new certificates
reload_nginx() {
    log "Reloading Nginx to apply new certificates..."
    
    if docker exec "$NGINX_CONTAINER_NAME" nginx -s reload; then
        log "Nginx reloaded successfully"
        return 0
    else
        error "Failed to reload Nginx"
        return 1
    fi
}

# Restart Docker Compose services if needed
restart_services() {
    log "Restarting Docker Compose services..."
    
    if [[ -f "$COMPOSE_FILE" ]]; then
        local compose_dir
        compose_dir=$(dirname "$COMPOSE_FILE")
        
        cd "$compose_dir"
        
        if docker-compose -f "$(basename "$COMPOSE_FILE")" restart nginx; then
            log "Services restarted successfully"
            return 0
        else
            error "Failed to restart services"
            return 1
        fi
    else
        warn "Docker Compose file not found: $COMPOSE_FILE"
        return 1
    fi
}

# Verify certificate after renewal
verify_certificate() {
    local domain="$1"
    
    log "Verifying certificate for $domain..."
    
    # Test HTTPS connection
    local https_url="https://$domain"
    
    # Wait a moment for services to restart
    sleep 10
    
    if curl -f -s --connect-timeout 30 "$https_url" > /dev/null; then
        log "✅ Certificate verification successful - HTTPS is working"
        return 0
    else
        error "❌ Certificate verification failed - HTTPS not accessible"
        return 1
    fi
}

# Send notification about renewal status
send_notification() {
    local status="$1"
    local message="$2"
    local domain="${3:-$DOMAIN_NAME}"
    
    if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
        local color
        case "$status" in
            "success") color="good" ;;
            "warning") color="warning" ;;
            "error") color="danger" ;;
        esac
        
        # Get certificate expiry information
        local cert_info=""
        if [[ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
            local expire_date
            expire_date=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$domain/fullchain.pem" | cut -d= -f2)
            cert_info="New expiry: $expire_date"
        fi
        
        local payload=$(cat << EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "Auzap SSL Certificate - $status",
            "text": "$message",
            "fields": [
                {
                    "title": "Domain",
                    "value": "$domain",
                    "short": true
                },
                {
                    "title": "Environment",
                    "value": "${NODE_ENV:-production}",
                    "short": true
                },
                {
                    "title": "Certificate Info",
                    "value": "${cert_info:-N/A}",
                    "short": false
                },
                {
                    "title": "Timestamp",
                    "value": "$(date '+%Y-%m-%d %H:%M:%S UTC')",
                    "short": true
                }
            ]
        }
    ]
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$NOTIFICATION_WEBHOOK" &> /dev/null || true
    fi
}

# Create renewal cron job
setup_cron() {
    log "Setting up certificate renewal cron job..."
    
    local cron_file="/etc/cron.d/ssl-renewal"
    local script_path="$0"
    
    # Create cron job that runs twice daily
    cat > "$cron_file" << EOF
# Auzap SSL Certificate Auto-Renewal
# Runs twice daily at 2:30 AM and 2:30 PM
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

30 2,14 * * * root $script_path renew >/dev/null 2>&1
EOF
    
    chmod 644 "$cron_file"
    
    # Reload cron
    if command -v systemctl &> /dev/null; then
        systemctl reload cron || systemctl reload crond || true
    elif command -v service &> /dev/null; then
        service cron reload || service crond reload || true
    fi
    
    log "Cron job configured for automatic renewal"
}

# Main certificate renewal process
main_renewal() {
    log "🔒 Starting SSL certificate renewal process for $DOMAIN_NAME..."
    
    local start_time=$(date +%s)
    
    # Install certbot if needed
    if ! install_certbot; then
        send_notification "error" "Failed to install certbot"
        exit 1
    fi
    
    # Check if renewal is needed
    if ! check_certificate "$DOMAIN_NAME"; then
        info "Certificate renewal not needed yet"
        exit 0
    fi
    
    # Obtain/renew certificate
    if obtain_certificate "$DOMAIN_NAME" "$EMAIL" "$WEBROOT_PATH"; then
        log "Certificate renewal completed"
        
        # Test and reload Nginx
        if test_nginx_config && reload_nginx; then
            log "Nginx configuration updated"
        else
            # If reload fails, try restarting services
            warn "Nginx reload failed, attempting service restart..."
            if restart_services; then
                log "Services restarted successfully"
            else
                error "Failed to apply certificate changes"
                send_notification "error" "Certificate renewed but failed to apply to web server"
                exit 1
            fi
        fi
        
        # Verify the certificate is working
        if verify_certificate "$DOMAIN_NAME"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            
            log "✅ SSL certificate renewal completed successfully in ${duration}s"
            send_notification "success" "SSL certificate renewed and verified successfully"
        else
            warn "Certificate renewed but verification failed"
            send_notification "warning" "SSL certificate renewed but verification failed"
        fi
        
    else
        error "❌ SSL certificate renewal failed!"
        send_notification "error" "SSL certificate renewal failed"
        exit 1
    fi
}

# Initial certificate setup
initial_setup() {
    log "🚀 Setting up SSL certificates for first time..."
    
    # Install certbot
    if ! install_certbot; then
        error "Failed to install certbot"
        exit 1
    fi
    
    # Create webroot directory
    mkdir -p "$WEBROOT_PATH"
    chmod 755 "$WEBROOT_PATH"
    
    # Obtain initial certificate
    if obtain_certificate "$DOMAIN_NAME" "$EMAIL" "$WEBROOT_PATH"; then
        log "Initial certificate obtained successfully"
        
        # Setup auto-renewal cron job
        setup_cron
        
        # Test and reload Nginx
        if test_nginx_config && reload_nginx; then
            log "Nginx configured with SSL"
        else
            restart_services
        fi
        
        # Verify certificate
        verify_certificate "$DOMAIN_NAME"
        
        log "✅ SSL setup completed successfully"
        send_notification "success" "SSL certificate setup completed successfully"
        
    else
        error "❌ Initial certificate setup failed!"
        send_notification "error" "SSL certificate initial setup failed"
        exit 1
    fi
}

# Show certificate information
show_cert_info() {
    local domain="${1:-$DOMAIN_NAME}"
    local cert_path="/etc/letsencrypt/live/$domain/fullchain.pem"
    
    if [[ ! -f "$cert_path" ]]; then
        error "Certificate not found for $domain"
        exit 1
    fi
    
    log "Certificate information for $domain:"
    echo ""
    
    # Show certificate details
    openssl x509 -in "$cert_path" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After :)"
    echo ""
    
    # Show expiration in days
    local expire_date
    expire_date=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
    local expire_timestamp
    expire_timestamp=$(date -d "$expire_date" +%s)
    local current_timestamp
    current_timestamp=$(date +%s)
    local days_until_expiry=$(( (expire_timestamp - current_timestamp) / 86400 ))
    
    if [[ $days_until_expiry -gt 30 ]]; then
        echo -e "${GREEN}✅ Certificate expires in $days_until_expiry days${NC}"
    elif [[ $days_until_expiry -gt 7 ]]; then
        echo -e "${YELLOW}⚠️  Certificate expires in $days_until_expiry days${NC}"
    else
        echo -e "${RED}🚨 Certificate expires in $days_until_expiry days - URGENT RENEWAL NEEDED!${NC}"
    fi
}

# Test certificate renewal (dry run)
test_renewal() {
    log "Testing certificate renewal (dry run)..."
    
    if certbot renew --dry-run --webroot --webroot-path="$WEBROOT_PATH"; then
        log "✅ Dry run successful - renewal should work"
    else
        error "❌ Dry run failed - renewal may not work"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-renew}" in
    "setup")
        initial_setup
        ;;
    "renew")
        main_renewal
        ;;
    "info")
        show_cert_info "${2:-}"
        ;;
    "test")
        test_renewal
        ;;
    "cron")
        setup_cron
        ;;
    "verify")
        verify_certificate "${2:-$DOMAIN_NAME}"
        ;;
    *)
        echo "Usage: $0 {setup|renew|info|test|cron|verify} [domain]"
        echo ""
        echo "Commands:"
        echo "  setup   - Initial SSL certificate setup"
        echo "  renew   - Renew certificate if needed (default)"
        echo "  info    - Show certificate information"
        echo "  test    - Test renewal process (dry run)"
        echo "  cron    - Setup automatic renewal cron job"
        echo "  verify  - Verify certificate is working"
        echo ""
        echo "Environment variables:"
        echo "  DOMAIN_NAME           - Primary domain (default: example.com)"
        echo "  CERT_EMAIL           - Email for Let's Encrypt (default: admin@domain)"
        echo "  WEBROOT_PATH         - Web root for challenges (default: /var/www/certbot)"
        echo "  NGINX_CONTAINER_NAME - Nginx container name (default: auzap-nginx)"
        echo "  NOTIFICATION_WEBHOOK - Webhook for notifications"
        exit 1
        ;;
esac