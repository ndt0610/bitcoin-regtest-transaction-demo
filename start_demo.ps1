# Bitcoin Transaction Demo - Startup Script
# Chạy: .\start_demo.ps1

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
$BitcoinCoreDir = "C:\bitcoin-core\bin"
$BitcoindPath = "$BitcoinCoreDir\bitcoind.exe"
$BitcoinCliPath = "$BitcoinCoreDir\bitcoin-cli.exe"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Bitcoin Transaction Demo - Khoi dong   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiem tra Bitcoin Core
if (-not (Test-Path $BitcoindPath)) {
    Write-Host "[LOI] Khong tim thay bitcoind.exe tai: $BitcoindPath" -ForegroundColor Red
    Write-Host "      Chay script cai dat: .\install_bitcoin_core.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Tim thay Bitcoin Core: $BitcoindPath" -ForegroundColor Green

# 2. Kiem tra bitcoind da chay chua
$running = $false
try {
    $result = & $BitcoinCliPath -regtest getblockchaininfo 2>$null
    if ($result) { $running = $true }
} catch {}

if (-not $running) {
    Write-Host "[*] Khoi dong Bitcoin Core Regtest..." -ForegroundColor Yellow
    Start-Process -FilePath $BitcoindPath -ArgumentList "-regtest" -WindowStyle Minimized
    Write-Host "[*] Doi Bitcoin Core khoi dong (10 giay)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    # Kiem tra lai
    try {
        $result = & $BitcoinCliPath -regtest getblockchaininfo 2>$null
        if ($result) {
            Write-Host "[OK] Bitcoin Core Regtest dang chay!" -ForegroundColor Green
        }
    } catch {
        Write-Host "[CANH BAO] Bitcoin Core co the chua san sang. Doi them 10 giay..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
} else {
    Write-Host "[OK] Bitcoin Core Regtest da chay." -ForegroundColor Green
}

# 3. Kiem tra Python
$pythonPath = "$ProjectDir\.venv\Scripts\python.exe"
if (-not (Test-Path $pythonPath)) {
    $systemPython = Get-Command python -ErrorAction SilentlyContinue
    if ($systemPython) {
        $pythonPath = "python"
        Write-Host "[OK] Tim thay System Python." -ForegroundColor Green
    } else {
        Write-Host "[LOI] Khong tim thay Python. Chay: python -m venv .venv && .\.venv\Scripts\pip install -r requirements.txt" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Tim thay Python venv." -ForegroundColor Green
}

# 4. Khoi dong FastAPI backend
Write-Host "[*] Khoi dong FastAPI backend (port 8000)..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$ProjectDir'; $pythonPath -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload" -WindowStyle Normal

Start-Sleep -Seconds 3

# 5. Kiem tra node_modules
if (-not (Test-Path "$ProjectDir\frontend\node_modules")) {
    Write-Host "[*] Cai dat npm packages..." -ForegroundColor Yellow
    Push-Location "$ProjectDir\frontend"
    npm install
    Pop-Location
}

# 6. Khoi dong Vite frontend
Write-Host "[*] Khoi dong Vite frontend (port 3000)..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$ProjectDir\frontend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# 7. Mo browser
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Tat ca dich vu da duoc khoi dong!     " -ForegroundColor Green
Write-Host "  Mo trinh duyet tai: http://localhost:3000" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Start-Process "http://localhost:3000"
