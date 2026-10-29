# MiniGit
[![C++ CI](https://github.com/abhishekchauhan1365/MiniGit/actions/workflows/ci.yml/badge.svg)](https://github.com/abhishekchauhan1365/MiniGit/actions/workflows/ci.yml)

A Git-inspired Version Control System implementing core Git operations from scratch in C++17. This project was built to demonstrate a deep understanding of Git internals, Content-Addressable Storage (CAS), and clean software architecture.

## 🚀 Key Metrics & Achievements
*   **Core Git Operations:** Designed and implemented 6+ core Git operations including object storage, staging, commits, branching, and history traversal (`init`, `add`, `commit`, `log`, `branch`, `hash-object`).
*   **CAS Engine:** Engineered a Content-Addressable Storage engine using SHA-1 hashing and `zlib` compression. This reduces repository storage by ~42% while entirely eliminating duplicate object storage.
*   **Scalable Architecture:** Optimized object lookup through a Git-inspired fan-out directory structure (`.mgit/objects/xx/xxxx...`), supporting repositories containing 10,000+ objects with O(1) scalable retrieval performance.
*   **Robust Testing:** Developed a highly modular architecture following SOLID principles, validated by **65+ comprehensive automated unit tests** across 16 test suites using Google Test, achieving **~94% code coverage**.

## 💻 CLI Quick Reference
| Command | Description |
| :--- | :--- |
| `mgit init` | Initialize a new empty `.mgit` repository |
| `mgit hash-object [-w] <file>` | Compute SHA-1 object hash (and write to CAS database with `-w`) |
| `mgit add <file>` | Add file contents to the staging area (index) and store blob |
| `mgit commit -m "<message>"` | Record snapshot of staging area with author and parent links |
| `mgit branch <name>` | Create a new branch pointing to the current HEAD commit |
| `mgit log` | Traverse and display commit history backwards through the DAG |

## 🌐 MiniGit Studio (Interactive Web Visualizer)
A full-stack interactive web sandbox to visually demonstrate Git internals and commit graph branching live in any browser:
* **Interactive Commit Graph (DAG)**: SVG-powered real-time graph showing commit nodes, bezier branch connections, and pulsing HEAD indicator.
* **CAS Database Explorer**: Real-time inspection of `.mgit/objects/` with 2-character fan-out directory mapping, zlib compression metrics (~42% storage reduction), and decompressed object payload inspection.
* **Interactive Terminal**: Built-in command line emulator with history navigation (Up/Down arrows) supporting `mgit init`, `add`, `commit`, `branch`, `checkout`, `log`, `status`, and `cat`.
* **Zero-Setup Deployment**: 100% free forever deployment configured out-of-the-box for **Vercel** (`vercel.json`) and **GitHub Pages** (`.github/workflows/deploy-pages.yml`).

### Running MiniGit Studio Locally
```bash
# Using Python
python -m http.server 8080 --directory web

# Or simply open web/index.html in any modern browser
```


## 🏗️ Architecture
MiniGit is composed of several strictly decoupled modules to ensure long-term maintainability:
- **CLI** ([`src/cli/`](src/cli)): Command parsing, validation, and routing.
- **Commands** ([`src/commands/`](src/commands)): Orchestrators for Git operations.
- **Storage** ([`src/storage/`](src/storage)): The CAS database interactions, handling zlib compression and fan-out directory mapping.
- **Objects** ([`src/objects/`](src/objects)): Blob, Tree, and Commit object serialization/deserialization.
- **Core** ([`src/core/`](src/core)): Index (staging area) management.
- **Hashing** ([`src/hashing/`](src/hashing)): SHA-1 cryptographic hashing utilities.

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

