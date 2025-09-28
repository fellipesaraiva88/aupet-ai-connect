#!/bin/bash

# DigitalOcean Droplet Setup Script for Auzap AI Connect
# This script sets up a DigitalOcean Droplet for running the application

set -euo pipefail

# Configuration
APP_USER="auzap"
APP_DIR="/opt/auzap"
NGINX_USER="www-data"
DOMAIN_NAME="${DOMAIN_NAME:-auzap-ai.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

log "Starting DigitalOcean Droplet setup for Auzap AI Connect..."

# Update system
log "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install essential packages
log "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    nano \
    vim \
    fail2ban \
    ufw \
    logrotate \
    cron \
    certbot \
    python3-certbot-nginx

# Install Docker
log "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Install Docker Compose (standalone)
log "Installing Docker Compose..."
DOCKER_COMPOSE_VERSION="v2.23.0"
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js (for local development)
log "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Create application user
log "Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$APP_DIR" -m "$APP_USER"
    usermod -aG docker "$APP_USER"
fi

# Create application directories
log "Creating application directories..."
mkdir -p "$APP_DIR"/{data,logs,backups,cache,uploads,config}
mkdir -p "$APP_DIR"/data/{postgres,redis,prometheus,grafana,loki}
mkdir -p "$APP_DIR"/logs/{backend,nginx}
mkdir -p "$APP_DIR"/backups/postgres
mkdir -p "$APP_DIR"/cache/nginx

# Set proper permissions
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod -R 755 "$APP_DIR"

# Configure Docker daemon
log "Configuring Docker daemon..."
cat > /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "storage-opts": [
        "overlay2.override_kernel_check=true"
    ]
}
EOF

systemctl restart docker
systemctl enable docker

# Configure firewall
log "Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow custom ports for monitoring (restricted)
ufw allow from 10.0.0.0/8 to any port 3000  # Grafana
ufw allow from 172.16.0.0/12 to any port 9090  # Prometheus

ufw --force enable

