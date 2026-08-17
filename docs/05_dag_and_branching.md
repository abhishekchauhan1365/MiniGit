# 05 - DAGs and Branching

## 1. The Directed Acyclic Graph (DAG)
Git tracks history using a mathematical concept called a Directed Acyclic Graph (DAG). 

Every Commit object we create contains a pointer to its `parent` commit (which is simply the SHA-1 hash of the previous commit). 
- **Directed:** The pointers only go one way (Child points to Parent).
- **Acyclic:** You cannot have a cycle (a parent cannot point to a child).

When you run `mgit log`, Git is simply walking backward through this graph. 
It starts at the current commit, prints the message, reads the `parent` hash, loads that parent commit, and repeats until it finds a commit with no parent (the very first commit).

## 2. Reading from the Database
To traverse the DAG, MiniGit must be able to read the data it previously wrote. 
This means we must reverse our storage process:
1. Read the binary file from `.mgit/objects/xx/xxx...`
2. Run it through the `zlib` DEFLATE algorithm in reverse (Inflation/Decompression).
3. Strip off the `commit size\0` header to access the raw text payload.

## 3. What is a Branch?
In many Version Control Systems, a branch is a heavy, physical copy of your directory. 
In Git, **a branch is nothing more than a text file containing a 40-character string.**

When you run `mgit branch feature`, Git simply creates a text file at `.mgit/refs/heads/feature`. Inside that file, it writes the exact same 40-character commit hash that your current branch is pointing to. 

This is why branching in Git is nearly instantaneous and takes zero disk space!
