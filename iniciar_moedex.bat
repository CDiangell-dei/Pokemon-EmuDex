@echo off
title MoeDex GBA Cloud
echo Iniciando Servidor Local MoeDex GBA Cloud...
start http://localhost:8080/index.html
python -m http.server 8080
pause
