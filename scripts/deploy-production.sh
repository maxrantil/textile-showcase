#!/bin/bash

# ABOUTME: Production deployment script optimized for VPS memory constraints
# This script builds the application with memory-efficient settings for production deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -f "next.config.mjs" ]]; then
    error "This script must be run from the project root directory"
    exit 1
fi

# Check available memory
AVAILABLE_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $7/1024}')
log "Available memory: ${AVAILABLE_MEMORY}GB"

if [[ "$AVAILABLE_MEMORY" -lt 1 ]]; then
    warn "Low memory detected (${AVAILABLE_MEMORY}GB). Using ultra-conservative build settings."
    MEMORY_SETTING="512"
elif [[ "$AVAILABLE_MEMORY" -lt 2 ]]; then
    log "Limited memory detected (${AVAILABLE_MEMORY}GB). Using production memory settings."
    MEMORY_SETTING="768"
else
    log "Sufficient memory available (${AVAILABLE_MEMORY}GB). Using standard production settings."
    MEMORY_SETTING="768"
fi

# Set environment to production
export NODE_ENV=production

log "Starting production build with ${MEMORY_SETTING}MB memory limit..."

# Clean previous build
if [[ -d ".next" ]]; then
    log "Cleaning previous build..."
    rm -rf .next
fi

# Build with memory-optimized settings
log "Building application..."
if [[ "$MEMORY_SETTING" == "512" ]]; then
    # Ultra-conservative build for very low memory VPS
    NODE_OPTIONS="--max-old-space-size=512 --max-semi-space-size=2 --optimize-for-size" npm run build
else
    # Standard production build
    NODE_OPTIONS="--max-old-space-size=${MEMORY_SETTING}" npm run build
fi

BUILD_EXIT_CODE=$?

if [[ $BUILD_EXIT_CODE -ne 0 ]]; then
    error "Build failed with exit code $BUILD_EXIT_CODE"

    if [[ "$MEMORY_SETTING" != "512" ]]; then
        warn "Retrying with ultra-conservative memory settings..."
        NODE_OPTIONS="--max-old-space-size=512 --max-semi-space-size=2 --optimize-for-size" npm run build
        BUILD_EXIT_CODE=$?
    fi

    if [[ $BUILD_EXIT_CODE -ne 0 ]]; then
        error "Build failed even with conservative settings"
        exit 1
    fi
fi

# Verify build output
if [[ ! -d ".next" ]]; then
    error "Build completed but .next directory not found"
    exit 1
fi

# Check build size
BUILD_SIZE=$(du -sh .next | cut -f1)
log "Build size: $BUILD_SIZE"

# Optional: Run production tests if available
if command -v npm run test:production >/dev/null 2>&1; then
    log "Running production tests..."
    npm run test:production || warn "Production tests failed"
fi

success "Production build completed successfully!"
success "Build size: $BUILD_SIZE"
success "Memory used: ${MEMORY_SETTING}MB"

log "Ready for deployment. Next steps:"
log "  1. Start the production server with: npm start"
log "  2. Or copy .next directory to your deployment target"
