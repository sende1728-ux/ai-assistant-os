@echo off
title AI Assistant OS - Backend Sunucu
cd /d "%~dp0"
echo ==================================================
echo             AI OS Backend Baslatiliyor
echo ==================================================
echo.
echo [Backend] Kutuphaneler kontrol ediliyor...
if not exist node_modules (
    echo [Backend] Kutuphaneler yukleniyor (Bu islem bir kac dakika surebilir)...
    call npm install
)
echo [Backend] Sunucu dev modunda baslatiliyor...
call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [HATA] Sunucu baslatilamadi. Lutfen yukaridaki hata mesajlarini inceleyin.
    pause
)
