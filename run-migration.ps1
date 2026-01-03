# PowerShell script to get DATABASE_URL from Railway and run the migration
Write-Host "🔍 Getting DATABASE_URL from Railway..." -ForegroundColor Cyan

# Get DATABASE_URL from Railway (this will prompt for service if multiple)
$dbUrl = railway variables --service Postgres --json | ConvertFrom-Json | Where-Object { $_.name -eq "DATABASE_URL" | Select-Object -ExpandProperty value

if (-not $dbUrl) {
    Write-Host "❌ Could not get DATABASE_URL from Railway" -ForegroundColor Red
    Write-Host "Please run manually:" -ForegroundColor Yellow
    Write-Host "  1. Get DATABASE_URL from Railway → Postgres → Variables tab" -ForegroundColor Yellow
    Write-Host "  2. Run: `$env:DATABASE_URL='your-url'; node add-case-type-columns.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Got DATABASE_URL" -ForegroundColor Green
Write-Host "🚀 Running migration..." -ForegroundColor Cyan
Write-Host ""

$env:DATABASE_URL = $dbUrl
node add-case-type-columns.js
