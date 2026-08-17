# 02 - Object Storage & Hashing

## The Git Object Database

At its core, Git is a simple key-value data store. You insert data, and it gives you back a key. That key is a SHA-1 hash of the data. You can then use that key to retrieve the data again.

All this data lives inside the `.mgit/objects` directory.

## 1. The Git Object Format

When you track a file in Git, it doesn't just copy the file verbatim into the objects directory. It wraps it in a specific format.

Every object in Git (Blob, Tree, Commit, Tag) is prefixed with a **header**.

The header format is:
`[type] [size-in-bytes]\0[content]`

Where `\0` is the null byte character (ASCII 0).

**Example:**
If you have a file containing the string `"hello"` (5 bytes), Git creates the following buffer in memory:
`blob 5\0hello`

## 2. Hashing (SHA-1)

Once the buffer is created in memory, Git passes the *entire buffer* through the SHA-1 cryptographic hashing algorithm.

SHA-1 takes an input of any size and produces a fixed-size 160-bit (20-byte) output. This is typically represented as a 40-character hexadecimal string.

**Why does Git do this?**
- **Data Integrity:** If a single byte of a file gets corrupted on disk, its hash will change entirely. Git can detect this corruption immediately.
- **Deduplication:** If you have two different files with the exact same content, they will generate the exact same buffer, and therefore the exact same SHA-1 hash. Git will only store it once!

## 3. Compression (zlib)

Before writing the buffer to disk, Git compresses it using the `zlib` library (DEFLATE algorithm).
Source code is highly compressible, so this keeps the size of the `.mgit` folder manageable over the lifespan of a project.

## 4. Storage Layout (Fan-out Directories)

If a repository has 100,000 files, placing 100,000 files in a single directory (`.mgit/objects/`) will cause significant performance issues on many file systems (like FAT32 or older NTFS).

To solve this, Git uses a **fan-out** strategy.
It takes the 40-character SHA-1 hash, and splits it:
- The **first 2 characters** become the directory name.
- The **remaining 38 characters** become the file name.

**Example:**
If our hash is `5ce0b8e562788928509c08868858c14828b12271`:
Git creates a directory: `.mgit/objects/5c/`
Git saves the zlib-compressed data to a file: `.mgit/objects/5c/e0b8e562788928509c08868858c14828b12271`
