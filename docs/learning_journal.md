# Learning Journal

### Session 1: Architecture & Internals
**Today I learned:** 
- Git is a Content-Addressable Filesystem (CAS).
- `git init` merely creates a `.git` directory structure with `objects`, `refs`, and `HEAD`. It doesn't initialize any complex databases.
- The Git Object store handles 4 primary types: Blob, Tree, Commit, Tag.

**Architecture decisions:**
- Using C++17 and CMake.
- Strictly modular architecture: isolating Filesystem operations from Repository logic to allow unit testing without hitting the real disk.
