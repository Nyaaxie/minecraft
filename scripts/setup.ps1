# StrawberrySMP Setup Script

This script automates the setup process for new developers or client environments.

```powershell
# Run this script using PowerShell: .\scripts\setup.ps1

Write-Host "--- StrawberrySMP Setup ---" -ForegroundColor Green
Write-Host "1. Installing dependencies..." -ForegroundColor Cyan
npm install

if (!(Test-Path .env)) {
    Write-Host "2. Creating .env file..." -ForegroundColor Cyan
    $envContent = @"
VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
"@
    Set-Content -Path .env -Value $envContent
    Write-Host "   -> Created .env. PLEASE FILL IN YOUR SUPABASE KEYS!" -ForegroundColor Yellow
} else {
    Write-Host "2. .env file already exists." -ForegroundColor Yellow
}

Write-Host "--- Setup Complete! Run 'npm run dev' to start. ---" -ForegroundColor Green
```
