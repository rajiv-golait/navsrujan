# Start API — use existing venv; do not recreate venv while this folder is active.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".\venv\Scripts\uvicorn.exe")) {
    Write-Host "Missing venv. Run once: py -3.12 -m venv venv" -ForegroundColor Red
    exit 1
}

$port = if ($env:API_PORT) { $env:API_PORT } else { "8000" }
Write-Host "Starting http://127.0.0.1:$port (health: /health)" -ForegroundColor Cyan
& ".\venv\Scripts\uvicorn.exe" app.main:app --host 127.0.0.1 --port $port
