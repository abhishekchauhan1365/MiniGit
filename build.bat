@echo off
echo Building MiniGit and running tests...

if not exist build (
    mkdir build
)
cd build

cmake ..
if %errorlevel% neq 0 (
    echo CMake generation failed! Please ensure CMake and a C++ compiler (like MSVC or MinGW) are installed and on your PATH.
    exit /b %errorlevel%
)

cmake --build .
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo Running Unit Tests
echo ========================================================
ctest --output-on-failure

cd ..
echo Done!
