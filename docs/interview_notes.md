# Interview Notes

## Topic: Git Internals (Init & CAS)

**Q: What is a Content-Addressable Filesystem?**
A: A system where data is retrieved based on a cryptographic hash of its content, rather than its location or file name. If the content changes, its address (hash) changes.

**Q: What actually happens when you type `git init`?**
A: Git creates a `.git` directory containing the database schema: `objects/` for CAS, `refs/` for branch pointers, and `HEAD` to track the currently active branch.

**Q: How does Git store a directory structure?**
A: Using `Tree` objects. A Tree contains a list of pointers (hashes) to `Blob` objects (files) or other `Tree` objects (subdirectories), along with their filenames and permissions.
