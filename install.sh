#!/usr/bin/env bash
# ==============================================================================
# @Synchronous-IT Network Dashboard - Linux Installer Script
# ==============================================================================
# This script installs Node.js, installs dependencies, builds the application,
# and configures a systemd service to run the SD-WAN Dashboard as a background daemon.
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/.../install.sh | bash
#   or locally: chmod +x install.sh && ./install.sh
# ==============================================================================

set -euo pipefail

# Style definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${CYAN}"
echo "======================================================================"
echo "    @Synchronous-IT Enterprise SD-WAN Network Dashboard Installer     "
echo "======================================================================"
echo -e "${NC}"

# 1. Check if running as root
IS_ROOT=false
if [ "$EUID" -eq 0 ]; then
    IS_ROOT=true
fi

# 2. Check dependencies
log_info "Checking system requirements..."

# Check curl / wget
if ! command -v curl &> /dev/null && ! command -v wget &> /dev/null; then
    log_error "This installer requires curl or wget. Please install one of them first."
    exit 1
fi

# Check/Install Node.js
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    log_warn "Node.js or npm is missing. Attempting to install..."
    if [ "$IS_ROOT" = "false" ]; then
        log_error "Root privileges are required to install Node.js automatically. Run with sudo or install Node.js (v18+) manually."
        exit 1
    fi
    
    # Install Node.js v18/v20 based on distro
    if [ -f /etc/debian_version ]; then
        log_info "Debian/Ubuntu detected. Installing Node.js LTS via NodeSource..."
        apt-get update -y && apt-get install -y curl gnupg
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    elif [ -f /etc/redhat-release ]; then
        log_info "RHEL/CentOS/Fedora detected. Installing Node.js LTS..."
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
    else
        log_error "Unsupported Linux distribution. Please install Node.js (v18+) manually and re-run."
        exit 1
    fi
fi

# Verify Node version
NODE_VER=$(node -v | cut -d'v' -f2)
log_success "Found Node.js v$NODE_VER"

# 3. Handle directory structure
INSTALL_DIR=$(pwd)

# Check if package.json exists in current folder, otherwise guide the user
if [ ! -f "package.json" ]; then
    log_error "package.json was not found in the current directory (${INSTALL_DIR})."
    echo ""
    echo -e "${YELLOW}HOW TO FIX THIS:${NC}"
    echo "This installation script must be run inside the project's extracted root folder."
    echo ""
    echo "Please follow these simple steps to install the dashboard:"
    echo "  1. Export/download the project source code as a ZIP file from the AI Studio Settings menu."
    echo "  2. Extract the downloaded ZIP file on your Ubuntu Virtual Machine:"
    echo "     unzip -q -o be9cb3b3-06a2-42df-9ba4-cd3e9c305902.zip -d synchronous-it-dashboard"
    echo "  3. Navigate into the newly created project folder:"
    echo "     cd synchronous-it-dashboard"
    echo "  4. Execute the installer script from inside that directory:"
    echo "     ./install.sh"
    echo ""
    echo "Or run the one-liner command directly inside that directory!"
    echo ""
    exit 1
fi

log_info "Installing dashboard assets in: ${INSTALL_DIR}"

# 4. Install npm packages
log_info "Installing dependencies (this may take a minute)..."
npm install --no-audit --no-fund

# 5. Build application
log_info "Compiling assets and server binary..."
npm run build

# 6. Prompt to create systemd service if running as root
if [ "$IS_ROOT" = "true" ]; then
    log_info "Creating systemd background service..."
    
    SERVICE_PATH="/etc/systemd/system/synchronous-it-dashboard.service"
    CURRENT_USER=${SUDO_USER:-root}
    
    cat <<EOF > "$SERVICE_PATH"
[Unit]
Description=@Synchronous-IT Enterprise Network Dashboard Controller
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which node) dist/server.cjs
Restart=always
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target
EOF

    log_info "Reloading systemd daemon..."
    systemctl daemon-reload
    
    log_info "Enabling and starting service..."
    systemctl enable synchronous-it-dashboard.service
    systemctl start synchronous-it-dashboard.service
    
    log_success "Systemd service successfully set up and started!"
    log_info "Check logs using: journalctl -u synchronous-it-dashboard.service -f"
else
    log_warn "Not running as root. Skipping automatic systemd service creation."
    log_info "You can start the production controller manually with: npm start"
fi

echo -e "${GREEN}"
echo "======================================================================"
echo "    @Synchronous-IT Network Dashboard Installed Successfully!        "
echo "======================================================================"
echo -e "${NC}"
log_success "The application is now accessible on http://localhost:3000"
log_info "Note: Set your GEMINI_API_KEY environment variable in your system shell or a .env file to enable the NetOps Diagnostic Assistant."
echo ""
