# Development server startup script
$env:NODE_ENV = "development"

Write-Host "Starting development server..."
Write-Host ""

# Try to load .env file manually (if accessible)
try {
    if (Test-Path .env) {
        $envContent = Get-Content .env -ErrorAction SilentlyContinue
        if ($envContent) {
            foreach ($line in $envContent) {
                if ($line -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
                    $key = $matches[1].Trim()
                    $value = $matches[2].Trim() -replace '^["\']|["\']$', ''
                    if ($key -and $value) {
                        [Environment]::SetEnvironmentVariable($key, $value, "Process")
                    }
                }
            }
            Write-Host "✅ Loaded .env file"
        }
    }
} catch {
    Write-Host "⚠️  Could not read .env file (may use defaults)"
}

# Set defaults if not in .env
if (-not $env:SESSION_SECRET) {
    $env:SESSION_SECRET = "temp-secret-key-for-development-12345"
}

# Check storage mode
if ($env:DATABASE_URL) {
    Write-Host "✅ DATABASE_URL found - will use PostgreSQL database"
} else {
    Write-Host "⚠️  No DATABASE_URL - will use in-memory storage"
}

Write-Host ""
Write-Host "🌐 Server will be available at: http://localhost:5000"
Write-Host ""

# Start server
npx tsx server/index.ts

