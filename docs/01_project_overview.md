# 01 - Project Overview & Git Internals

## What is Git?

Git is fundamentally a **Content-Addressable Filesystem** with a Version Control System user interface built on top of it.

### Content-Addressable Storage (CAS)
In a normal filesystem, you retrieve a file by its path (e.g., `src/main.cpp`). In a Content-Addressable Filesystem, you retrieve a file by the **hash of its content**. If the content changes, the hash changes, meaning it becomes a completely new object. 

### The Object Database
Git stores everything in its object database (the `.git/objects` directory) using compression (zlib) and hashing (SHA-1). There are four core object types:

1.  **Blob (Binary Large Object):** Stores only the *content* of a file. It does not store the file name, permissions, or path. If two different files have the exact same content, they will share the exact same blob.
2.  **Tree:** Represents a directory. A tree object contains a list of pointers to blobs (files) and other trees (subdirectories), along with their permissions and filenames.
3.  **Commit:** A snapshot of your project at a specific point in time. A commit points to a single top-level Tree object, and contains metadata: author, committer, timestamp, commit message, and a pointer to its parent commit(s) to form a Directed Acyclic Graph (DAG).
4.  **Tag:** A named pointer to a specific commit, usually annotated with a message and signature.

### What happens when someone runs `git init`?

When you run `git init`, Git doesn't do anything magical. It simply sets up the database schema and directory structure required for this Content-Addressable Filesystem to operate.

It creates a hidden `.git` directory with the following essential skeleton:

```text
.git/
├── HEAD                 # A file pointing to the current active branch (usually ref: refs/heads/main)
├── config               # Repository-specific configuration
├── description          # Used by GitWeb
├── objects/             # The Content-Addressable Store (initially has 'info' and 'pack' subdirs)
└── refs/                # Pointers to commits (branches and tags)
    ├── heads/           # Local branches
    └── tags/            # Tags
```
