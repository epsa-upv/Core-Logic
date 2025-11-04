@echo off
echo ========================================
echo   INICIAR RONDA MARROQUI - SPRINT 2
echo ========================================
echo.

echo [1/3] Verificando XAMPP...
echo.
echo IMPORTANTE: Asegurate de que XAMPP este ejecutandose
echo            - Abre XAMPP Control Panel
echo            - Click en START para Apache
echo            - Click en START para MySQL
echo.
pause

echo.
echo [2/3] Iniciando servidor backend...
echo.
start "Backend - Ronda Marroqui" cmd /k "npm start"

timeout /t 3 /nobreak > nul

echo.
echo [3/3] Abriendo navegador...
echo.
start http://localhost:3000/src/login.html

echo.
echo ========================================
echo   SERVIDOR INICIADO CORRECTAMENTE
echo ========================================
echo.
echo Paginas disponibles:
echo   - Login:    http://localhost:3000/src/login.html
echo   - Registro: http://localhost:3000/src/register.html
echo   - Juego:    http://localhost:3000/src/index.html
echo.
echo Presiona Ctrl+C en la ventana del backend para detener el servidor
echo.
pause
