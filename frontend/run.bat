@echo off
title AI Assistant OS - Frontend Arayuz
cd /d "%~dp0"
echo ==================================================
echo             AI OS Frontend Baslatiliyor
echo ==================================================
echo.
echo [Frontend] Kutuphaneler kontrol ediliyor...
if not exist node_modules (
    echo [Frontend] Kutuphaneler yukleniyor (Bu islem bir kac dakika surebilir)...
    call npm install
)
echo [Frontend] Arayuz dev modunda baslatiliyor...
call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [HATA] Arayuz baslatilamadi. Lutfen yukaridaki hata mesajlarini inceleyin.
    pause
)
