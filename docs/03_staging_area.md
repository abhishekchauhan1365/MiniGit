# 03 - The Staging Area (Index)

## The Problem
When you are working on a project, you might modify 10 files, but you only want to group 3 of them into your next logical commit. Git needs a way to remember *which* files are primed for the next commit.

## The Solution: The Index
Git solves this with the **Index** (often called the Staging Area). 

Physically, the index is just a file located at `.mgit/index`. 
When you run `mgit add <file>`:
1. Git takes the current contents of `<file>`.
2. It hashes and compresses the file into a `Blob` and stores it in the Object Database (`.mgit/objects/`).
3. It records the file's path and its 40-character SHA-1 hash into the `.mgit/index` file.

## Educational Deviation
In the official C Git implementation, `.git/index` is a complex, highly optimized binary file that caches filesystem stat data (timestamps, file sizes, inode numbers) to rapidly determine if a file has changed without having to re-read the entire file.

For **MiniGit**, to maximize architectural transparency, we implement the Index as a simple plain-text file.
Format:
`<hash> <filepath>\n`

Example:
`5ce0b8e562788928509c08868858c14828b12271 src/main.cpp`
`12a0b8e562788928509c08868858c14828b12299 CMakeLists.txt`

By making it human-readable, you can open `.mgit/index` in a text editor and instantly see exactly what is staged!
