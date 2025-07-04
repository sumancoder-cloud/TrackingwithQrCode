@echo off
echo 🚀 Starting GPS Tracker Backend...
echo.

echo 📦 Installing backend dependencies...
cd server
call npm install

echo.
echo 🗄️ Setting up database with sample data...
call node install.js

echo.
echo 🌐 Starting backend server...
call npm run dev

pause
