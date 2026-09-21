@echo off
title Streamer Hub Local Server
color 0D
cls
echo ============================================
echo      STREAMER HUB - LOCAL PREVIEW
echo ============================================
echo.
echo 1) Mantén esta ventana abierta.
echo 2) En PC abre: http://localhost:5500
echo 3) Para el panel: http://localhost:5500/admin.html
echo.
echo Tu IP local aparece abajo. En el iPhone usa:
echo http://TU-IP:5500
echo.
ipconfig | findstr /i "IPv4"
echo.
echo Si Windows pregunta por Firewall, permite RED PRIVADA.
echo ============================================
echo.
python -m http.server 5500 --bind 0.0.0.0
pause
