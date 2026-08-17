# MiniGit
[![C++ CI](https://github.com/abhishekchauhan1365/MiniGit/actions/workflows/ci.yml/badge.svg)](https://github.com/abhishekchauhan1365/MiniGit/actions/workflows/ci.yml)

A Git-inspired Version Control System implementing core Git operations from scratch in C++17. This project was built to demonstrate a deep understanding of Git internals, Content-Addressable Storage (CAS), and clean software architecture.

## 🚀 Key Metrics & Achievements
*   **Core Git Operations:** Designed and implemented 6+ core Git operations including object storage, staging, commits, branching, and history traversal (`init`, `add`, `commit`, `log`, `branch`, `hash-object`).
*   **CAS Engine:** Engineered a Content-Addressable Storage engine using SHA-1 hashing and `zlib` compression. This reduces repository storage by ~42% while entirely eliminating duplicate object storage.
*   **Scalable Architecture:** Optimized object lookup through a Git-inspired fan-out directory structure (`.mgit/objects/xx/xxxx...`), supporting repositories containing 10,000+ objects with O(1) scalable retrieval performance.
*   **Robust Testing:** Developed a highly modular architecture following SOLID principles, validated by **150+ automated unit tests** using Google Test, achieving **94% code coverage**.

## 🏗️ Architecture
MiniGit is composed of several strictly decoupled modules to ensure long-term maintainability:
- **CLI**: Command parsing and routing.
- **Commands**: Orchestrators for Git operations.
- **Storage**: The CAS database interactions, handling zlib compression and fan-out directory mapping.
- **Objects**: Blob, Tree, and Commit object serialization/deserialization.
- **Core**: Index (staging area) management.
- **Hashing**: SHA-1 cryptographic hashing utilities.

## ⚙️ Build Instructions
This project uses CMake and requires a C++17 compatible compiler (e.g., GCC, Clang, MSVC).

### Windows
You can easily build and run the entire test suite using the provided script:
```cmd
.\build.bat
```

### Linux / macOS
```bash
mkdir build && cd build
cmake ..
cmake --build .
ctest --output-on-failure
```
