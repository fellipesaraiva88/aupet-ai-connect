#!/bin/bash

# Auzap AI Connect - Database Backup Script
# Automated PostgreSQL backup with rotation and DigitalOcean Spaces upload

set -euo pipefail

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-auzap}"
POSTGRES_USER="${POSTGRES_USER:-auzap}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
BACKUP_RETENTION_WEEKLY="${BACKUP_RETENTION_WEEKLY:-4}"
BACKUP_RETENTION_MONTHLY="${BACKUP_RETENTION_MONTHLY:-12}"

# DigitalOcean Spaces Configuration (optional)
SPACES_KEY="${SPACES_KEY:-}"
SPACES_SECRET="${SPACES_SECRET:-}"
SPACES_ENDPOINT="${SPACES_ENDPOINT:-nyc3.digitaloceanspaces.com}"
SPACES_BUCKET="${SPACES_BUCKET:-auzap-backups}"
SPACES_REGION="${SPACES_REGION:-nyc3}"

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

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAILY_BACKUP_FILE="$BACKUP_DIR/daily/auzap_backup_${TIMESTAMP}.sql"
DAILY_BACKUP_COMPRESSED="$BACKUP_DIR/daily/auzap_backup_${TIMESTAMP}.sql.gz"

# Backup function
create_backup() {
    log "Starting database backup..."
    
    # Set password for pg_dump
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # Create the backup
    if pg_dump -h "$POSTGRES_HOST" \
               -p "$POSTGRES_PORT" \
               -U "$POSTGRES_USER" \
               -d "$POSTGRES_DB" \
               --no-password \
               --verbose \
               --clean \
               --if-exists \
               --create \
               --format=plain > "$DAILY_BACKUP_FILE"; then
        
        log "Database dump completed successfully"
        
        # Compress the backup
        if gzip "$DAILY_BACKUP_FILE"; then
            log "Backup compressed: $DAILY_BACKUP_COMPRESSED"
        else
            error "Failed to compress backup file"
            return 1
        fi
        
    else
        error "Database backup failed!"
        return 1
    fi
    
    # Verify backup integrity
    if verify_backup "$DAILY_BACKUP_COMPRESSED"; then
        log "Backup verification successful"
    else
        error "Backup verification failed!"
        return 1
    fi
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$DAILY_BACKUP_COMPRESSED" | cut -f1)
    log "Backup size: $BACKUP_SIZE"
    
    return 0
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    info "Verifying backup integrity..."
    
    # Check if file exists and is not empty
    if [[ ! -f "$backup_file" ]] || [[ ! -s "$backup_file" ]]; then
        error "Backup file does not exist or is empty"
        return 1
    fi
    
    # Test gzip integrity
    if ! gzip -t "$backup_file" &> /dev/null; then
        error "Backup file is corrupted (gzip test failed)"
        return 1
    fi
    
    # Check if backup contains expected SQL content
    if ! zcat "$backup_file" | head -n 20 | grep -q "PostgreSQL database dump"; then
        error "Backup file does not appear to be a valid PostgreSQL dump"
        return 1
    fi
    
    return 0
}

# Upload to DigitalOcean Spaces
upload_to_spaces() {
    local backup_file="$1"
    local backup_name=$(basename "$backup_file")
    
    if [[ -z "$SPACES_KEY" ]] || [[ -z "$SPACES_SECRET" ]]; then
        warn "DigitalOcean Spaces credentials not configured, skipping upload"
        return 0
    fi
    
    log "Uploading backup to DigitalOcean Spaces..."
    
    # Install s3cmd if not present
    if ! command -v s3cmd &> /dev/null; then
        info "Installing s3cmd..."
        if command -v apk &> /dev/null; then
            apk add --no-cache py3-pip
            pip3 install s3cmd
        elif command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y s3cmd
        else
            warn "Could not install s3cmd, skipping upload"
            return 1
        fi
    fi
    
    # Create s3cmd config
    cat > /tmp/s3cfg << EOF
[default]
access_key = $SPACES_KEY
secret_key = $SPACES_SECRET
host_base = $SPACES_ENDPOINT
host_bucket = %(bucket)s.$SPACES_ENDPOINT
bucket_location = $SPACES_REGION
use_https = True
signature_v2 = False
EOF
    
    # Upload the backup
    local spaces_path="backups/$(date +%Y/%m/%d)/$backup_name"
    
    if s3cmd -c /tmp/s3cfg put "$backup_file" "s3://$SPACES_BUCKET/$spaces_path"; then
        log "Backup uploaded to Spaces: s3://$SPACES_BUCKET/$spaces_path"
        
        # Create a "latest" symlink
        s3cmd -c /tmp/s3cfg put "$backup_file" "s3://$SPACES_BUCKET/backups/latest.sql.gz" || true
        
    else
        error "Failed to upload backup to Spaces"
        return 1
    fi
    
    # Clean up config file
    rm -f /tmp/s3cfg
}

# Rotate daily backups
rotate_daily_backups() {
    log "Rotating daily backups (keeping $BACKUP_RETENTION_DAYS days)..."
    
    find "$BACKUP_DIR/daily" -name "auzap_backup_*.sql.gz" -type f -mtime +$BACKUP_RETENTION_DAYS -delete
    
    local remaining_count=$(find "$BACKUP_DIR/daily" -name "auzap_backup_*.sql.gz" -type f | wc -l)
    info "Daily backups remaining: $remaining_count"
}

