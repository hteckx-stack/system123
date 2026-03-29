@echo off
cd /d "c:\Users\m\Desktop\employyeees hr\admin"
start cmd /c "npm run dev"
timeout /t 3 > nul
start chrome  http://localhost:9002