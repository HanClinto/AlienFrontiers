# Simple HTTP Server for Alien Frontiers
# Run this to serve the game over HTTP (avoids CORS issues with file://)

Write-Host "Starting HTTP server for Alien Frontiers..." -ForegroundColor Cyan
Write-Host "Server will run at: http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Navigate to dist folder
Set-Location "s:\Dev\AlienFrontiers\af-js\dist"

# Start Python HTTP server
# Try Python 3 first, then Python 2
try {
    python -m http.server 8080
} catch {
    python -m SimpleHTTPServer 8080
}
