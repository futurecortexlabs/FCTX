# FCTX // Future Cortex Labs - PowerShell Launcher
$Host.UI.RawUI.WindowTitle = "FCTX // Morphic Workspace"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  FCTX // Future Cortex Labs - Native Desktop App" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Ollama
Write-Host "[1/2] ローカル Ollama サービスを確認中..." -ForegroundColor Yellow
$ollamaActive = $false
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($res) { $ollamaActive = $true }
} catch {}

if (-not $ollamaActive) {
    Write-Host "[*] Ollama をバックグラウンド起動しています (OLLAMA_ORIGINS='*')..." -ForegroundColor Gray
    $env:OLLAMA_ORIGINS = "*"
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[*] Ollama は正常に起動しています！" -ForegroundColor Green
}

# 2. Launch App
Write-Host ""
Write-Host "[2/2] FCTX デスクトップアプリケーションを起動します..." -ForegroundColor Yellow
Write-Host ""

try {
    npm run app:dist
} catch {
    Write-Host "[*] ブラウザモードで起動します: http://localhost:5174/" -ForegroundColor Gray
    Start-Process "http://localhost:5174/"
    npm run dev
}
