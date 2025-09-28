#!/bin/bash

# Auzap Production Setup Script
# This script helps configure environment variables and deploy the application

set -e

echo "🚀 Auzap Production Setup Script"
echo "================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Check if running in CI environment
if [ "$CI" = "true" ]; then
    print_status "Running in CI environment"
    NON_INTERACTIVE=true
else
    NON_INTERACTIVE=false
fi

# Function to prompt for input (skip in CI)
prompt_input() {
    local var_name=$1
    local prompt_text=$2
    local is_secret=${3:-false}

    if [ "$NON_INTERACTIVE" = "true" ]; then
        print_warning "Skipping interactive prompt for $var_name in CI mode"
        return
    fi

    if [ "$is_secret" = "true" ]; then
        echo -n "$prompt_text: "
        read -s value
        echo
    else
        read -p "$prompt_text: " value
    fi

    if [ -n "$value" ]; then
        export $var_name="$value"
        echo "export $var_name=\"$value\"" >> .env.production
    fi
}

# Create production environment file
print_header "Setting up production environment variables"

if [ -f ".env.production" ]; then
    print_warning ".env.production already exists. Backing up..."
    cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
fi

# Start with template
cp .env.production.template .env.production

print_status "Environment template created. Please configure the following variables:"

# Database Configuration
print_header "Database Configuration (Supabase)"
prompt_input "SUPABASE_URL" "Supabase Project URL"
prompt_input "SUPABASE_ANON_KEY" "Supabase Anon Key" true
prompt_input "SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key" true

# Security Configuration
print_header "Security Configuration"
if [ "$NON_INTERACTIVE" = "false" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo "export JWT_SECRET=\"$JWT_SECRET\"" >> .env.production
    print_status "Generated JWT secret automatically"

    SESSION_SECRET=$(openssl rand -hex 32)
    echo "export SESSION_SECRET=\"$SESSION_SECRET\"" >> .env.production
    print_status "Generated session secret automatically"
fi

# AI Services
print_header "AI Services Configuration"
prompt_input "OPENAI_API_KEY" "OpenAI API Key" true
prompt_input "GEMINI_API_KEY" "Google Gemini API Key" true

# Monitoring and Notifications
print_header "Monitoring Configuration (Optional)"
prompt_input "SLACK_WEBHOOK_URL" "Slack Webhook URL for notifications"
prompt_input "SENTRY_DSN" "Sentry DSN for error tracking"

# Build and deploy information
print_header "Build Information"
echo "export BUILD_DATE=\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" >> .env.production
echo "export BUILD_COMMIT=\"$(git rev-parse HEAD 2>/dev/null || echo 'unknown')\"" >> .env.production
echo "export BUILD_BRANCH=\"$(git branch --show-current 2>/dev/null || echo 'unknown')\"" >> .env.production

print_status "Environment configuration completed!"

# Validate environment
print_header "Validating environment configuration"

# Check required variables
required_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^export $var=" .env.production || grep -q "^export $var=\"your_" .env.production; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    print_warning "Please update .env.production with the correct values"
    exit 1
fi

print_status "Environment validation passed!"

# Setup GitHub secrets (if running locally)
if [ "$NON_INTERACTIVE" = "false" ] && command -v gh &> /dev/null; then
    print_header "GitHub Secrets Setup"
    read -p "Do you want to set up GitHub secrets for CI/CD? (y/n): " setup_secrets

    if [ "$setup_secrets" = "y" ] || [ "$setup_secrets" = "Y" ]; then
        print_status "Setting up GitHub secrets..."

        # Read secrets from .env.production and set them in GitHub
        while IFS= read -r line; do
            if [[ $line =~ ^export\ ([^=]+)=\"(.*)\"$ ]]; then
                var_name="${BASH_REMATCH[1]}"
                var_value="${BASH_REMATCH[2]}"

                # Skip non-secret variables
                if [[ $var_name =~ ^(NODE_ENV|PORT|FRONTEND_URL|WEBHOOK_URL|LOG_LEVEL|BUILD_).*$ ]]; then
                    continue
                fi

                print_status "Setting secret: $var_name"
                echo "$var_value" | gh secret set "$var_name" || print_warning "Failed to set secret: $var_name"
            fi
        done < .env.production

        print_status "GitHub secrets setup completed!"
    fi
fi

# Build verification
print_header "Build Verification"
print_status "Testing backend build..."
cd backend
npm ci --only=production
npm run build
cd ..

print_status "Testing frontend build..."
cd frontend
npm ci
VITE_API_URL=https://auzap-backend-api.onrender.com/api npm run build
cd ..

print_status "Build verification completed!"

# Summary
print_header "Setup Summary"
echo "✅ Environment variables configured"
echo "✅ Build verification passed"
echo "✅ Ready for production deployment"
echo ""
echo "Next steps:"
echo "1. Review .env.production and update any remaining placeholder values"
echo "2. Commit your changes (excluding .env.production)"
echo "3. Push to trigger automatic deployment"
echo "4. Monitor deployment in GitHub Actions"
echo ""
echo "Useful commands:"
echo "  - View logs: render logs <service-id>"
echo "  - Manual deploy: gh workflow run deploy-production.yml"
echo "  - Emergency rollback: gh workflow run rollback.yml"

print_status "Production setup completed successfully! 🎉"