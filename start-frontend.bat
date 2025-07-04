@echo off
echo 🚀 Starting GPS Tracker Frontend...
echo.

echo 📦 Installing frontend dependencies...
cd client
call npm install

echo.
echo 🌐 Starting frontend application...
call npm start

pause
