# MiniGit

A production-quality Git implementation from scratch in C++17.
Built for educational purposes, focusing on clean architecture, SOLID principles, and a deep understanding of Git internals.

## Architecture
MiniGit is composed of several decoupled modules:
- **CLI**: Command parsing and routing.
- **Commands**: Orchestrators for Git operations.
- **Repository**: Facade for the `.mgit` folder state.
- **Storage**: Content-Addressable Storage database interactions.
- **Objects**: Blob, Tree, Commit representations.
- **Filesystem**: OS-agnostic file and directory operations.

## Build Instructions
*(To be added)*

## Features
- `mgit init` (In progress)

## Current Progress
Milestone 1 (Initialization and Architecture) is currently underway.
