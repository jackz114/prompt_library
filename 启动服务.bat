@echo off
cd /d "%~dp0"
title Prompt Library Server
echo 正在启动提示词本地服务...
echo 请不要关闭此窗口，您可以将其最小化。
echo 如果想停止服务，直接关闭此窗口即可。
echo.
python server/main.py
pause
