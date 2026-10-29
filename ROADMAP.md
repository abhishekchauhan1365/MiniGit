# MiniGit Roadmap

## Completed Milestones
- **Milestone 1: Repository Core & Initialization**
  - Architecture foundation, modular filesystem abstractions, `.mgit` layout (`init`).
- **Milestone 2: Content-Addressable Storage (CAS)**
  - SHA-1 cryptographic hashing, zlib compression, fan-out object storage (`hash-object`).
- **Milestone 3: The Staging Area (Index)**
  - Staging area serialization and state tracking (`add`).
- **Milestone 4: Tree & Commit Snapshotting**
  - Tree and Commit serialization, parent commit linking, metadata tracking (`commit`).
- **Milestone 5: Branching & DAG Traversal**
  - Reference pointers (`refs/heads/*`), active branch tracking via `HEAD` (`branch`).
  - Commit graph traversal backwards through history (`log`).
- **Milestone 6: Verification & CI/CD**
  - 65+ Google Test unit test cases across 16 test suites, GitHub Actions CI workflow.

## Current & Upcoming Milestones
- **Milestone 7: Working Tree Restoration (`checkout`)**
  - Branch switching and working directory synchronization from tree objects.
- **Milestone 8: Working Tree Inspection (`status` & `diff`)**
  - State diffing across working directory, index, and commit trees.
- **Milestone 9: Branch Merging (`merge`)**
  - Common ancestor resolution (LCA) and fast-forward / 3-way merge.
- **Milestone 10: MiniGit Studio (Web Visualizer)**
  - Interactive DAG visualizer, live object database inspector, and browser demo sandbox.

