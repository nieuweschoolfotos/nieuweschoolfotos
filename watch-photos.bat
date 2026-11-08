@echo off
title Foto Gozetleyici (Watch Mode)
echo ====================================================
echo  Nieuwe Schoolfoto's - Canli Klasor Takip Edici
echo ====================================================
echo  'foto' klasorune her yeni resim eklediginizde veya
echo  sildiginizde manifest.js otomatik guncellenecektir.
echo ====================================================
echo.
node generate-manifest.js --watch
pause
