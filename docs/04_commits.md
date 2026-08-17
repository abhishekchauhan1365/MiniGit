# 04 - Trees and Commits

So far, we can store file contents (Blobs) and we know what files are staged (Index). But how do we permanently snapshot a project?

## 1. The Tree Object
A Blob only stores file content. It doesn't know its own filename, and it cannot represent directories. 

The **Tree** object solves this. A Tree is an object that represents a directory. It contains a list of pointers to Blobs (files) and other Trees (subdirectories).

Git's internal format for a Tree object is:
`tree <size>\0[mode] [filename]\0[20-byte-binary-hash]...`

When we run `mgit commit`, Git reads the `.mgit/index`. It takes all the staged files and constructs a top-level Tree object representing the root of the project, hashes it, and saves it to `.mgit/objects/`.

## 2. The Commit Object
Now we have a Tree representing the project state. But who made it? When? And why?

The **Commit** object wraps a Tree with metadata.
Git's internal format for a Commit object is:
```
commit <size>\0tree <tree_hash>
parent <parent_commit_hash>
author <name> <timestamp>
committer <name> <timestamp>

<commit message>
```

When we run `mgit commit`:
1. We write the Tree object.
2. We look at `.mgit/HEAD` to find the currently active branch.
3. We read the branch file (e.g., `refs/heads/master`) to find the hash of the *previous* commit. This becomes the `parent`.
4. We write the new Commit object.
5. We update the branch file (`refs/heads/master`) to point to our newly created Commit hash.

This linked-list of parent hashes forms the **Directed Acyclic Graph (DAG)** that allows Git to trace history back to the beginning of time.
