@echo off
cls
echo ========================================
echo   REINICIANDO SERVIDOR
echo ========================================
echo.
echo Deteniendo servidor anterior...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Iniciando servidor...
cd /d "%~dp0"
start "Servidor Ronda Marroqui" cmd /k "node src/backend/server.js"
timeout /t 3 /nobreak >nul
echo.
echo Abriendo navegador...
start http://localhost:3000
echo.
echo ========================================
echo   SERVIDOR REINICIADO
echo ========================================
echo.
echo Pagina de bienvenida: http://localhost:3000
echo.
pause
