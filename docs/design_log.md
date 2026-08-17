# Architecture Design Log

## Decision: Build System
**Decision:** Use CMake.
**Reason:** Industry standard for C++, cross-platform support (Windows/Linux/macOS), and easy integration with IDEs.
**Alternatives Considered:** Make, Ninja, Bazel. Make is not easily cross-platform. Bazel is overkill for this project size.
**Pros:** Ubiquitous, standard `FetchContent` for dependencies.
**Cons:** Syntax can be arcane.

## Decision: Testing Framework
**Decision:** GoogleTest (GTest).
**Reason:** Extremely common in the industry, rich assertion macros, easy to integrate via CMake.
**Alternatives Considered:** Catch2, doctest.
**Pros:** Industry standard.
**Cons:** Slightly heavier than Catch2.

## Decision: Hashing
**Decision:** Implement or include a minimal header-only SHA-1.
**Reason:** Maximizes learning, removes need to link heavy crypto libraries like OpenSSL just for SHA-1.

## Decision: Compression
**Decision:** Use standard zlib.
**Reason:** Git natively uses zlib to compress all objects in `.git/objects`. We must follow this to be compatible and understand the format.
