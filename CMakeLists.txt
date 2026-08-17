cmake_minimum_required(VERSION 3.14)
project(MiniGit VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Enable testing
include(CTest)
enable_testing()

# Include directories
include_directories(include src)

add_subdirectory(src)
add_subdirectory(tests)
