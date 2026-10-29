# Changelog

All notable changes to this project are documented in this file.

## [0.3.0] - Branching & History Traversal
### Added
- `mgit branch <name>` command for creating and managing branch references under `refs/heads/`.
- `mgit log` command for backwards Directed Acyclic Graph (DAG) commit traversal.
- Unit test suites for Branch and Log operations.

## [0.2.0] - Staging Area & Commits
### Added
- Staging area (`.mgit/index`) for tracking files staged for snapshotting.
- `mgit add <path>` command to stage files and store compressed blobs in CAS.
- Tree object serialization and deserialization for directory hierarchical representations.
- Commit object generation with parent linking, timestamp, and author metadata.
- `mgit commit -m <message>` command with automatic HEAD and branch reference updates.

## [0.1.0] - Core Engine & CAS Storage
### Added
- C++17 modular architecture with CMake build system.
- `mgit init` command to bootstrap `.mgit` folder structure.
- Content-Addressable Storage (CAS) with SHA-1 hashing and zlib compression.
- `mgit hash-object` command for hashing and writing blobs to `.mgit/objects/`.
- Google Test suite setup with automated GitHub Actions CI workflow.