# Configure fail2ban
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /opt/auzap/logs/nginx/error.log
maxretry = 3

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
port = http,https
logpath = /opt/auzap/logs/nginx/error.log
maxretry = 5
bantime = 600
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Configure log rotation
log "Configuring log rotation..."
cat > /etc/logrotate.d/auzap << EOF
/opt/auzap/logs/*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        /usr/bin/docker-compose -f /opt/auzap/docker-compose.do.yml exec nginx nginx -s reload > /dev/null 2>&1 || true
    endscript
}

/opt/auzap/backups/postgres/*.sql {
    weekly
    missingok
    rotate 8
    compress
    delaycompress
    notifempty
}
EOF

# Create SSL directory
log "Creating SSL certificate directory..."
mkdir -p /etc/nginx/ssl
openssl dhparam -out /etc/nginx/dhparam.pem 2048

# Configure automatic security updates
log "Configuring automatic security updates..."
apt-get install -y unattended-upgrades
cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

# Configure system limits
log "Configuring system limits..."
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

# Configure sysctl for better performance
log "Configuring sysctl parameters..."
cat >> /etc/sysctl.conf << EOF

# Auzap AI Connect optimizations
vm.max_map_count=262144
vm.swappiness=10
net.core.somaxconn=32768
net.ipv4.tcp_max_syn_backlog=32768
net.core.netdev_max_backlog=32768
net.ipv4.tcp_congestion_control=bbr
EOF

sysctl -p

# Install monitoring tools
log "Installing monitoring tools..."
apt-get install -y \
    netdata \
    iotop \
    nethogs \
    dstat \
    ncdu

# Configure NetData
systemctl enable netdata
systemctl start netdata

# Create environment file template
log "Creating environment template..."
cat > "$APP_DIR"/.env.template << EOF
# Copy this to .env and fill in your actual values

# Domain configuration
DOMAIN_NAME=$DOMAIN_NAME

# Database configuration
POSTGRES_DB=auzap_production
POSTGRES_USER=auzap_user
POSTGRES_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}

# Application secrets
JWT_SECRET=CHANGE_THIS_STRONG_JWT_SECRET

# External API keys
OPENAI_API_KEY=your_openai_api_key_here
EVOLUTION_API_URL=https://your-evolution-api-url.com
EVOLUTION_API_KEY=your_evolution_api_key_here

# DigitalOcean Spaces (S3-compatible storage)
SPACES_KEY=your_spaces_access_key
SPACES_SECRET=your_spaces_secret_key
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_BUCKET=auzap-uploads

# Monitoring (optional)
DATADOG_API_KEY=your_datadog_api_key
LOGTAIL_SOURCE_TOKEN=your_logtail_token
GRAFANA_ADMIN_PASSWORD=CHANGE_THIS_STRONG_GRAFANA_PASSWORD
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR"/.env.template

# Create maintenance scripts
log "Creating maintenance scripts..."

# Backup script
cat > "$APP_DIR"/backup.sh << 'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/auzap/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/auzap_backup_$DATE.sql"
RETENTION_DAYS=7

# Create backup
docker-compose -f /opt/auzap/docker-compose.do.yml exec -T postgres pg_dump -U ${POSTGRES_USER:-auzap_user} ${POSTGRES_DB:-auzap_production} > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Remove old backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x "$APP_DIR"/backup.sh
chown "$APP_USER:$APP_USER" "$APP_DIR"/backup.sh

# Health check script
cat > "$APP_DIR"/health-check.sh << 'EOF'
#!/bin/bash

check_service() {
    local service=$1
    local url=$2
    local expected_code=${3:-200}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" = "$expected_code" ]; then
        echo "✓ $service is healthy"
        return 0
    else
        echo "✗ $service is unhealthy (HTTP $response)"
        return 1
    fi
}

echo "Checking application health..."

check_service "Backend API" "http://localhost:3001/health"
check_service "Nginx" "http://localhost/health"
check_service "Prometheus" "http://localhost:9090/-/healthy"
check_service "Grafana" "http://localhost:3000/api/health"

echo "Health check completed."
EOF

chmod +x "$APP_DIR"/health-check.sh
chown "$APP_USER:$APP_USER" "$APP_DIR"/health-check.sh

# Add cron jobs
log "Setting up cron jobs..."
crontab -u "$APP_USER" << EOF
# Backup database daily at 2 AM
0 2 * * * /opt/auzap/backup.sh >> /opt/auzap/logs/backup.log 2>&1

# Health check every 15 minutes
*/15 * * * * /opt/auzap/health-check.sh >> /opt/auzap/logs/health.log 2>&1

# Renew SSL certificates (runs twice daily, only renews if needed)
0 2,14 * * * /usr/bin/certbot renew --quiet --nginx >> /opt/auzap/logs/certbot.log 2>&1
EOF

# Display final instructions
log "Setup completed successfully!"

info "Next steps:"
echo "1. Copy your application code to $APP_DIR"
echo "2. Copy the DigitalOcean configuration files to $APP_DIR"
echo "3. Create $APP_DIR/.env from the template and fill in your secrets"
echo "4. Obtain SSL certificates: certbot --nginx -d $DOMAIN_NAME"
echo "5. Start the application: docker-compose -f $APP_DIR/docker-compose.do.yml up -d"
echo ""

info "Important files and directories:"
echo "- Application directory: $APP_DIR"
echo "- Environment template: $APP_DIR/.env.template" 
echo "- Logs: $APP_DIR/logs/"
echo "- Backups: $APP_DIR/backups/"
echo "- Health check: $APP_USER/health-check.sh"
echo "- Backup script: $APP_DIR/backup.sh"
echo ""

info "Services and ports:"
echo "- Application: https://$DOMAIN_NAME"
echo "- Grafana: http://$DOMAIN_NAME:3000 (internal only)"
echo "- Prometheus: http://$DOMAIN_NAME:9090 (internal only)"
echo "- NetData: http://$DOMAIN_NAME:19999 (internal only)"
echo ""

warn "Remember to:"
echo "- Configure your DNS records to point $DOMAIN_NAME to this server"
echo "- Update the firewall rules if you need additional ports"
echo "- Regularly check logs in $APP_DIR/logs/"
echo "- Monitor disk space and system resources"

log "Droplet setup completed! 🚀"