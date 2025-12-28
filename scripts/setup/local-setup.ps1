# Ryha AI Local Development Setup

Write-Host "🔧 Setting up development environment..." -ForegroundColor Green

# Check if Python is available
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Python found" -ForegroundColor Green

# Create virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Blue
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Blue
& ".\venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Blue
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Blue
    @"
ENVIRONMENT=development
DEBUG=true
API_HOST=localhost
API_PORT=8000
"@ | Out-File -FilePath ".env" -Encoding UTF8
}

Write-Host "✅ Development environment ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Activate environment: .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "2. Start coding your agents!" -ForegroundColor White
