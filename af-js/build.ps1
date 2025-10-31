# Alien Frontiers - Build Script
# Run this script to build the game

Write-Host "Building Alien Frontiers..." -ForegroundColor Cyan
Write-Host ""

# Set Node options for legacy OpenSSL
$env:NODE_OPTIONS = '--openssl-legacy-provider'

# Navigate to project directory
Set-Location "s:\Dev\AlienFrontiers\af-js"

Write-Host "Running webpack build..." -ForegroundColor Yellow
Write-Host ""

# Run webpack
npx webpack

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! ✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "To play the game:" -ForegroundColor Cyan
    Write-Host "  Open: s:\Dev\AlienFrontiers\af-js\dist\index.html" -ForegroundColor White
    Write-Host ""
    Write-Host "Or start the dev server:" -ForegroundColor Cyan
    Write-Host "  .\start-dev-server.ps1" -ForegroundColor White
} else {
    Write-Host "Build failed! ❌" -ForegroundColor Red
    Write-Host "Check the errors above for details." -ForegroundColor Yellow
}
