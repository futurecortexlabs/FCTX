@echo off
chcp 65001 > nul
title FCTX // Morphic Workspace - Native Launcher

echo ========================================================
echo   FCTX // Future Cortex Labs - Native Desktop App
echo ========================================================
echo.

:: 1. Check if Ollama is running, launch with CORS enabled if needed
echo [1/2] ローカル Ollama サービスを確認中...
curl -s http://127.0.0.1:11434/api/tags > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [*] Ollama をバックグラウンド起動しています (OLLAMA_ORIGINS=*)...
    set OLLAMA_ORIGINS=*
    start /b ollama serve > nul 2>&1
    timeout /t 2 /nobreak > nul
) else (
    echo [*] Ollama は正常に起動しています！
)

:: 2. Launch FCTX Desktop App
echo.
echo [2/2] FCTX デスクトップアプリケーションを起動します...
echo.
call npm run app:dist

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [*] ブラウザモードで起動します: http://localhost:5174/
    start http://localhost:5174/
    call npm run dev
)
