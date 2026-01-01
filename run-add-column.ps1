# PowerShell script to add text_notifications column
# Run this from the DentureFlowPro directory

Write-Host "🔧 Adding text_notifications column to patients table..." -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ DATABASE_URL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set it first:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL = "your-database-url-here"' -ForegroundColor White
    Write-Host ""
    Write-Host "Get it from Railway:" -ForegroundColor Yellow
    Write-Host "  1. Go to Railway → Postgres service → Variables" -ForegroundColor White
    Write-Host "  2. Copy the DATABASE_PUBLIC_URL value (for local scripts)" -ForegroundColor White
    Write-Host "     (Or DATABASE_URL if running from Railway Shell)" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "🔗 Connecting to database..." -ForegroundColor Cyan

# Run the Node.js script
node add-text-notifications.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Success! Column added." -ForegroundColor Green
    Write-Host "   Railway should auto-redeploy now." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Failed to add column. Check the error above." -ForegroundColor Red
}
