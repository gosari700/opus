@echo off
chcp 65001 >nul
echo ========================================
echo   English Freetalk App Server
echo ========================================
echo.
echo 서버를 시작합니다...
echo 브라우저에서 http://localhost:8000 으로 접속하세요.
echo.
echo 종료하려면 Ctrl+C 를 누르거나 이 창을 닫으세요.
echo ========================================
echo.

:: Open browser after a short delay
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000"

:: Start Python HTTP server
python -m http.server 8000

pause
