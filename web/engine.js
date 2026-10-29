/**
 * MiniGit Engine - In-Browser Content-Addressable Storage & VCS Simulation
 * Implements standard SHA-1, Blob/Tree/Commit object serialization,
 * staging index (.mgit/index), and commit DAG graph traversal.
 */

class MiniGitEngine {
    constructor() {
        this.reset();
    }

    reset() {
        // Content-Addressable Object Database (.mgit/objects)
        // Key: 40-character SHA-1 -> { type: 'blob'|'tree'|'commit', data: string, raw: string, size: number, compressedSize: number }
        this.objects = new Map();

        // Staging Area (.mgit/index)
        // Map: filePath -> blobHash
        this.index = new Map();

        // Branches (.mgit/refs/heads)
        // Map: branchName -> commitHash
        this.branches = new Map();

        // Active HEAD pointer (.mgit/HEAD)
        // e.g. "refs/heads/master" or commitHash (detached)
        this.head = "refs/heads/master";

        // Working Directory (Virtual file system)
        // Map: filePath -> content
        this.workingDir = new Map();

        // Load rich initial repository state for instant wow-factor
        this.bootstrapDemoState();
    }

    // ==========================================
    // SHA-1 Cryptographic Hashing
    // ==========================================
    static sha1(str) {
        // Standard SHA-1 implementation in pure JS
        function rotateLeft(n, s) {
            return (n << s) | (n >>> (32 - s));
        }
        function cvtHex(val) {
            let str = "";
            for (let i = 7; i >= 0; i--) {
                const v = (val >>> (i * 4)) & 0x0f;
                str += v.toString(16);
            }
            return str;
        }

        const utf8 = unescape(encodeURIComponent(str));
        const words = [];
        for (let i = 0; i < utf8.length; i++) {
            words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
        }
        const bitLen = utf8.length * 8;
        words[bitLen >> 5] |= 0x80 << (24 - (bitLen % 32));
        words[(((bitLen + 64) >> 9) << 4) + 15] = bitLen;

        let H0 = 0x67452301;
        let H1 = 0xefcdab89;
        let H2 = 0x98badcfe;
        let H3 = 0x10325476;
        let H4 = 0xc3d2e1f0;

        const W = new Array(80);
        for (let i = 0; i < words.length; i += 16) {
            for (let t = 0; t < 16; t++) {
                W[t] = words[i + t] || 0;
            }
            for (let t = 16; t < 80; t++) {
                W[t] = rotateLeft(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
            }

            let A = H0, B = H1, C = H2, D = H3, E = H4;

            for (let t = 0; t < 80; t++) {
                let f, K;
                if (t < 20) {
                    f = (B & C) | ((~B) & D);
                    K = 0x5a827999;
                } else if (t < 40) {
                    f = B ^ C ^ D;
                    K = 0x6ed9eba1;
                } else if (t < 60) {
                    f = (B & C) | (B & D) | (C & D);
                    K = 0x8f1bbcdc;
                } else {
                    f = B ^ C ^ D;
                    K = 0xca62c1d6;
                }
                const temp = (rotateLeft(A, 5) + f + E + K + (W[t] >>> 0)) >>> 0;
                E = D;
                D = C;
                C = rotateLeft(B, 30) >>> 0;
                B = A;
                A = temp;
            }

            H0 = (H0 + A) >>> 0;
            H1 = (H1 + B) >>> 0;
            H2 = (H2 + C) >>> 0;
            H3 = (H3 + D) >>> 0;
            H4 = (H4 + E) >>> 0;
        }

        return (cvtHex(H0) + cvtHex(H1) + cvtHex(H2) + cvtHex(H3) + cvtHex(H4)).toLowerCase();
    }

    // ==========================================
    // Core CAS Object Operations
    // ==========================================
    hashObject(data, type = "blob", write = true) {
        // Git format: "<type> <length>\0<data>"
        const header = `${type} ${data.length}\0`;
        const store = header + data;
        const hash = MiniGitEngine.sha1(store);

        if (write && !this.objects.has(hash)) {
            // Simulate zlib deflation compression ratio (~42% average reduction)
            const size = store.length;
            const compressedSize = Math.max(12, Math.round(size * 0.58));
            
            this.objects.set(hash, {
                hash,
                type,
                header,
                data,
                raw: store,
                size,
                compressedSize,
                created: new Date()
            });
        }
        return hash;
    }

    getObject(hash) {
        return this.objects.get(hash);
    }

    // ==========================================
    // Git Commands
    // ==========================================

    getCurrentBranch() {
        if (this.head.startsWith("refs/heads/")) {
            return this.head.replace("refs/heads/", "");
        }
        return "detached HEAD";
    }

    getHeadCommitHash() {
        if (this.head.startsWith("refs/heads/")) {
            const branch = this.getCurrentBranch();
            return this.branches.get(branch) || null;
        }
        return this.head;
    }

    add(filePath) {
        if (!this.workingDir.has(filePath)) {
            throw new Error(`pathspec '${filePath}' did not match any files`);
        }
        const content = this.workingDir.get(filePath);
        const blobHash = this.hashObject(content, "blob", true);
        this.index.set(filePath, blobHash);
        return { filePath, blobHash };
    }

    addAll() {
        const results = [];
        for (const filePath of this.workingDir.keys()) {
            results.push(this.add(filePath));
        }
        return results;
    }

    commit(message, author = "Abhishek Chauhan <abhishek@example.com>") {
        if (!message || message.trim() === "") {
            throw new Error("Aborting commit due to empty commit message.");
        }
        if (this.index.size === 0) {
            throw new Error("nothing to commit, working tree clean");
        }

        // 1. Serialize Staging Area into a Tree Object
        // Format: "100644 blob <sha1>\t<path>\n..."
        let treePayload = "";
        const sortedEntries = Array.from(this.index.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        for (const [path, hash] of sortedEntries) {
            treePayload += `100644 blob ${hash}\t${path}\n`;
        }
        const treeHash = this.hashObject(treePayload, "tree", true);

        // 2. Get Parent Commit (if any)
        const parentHash = this.getHeadCommitHash() || "";

        // 3. Serialize Commit Object
        // Format: "tree <hash>\nparent <hash>\nauthor <author> <timestamp>\n\n<message>\n"
        const timestamp = Math.floor(Date.now() / 1000);
        let commitPayload = `tree ${treeHash}\n`;
        if (parentHash) {
            commitPayload += `parent ${parentHash}\n`;
        }
        commitPayload += `author ${author} ${timestamp} +0000\n`;
        commitPayload += `committer ${author} ${timestamp} +0000\n\n`;
        commitPayload += `${message.trim()}\n`;

        const commitHash = this.hashObject(commitPayload, "commit", true);

        // 4. Update Current Branch pointer
        const currentBranch = this.getCurrentBranch();
        if (currentBranch !== "detached HEAD") {
            this.branches.set(currentBranch, commitHash);
        } else {
            this.head = commitHash;
        }

        return {
            commitHash,
            treeHash,
            parentHash,
            branch: currentBranch,
            message: message.trim(),
            author
        };
    }

    branch(name) {
        if (!name || name.trim() === "") {
            // List branches
            const current = this.getCurrentBranch();
            return Array.from(this.branches.keys()).map(b => ({
                name: b,
                isCurrent: b === current,
                commit: this.branches.get(b)
            }));
        }

        const cleanName = name.trim();
        if (this.branches.has(cleanName)) {
            throw new Error(`A branch named '${cleanName}' already exists.`);
        }

        const headCommit = this.getHeadCommitHash();
        if (!headCommit) {
            throw new Error("fatal: not a valid object name: 'master'");
        }

        this.branches.set(cleanName, headCommit);
        return { created: cleanName, commit: headCommit };
    }

    checkout(name) {
        const cleanName = name.trim();
        if (this.branches.has(cleanName)) {
            this.head = `refs/heads/${cleanName}`;
            // Synchronize working directory & index from the commit's tree
            this.syncWorkingTreeFromCommit(this.branches.get(cleanName));
            return { branch: cleanName };
        } else if (this.objects.has(cleanName) && this.objects.get(cleanName).type === "commit") {
            this.head = cleanName;
            this.syncWorkingTreeFromCommit(cleanName);
            return { detached: cleanName };
        } else {
            throw new Error(`pathspec '${cleanName}' did not match any branch known to MiniGit`);
        }
    }

    syncWorkingTreeFromCommit(commitHash) {
        if (!commitHash) return;
        const commitObj = this.objects.get(commitHash);
        if (!commitObj) return;

        // Extract tree hash
        const treeMatch = commitObj.data.match(/^tree ([a-f0-9]{40})/m);
        if (!treeMatch) return;
        const treeObj = this.objects.get(treeMatch[1]);
        if (!treeObj) return;

        // Clear and rebuild index & working dir from tree entries
        this.index.clear();
        const lines = treeObj.data.split("\n");
        for (const line of lines) {
            if (!line.trim()) continue;
            // "100644 blob <sha1>\t<path>"
            const parts = line.split("\t");
            if (parts.length === 2) {
                const meta = parts[0].split(" ");
                const blobHash = meta[2];
                const filePath = parts[1];
                this.index.set(filePath, blobHash);

                const blobObj = this.objects.get(blobHash);
                if (blobObj) {
                    this.workingDir.set(filePath, blobObj.data);
                }
            }
        }
    }

    log() {
        const history = [];
        let currentHash = this.getHeadCommitHash();

        while (currentHash) {
            const commitObj = this.objects.get(currentHash);
            if (!commitObj || commitObj.type !== "commit") break;

            const text = commitObj.data;
            const parentMatch = text.match(/^parent ([a-f0-9]{40})/m);
            const authorMatch = text.match(/^author ([^<]+<[^>]+>)/m);
            const dateMatch = text.match(/^author [^<]+<[^>]+> (\d+)/m);
            
            // Message is everything after the first double newline
            const msgSplit = text.split("\n\n");
            const message = msgSplit.slice(1).join("\n\n").trim();

            history.push({
                hash: currentHash,
                shortHash: currentHash.substring(0, 7),
                parent: parentMatch ? parentMatch[1] : null,
                author: authorMatch ? authorMatch[1] : "Unknown",
                timestamp: dateMatch ? new Date(parseInt(dateMatch[1]) * 1000) : new Date(),
                message
            });

            currentHash = parentMatch ? parentMatch[1] : null;
        }

        return history;
    }

    status() {
        const staged = [];
        const unstaged = [];
        const untracked = [];

        // Check Working Directory against Index
        for (const [path, content] of this.workingDir.entries()) {
            const currentHash = MiniGitEngine.sha1(`blob ${content.length}\0${content}`);
            if (!this.index.has(path)) {
                untracked.push(path);
            } else if (this.index.get(path) !== currentHash) {
                unstaged.push(path);
            }
        }

        // Check Index against HEAD commit tree
        const headCommit = this.getHeadCommitHash();
        let headTreeEntries = new Map();
        if (headCommit) {
            const commitObj = this.objects.get(headCommit);
            if (commitObj) {
                const treeMatch = commitObj.data.match(/^tree ([a-f0-9]{40})/m);
                if (treeMatch && this.objects.has(treeMatch[1])) {
                    const treeObj = this.objects.get(treeMatch[1]);
                    for (const line of treeObj.data.split("\n")) {
                        const parts = line.split("\t");
                        if (parts.length === 2) {
                            const blobHash = parts[0].split(" ")[2];
                            headTreeEntries.set(parts[1], blobHash);
                        }
                    }
                }
            }
        }

        for (const [path, hash] of this.index.entries()) {
            if (!headTreeEntries.has(path) || headTreeEntries.get(path) !== hash) {
                staged.push(path);
            }
        }

        return { staged, unstaged, untracked, branch: this.getCurrentBranch() };
    }

    // ==========================================
    // Demo Bootstrap State
    // ==========================================
    bootstrapDemoState() {
        // Seed 1: Initial files
        this.workingDir.set("README.md", "# MiniGit\nA Git-compatible VCS built in C++17 with Content-Addressable Storage.\n");
        this.workingDir.set("src/main.cpp", "#include <iostream>\n\nint main() {\n    std::cout << \"Hello from MiniGit!\\n\";\n    return 0;\n}\n");
        
        // Stage & Commit 1 (Initial commit)
        this.addAll();
        const c1 = this.commit("Initial commit: setup structure and hello world", "Abhishek Chauhan <abhishek@example.com>");

        // Seed 2: Core Storage Engine
        this.workingDir.set("src/storage/ObjectDatabase.cpp", "// Content-Addressable Storage\n#include <zlib.h>\n// Fan-out O(1) retrieval\n");
        this.workingDir.set("src/hashing/SHA1.cpp", "// Cryptographic SHA-1 160-bit computation\n");
        this.addAll();
        const c2 = this.commit("feat: implement CAS engine and SHA-1 hashing", "Abhishek Chauhan <abhishek@example.com>");

        // Branch: feature/auth
        this.branch("feature/auth");
        this.checkout("feature/auth");

        this.workingDir.set("src/auth/Session.cpp", "// JWT & SSH authentication tokens\nvoid authenticate() {}\n");
        this.addAll();
        const c3 = this.commit("feat: add session auth token validation", "Abhishek Chauhan <abhishek@example.com>");

        // Return to master
        this.checkout("master");

        // Seed 3: Master commit
        this.workingDir.set("README.md", "# MiniGit\nA Git-compatible VCS built in C++17.\nFeatures: CAS engine, SHA-1, DAG traversal, 65+ unit tests.\n");
        this.addAll();
        const c4 = this.commit("docs: update README with testing metrics & CLI guide", "Abhishek Chauhan <abhishek@example.com>");

        // Leave 1 modified file unstaged for dynamic staging widget demonstration
        this.workingDir.set("test_experiment.txt", "Experimenting with DAG branch divergence.\n");
    }
}

// Export for browser
window.MiniGitEngine = MiniGitEngine;
