@echo off
chcp 65001 >nul
title 可视化导论 - 本地预览
cd /d "%~dp0"

set PORT=8080
echo.
echo   ============================================
echo     《可视化导论》本地预览
echo   ============================================
echo.
echo   正在启动 http://localhost:%PORT%/
echo   关闭本窗口即停止服务。
echo.

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
  python -m http.server %PORT%
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
  py -m http.server %PORT%
  goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
  node serve-local.mjs
  goto :eof
)

echo   [错误] 没有找到 python 或 node，无法启动本地服务。
echo   请安装 Python 3 或 Node.js 后重试。
echo.
pause
