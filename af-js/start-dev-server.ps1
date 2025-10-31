# Alien Frontiers - Dev Server Launcher
# Run this script to start the development server

Write-Host "Starting Alien Frontiers Development Server..." -ForegroundColor Cyan
Write-Host ""

# Set Node options for legacy OpenSSL
$env:NODE_OPTIONS = '--openssl-legacy-provider'

# Navigate to project directory
Set-Location "s:\Dev\AlienFrontiers\af-js"

Write-Host "Building and starting server..." -ForegroundColor Yellow
Write-Host ""

# Start webpack dev server
npx webpack-dev-server --open

Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
