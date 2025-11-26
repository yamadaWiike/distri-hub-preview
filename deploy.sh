#!/bin/bash

# Baskit Distributor Hub - Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Baskit Distributor Hub - Deployment Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v18 or higher.${NC}"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher. Current: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠ PM2 not found. Installing PM2 globally...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 $(pm2 -v) detected${NC}"
fi

# Check if serve is installed (optional alternative to PM2)
if ! command -v serve &> /dev/null; then
    echo -e "${YELLOW}⚠ serve not found (optional). To install: npm install -g serve${NC}"
else
    echo -e "${GREEN}✓ serve $(serve --version) detected${NC}"
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    echo "📁 Creating logs directory..."
    mkdir -p logs
    echo -e "${GREEN}✓ Logs directory created${NC}"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "Please create .env file with the following variables:"
    echo "  VITE_SUPABASE_URL"
    echo "  VITE_SUPABASE_ANON_KEY"
    echo "  VITE_AWS_ACCESS_KEY_ID"
    echo "  VITE_AWS_SECRET_ACCESS_KEY"
    echo "  VITE_AWS_REGION"
    echo "  VITE_AWS_BUCKET_NAME"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env file found${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build the application
echo ""
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed${NC}"

# Ask for deployment type
echo ""
echo "Select deployment option:"
echo "1) Fresh start (delete existing PM2 process and start new)"
echo "2) Restart (restart existing PM2 process)"
echo "3) Start (start new PM2 process)"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🔄 Fresh deployment..."
        pm2 delete baskit-distributor-hub 2>/dev/null || true
        pm2 start ecosystem.config.cjs --env production
        ;;
    2)
        echo ""
        echo "🔄 Restarting application..."
        pm2 restart baskit-distributor-hub
        ;;
    3)
        echo ""
        echo "▶️  Starting application..."
        pm2 start ecosystem.config.cjs --env production
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Save PM2 configuration
echo ""
echo "💾 Saving PM2 configuration..."
pm2 save

# Ask about PM2 startup
echo ""
read -p "Configure PM2 to start on system boot? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Setting up PM2 startup script..."
    pm2 startup
    echo ""
    echo -e "${YELLOW}⚠ Please run the command shown above (if any) with sudo${NC}"
fi

# Show status
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Application is running at:"
echo "  - Local: http://localhost:8081"
echo "  - Network: http://0.0.0.0:8081"
echo ""
echo "Useful commands:"
echo "  npm run pm2:status    - View status"
echo "  npm run pm2:logs      - View logs"
echo "  npm run pm2:monit     - Monitor application"
echo "  npm run pm2:restart   - Restart application"
echo "  npm run pm2:stop      - Stop application"
echo ""
echo "For more information, see DEPLOYMENT.md"
