# MiniGit TODO

## High Priority
- Implement `mgit checkout <branch>`: Switch active HEAD branch and restore working directory files from commit tree.
- Implement `mgit status`: Detect untracked, modified, and staged files by comparing working directory, index, and HEAD.

## Medium Priority
- Implement `mgit diff`: Generate unified line diffs between working directory, index, and commit trees.
- Author configuration: Support local/global `.mgitconfig` file in addition to environment variables.
- Colored terminal output for `mgit log` and status messages.

## Low Priority
- Implement `mgit tag`: Annotated and lightweight tag references.
- Three-way merge engine (`mgit merge`) with basic conflict markers.

## Full-Stack & Ecosystem
- **MiniGit Studio**: Web-based interactive visualizer to view commit DAG, browse object database, and simulate Git operations live in browser.