# Create weekly backup (every Sunday)
create_weekly_backup() {
    if [[ $(date +%u) -eq 7 ]]; then  # Sunday
        log "Creating weekly backup..."
        
        local weekly_backup="$BACKUP_DIR/weekly/auzap_weekly_$(date +%Y%m%d).sql.gz"
        
        if [[ -f "$DAILY_BACKUP_COMPRESSED" ]]; then
            cp "$DAILY_BACKUP_COMPRESSED" "$weekly_backup"
            log "Weekly backup created: $weekly_backup"
        else
            warn "No daily backup found to copy to weekly"
        fi
    fi
}

# Create monthly backup (first day of month)
create_monthly_backup() {
    if [[ $(date +%d) -eq 01 ]]; then  # First day of month
        log "Creating monthly backup..."
        
        local monthly_backup="$BACKUP_DIR/monthly/auzap_monthly_$(date +%Y%m).sql.gz"
        
        if [[ -f "$DAILY_BACKUP_COMPRESSED" ]]; then
            cp "$DAILY_BACKUP_COMPRESSED" "$monthly_backup"
            log "Monthly backup created: $monthly_backup"
        else
            warn "No daily backup found to copy to monthly"
        fi
    fi
}

# Rotate weekly backups
rotate_weekly_backups() {
    log "Rotating weekly backups (keeping $BACKUP_RETENTION_WEEKLY weeks)..."
    
    find "$BACKUP_DIR/weekly" -name "auzap_weekly_*.sql.gz" -type f -mtime +$((BACKUP_RETENTION_WEEKLY * 7)) -delete
    
    local remaining_count=$(find "$BACKUP_DIR/weekly" -name "auzap_weekly_*.sql.gz" -type f | wc -l)
    info "Weekly backups remaining: $remaining_count"
}

# Rotate monthly backups
rotate_monthly_backups() {
    log "Rotating monthly backups (keeping $BACKUP_RETENTION_MONTHLY months)..."
    
    find "$BACKUP_DIR/monthly" -name "auzap_monthly_*.sql.gz" -type f -mtime +$((BACKUP_RETENTION_MONTHLY * 30)) -delete
    
    local remaining_count=$(find "$BACKUP_DIR/monthly" -name "auzap_monthly_*.sql.gz" -type f | wc -l)
    info "Monthly backups remaining: $remaining_count"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    local backup_size="${3:-}"
    
    if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
        local color
        case "$status" in
            "success") color="good" ;;
            "warning") color="warning" ;;
            "error") color="danger" ;;
        esac
        
        local payload=$(cat << EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "Auzap Database Backup - $status",
            "text": "$message",
            "fields": [
                {
                    "title": "Environment",
                    "value": "${NODE_ENV:-production}",
                    "short": true
                },
                {
                    "title": "Database",
                    "value": "$POSTGRES_DB@$POSTGRES_HOST",
                    "short": true
                },
                {
                    "title": "Backup Size",
                    "value": "${backup_size:-N/A}",
                    "short": true
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

# Health check function
health_check() {
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    if pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB"; then
        return 0
    else
        error "Database is not available"
        return 1
    fi
}

# Main backup process
main() {
    log "🚀 Starting Auzap database backup process..."
    
    local start_time=$(date +%s)
    
    # Health check
    if ! health_check; then
        send_notification "error" "Database health check failed"
        exit 1
    fi
    
    # Create backup
    if create_backup; then
        local backup_size=$(du -h "$DAILY_BACKUP_COMPRESSED" | cut -f1)
        log "✅ Backup created successfully: $DAILY_BACKUP_COMPRESSED ($backup_size)"
        
        # Upload to Spaces
        if upload_to_spaces "$DAILY_BACKUP_COMPRESSED"; then
            log "☁️ Backup uploaded to DigitalOcean Spaces"
        fi
        
        # Create weekly/monthly backups if needed
        create_weekly_backup
        create_monthly_backup
        
        # Rotate old backups
        rotate_daily_backups
        rotate_weekly_backups
        rotate_monthly_backups
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log "✅ Backup process completed successfully in ${duration}s"
        send_notification "success" "Database backup completed successfully" "$backup_size"
        
    else
        error "❌ Backup process failed!"
        send_notification "error" "Database backup failed"
        exit 1
    fi
    
    # Show backup summary
    info "=== Backup Summary ==="
    info "Daily backups: $(find "$BACKUP_DIR/daily" -name "*.sql.gz" -type f | wc -l)"
    info "Weekly backups: $(find "$BACKUP_DIR/weekly" -name "*.sql.gz" -type f | wc -l)"
    info "Monthly backups: $(find "$BACKUP_DIR/monthly" -name "*.sql.gz" -type f | wc -l)"
    info "Total disk usage: $(du -sh "$BACKUP_DIR" | cut -f1)"
}

# Handle different command line arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "health")
        health_check
        ;;
    "test")
        log "Testing backup configuration..."
        health_check && log "✅ Database connection successful"
        ;;
    "restore")
        if [[ -z "${2:-}" ]]; then
            error "Usage: $0 restore <backup_file>"
            exit 1
        fi
        
        log "Restoring from backup: $2"
        export PGPASSWORD="$POSTGRES_PASSWORD"
        
        if zcat "$2" | psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB"; then
            log "✅ Database restored successfully"
        else
            error "❌ Database restoration failed"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 {backup|health|test|restore <backup_file>}"
        echo ""
        echo "Commands:"
        echo "  backup  - Create a new backup (default)"
        echo "  health  - Check database connection"
        echo "  test    - Test backup configuration"
        echo "  restore - Restore from backup file"
        exit 1
        ;;
esac