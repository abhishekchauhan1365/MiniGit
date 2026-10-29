/**
 * MiniGit Studio - Main Application Controller
 * Glues together the Engine, Terminal, DAG Visualizer, CAS Inspector, and UI controls.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Engine & Components
    const engine = new MiniGitEngine();

    const terminalBody = document.getElementById("terminalBody");
    const terminalInput = document.getElementById("terminalInput");
    const dagSvg = document.getElementById("dagSvg");

    let visualizer = null;
    let terminal = null;
    let selectedFilePath = "README.md";

    // 2. Initialize Visualizer & Commit Selection Callback
    visualizer = new DagVisualizer(dagSvg, (commit) => {
        updateSelectedCommitBanner(commit);
    });

    // 3. Initialize Terminal
    terminal = new MiniGitTerminal(engine, terminalBody, terminalInput, () => {
        syncAllUI();
    });

    // 4. Update Header Stats
    function updateStats() {
        const objCount = engine.objects.size;
        let commitCount = 0;
        let totalRawSize = 0;
        let totalCompressedSize = 0;

        for (const obj of engine.objects.values()) {
            if (obj.type === "commit") commitCount++;
            totalRawSize += obj.size;
            totalCompressedSize += obj.compressedSize;
        }

        document.getElementById("statObjects").textContent = objCount;
        document.getElementById("statCommits").textContent = commitCount;
        document.getElementById("statBranches").textContent = engine.branches.size;

        const savings = totalRawSize > 0 
            ? Math.round((1 - (totalCompressedSize / totalRawSize)) * 100) 
            : 42;
        document.getElementById("statSavings").textContent = `${Math.max(25, savings)}%`;

        document.getElementById("currentBranchBadge").textContent = engine.getCurrentBranch();
    }

    // 5. Update Staging Widget
    function updateStagingWidget() {
        const status = engine.status();
        const stagedList = document.getElementById("stagedFileList");
        const unstagedList = document.getElementById("unstagedFileList");

        document.getElementById("stagedCount").textContent = status.staged.length;
        document.getElementById("unstagedCount").textContent = status.unstaged.length + status.untracked.length;

        stagedList.innerHTML = "";
        if (status.staged.length === 0) {
            stagedList.innerHTML = '<li class="empty-state">No changes staged for commit.</li>';
        } else {
            status.staged.forEach(f => {
                const li = document.createElement("li");
                li.className = "staged-item";
                li.innerHTML = `<span>+ ${f}</span><span style="font-size:10px; color:#64748b;">(staged)</span>`;
                stagedList.appendChild(li);
            });
        }

        unstagedList.innerHTML = "";
        const unstagedAll = [...status.unstaged, ...status.untracked];
        if (unstagedAll.length === 0) {
            unstagedList.innerHTML = '<li class="empty-state">Working directory clean.</li>';
        } else {
            unstagedAll.forEach(f => {
                const isUntracked = status.untracked.includes(f);
                const li = document.createElement("li");
                li.className = "unstaged-item";
                li.innerHTML = `<span>${isUntracked ? "?" : "M"} ${f}</span><span style="font-size:10px; color:#64748b;">${isUntracked ? "untracked" : "modified"}</span>`;
                unstagedList.appendChild(li);
            });
        }
    }

    // 6. Update CAS Database Explorer (Tab 1)
    function updateCasExplorer() {
        const casList = document.getElementById("casObjectsList");
        casList.innerHTML = "";

        const sortedObjects = Array.from(engine.objects.values()).reverse();

        sortedObjects.forEach(obj => {
            const card = document.createElement("div");
            card.className = "cas-card";
            
            const dirPrefix = obj.hash.substring(0, 2);
            const fileName = obj.hash.substring(2);

            let previewText = "";
            if (obj.type === "commit") {
                const msg = obj.data.split("\n\n")[1] || "";
                previewText = msg.substring(0, 32);
            } else if (obj.type === "tree") {
                const entries = obj.data.split("\n").filter(Boolean).length;
                previewText = `${entries} tree entries`;
            } else {
                previewText = obj.data.length > 30 ? obj.data.substring(0, 30) + "..." : obj.data;
            }

            card.innerHTML = `
                <div class="cas-card-top">
                    <span class="badge badge-${obj.type}">${obj.type.toUpperCase()}</span>
                    <span class="cas-hash"><span class="cas-hash-prefix">${dirPrefix}/</span>${fileName.substring(0, 10)}...</span>
                </div>
                <div class="cas-card-meta">
                    <span style="color:#cbd5e1;">${previewText}</span>
                    <span>${obj.compressedSize} B (deflated)</span>
                </div>
            `;

            card.addEventListener("click", () => {
                openObjectModal(obj);
            });

            casList.appendChild(card);
        });
    }

    // 7. Update Files Tree & Diff Viewer (Tab 2)
    function updateFilesTree() {
        const treeContainer = document.getElementById("filesTree");
        treeContainer.innerHTML = "";

        for (const [path, content] of engine.workingDir.entries()) {
            const row = document.createElement("div");
            row.className = `file-row ${path === selectedFilePath ? "selected" : ""}`;
            row.innerHTML = `
                <span>📄 ${path}</span>
                <span style="font-size:11px; color:#64748b;">${content.length} bytes</span>
            `;

            row.addEventListener("click", () => {
                selectedFilePath = path;
                updateFilesTree();
                updateDiffViewer();
            });

            treeContainer.appendChild(row);
        }

        updateDiffViewer();
    }

    function updateDiffViewer() {
        const diffCode = document.getElementById("diffViewerCode");
        const diffTitle = document.getElementById("diffViewerTitle");

        if (!selectedFilePath || !engine.workingDir.has(selectedFilePath)) {
            diffTitle.textContent = "Diff Preview";
            diffCode.textContent = "// Select a file to view diff";
            return;
        }

        diffTitle.textContent = `Diff: ${selectedFilePath}`;

        const workingContent = engine.workingDir.get(selectedFilePath);
        
        // Find previous version from latest HEAD commit tree
        let originalContent = null;
        const headCommit = engine.getHeadCommitHash();
        if (headCommit && engine.objects.has(headCommit)) {
            const commitObj = engine.objects.get(headCommit);
            const treeMatch = commitObj.data.match(/^tree ([a-f0-9]{40})/m);
            if (treeMatch && engine.objects.has(treeMatch[1])) {
                const treeObj = engine.objects.get(treeMatch[1]);
                for (const line of treeObj.data.split("\n")) {
                    const parts = line.split("\t");
                    if (parts.length === 2 && parts[1] === selectedFilePath) {
                        const blobHash = parts[0].split(" ")[2];
                        if (engine.objects.has(blobHash)) {
                            originalContent = engine.objects.get(blobHash).data;
                        }
                    }
                }
            }
        }

        if (originalContent === null) {
            // New untracked or staged file
            diffCode.innerHTML = `<span class="diff-add">+++ new file: ${selectedFilePath}</span>\n` +
                workingContent.split("\n").map(l => `<span class="diff-add">+ ${escapeHtml(l)}</span>`).join("\n");
        } else if (originalContent === workingContent) {
            diffCode.textContent = `// ${selectedFilePath} matches HEAD commit (no diff)`;
        } else {
            // Simple line-by-line diff
            const origLines = originalContent.split("\n");
            const workLines = workingContent.split("\n");
            let out = `--- a/${selectedFilePath}\n+++ b/${selectedFilePath}\n`;

            const maxLen = Math.max(origLines.length, workLines.length);
            for (let i = 0; i < maxLen; i++) {
                const oldL = origLines[i];
                const newL = workLines[i];
                if (oldL !== undefined && newL !== undefined) {
                    if (oldL === newL) {
                        out += `  ${escapeHtml(oldL)}\n`;
                    } else {
                        out += `<span class="diff-del">- ${escapeHtml(oldL)}</span>\n`;
                        out += `<span class="diff-add">+ ${escapeHtml(newL)}</span>\n`;
                    }
                } else if (oldL !== undefined) {
                    out += `<span class="diff-del">- ${escapeHtml(oldL)}</span>\n`;
                } else if (newL !== undefined) {
                    out += `<span class="diff-add">+ ${escapeHtml(newL)}</span>\n`;
                }
            }
            diffCode.innerHTML = out;
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // 8. Commit Details Banner
    function updateSelectedCommitBanner(commit) {
        if (!commit) return;
        document.getElementById("bannerCommitHash").textContent = commit.shortHash;
        document.getElementById("bannerCommitMessage").textContent = commit.message;
        document.getElementById("bannerCommitAuthor").textContent = `Author: ${commit.author}`;
        document.getElementById("bannerCommitTime").textContent = commit.timestamp.toLocaleTimeString();
    }

    // 9. Sync All UI
    function syncAllUI() {
        updateStats();
        updateStagingWidget();
        updateCasExplorer();
        updateFilesTree();
        visualizer.render(engine);
    }

    // ==========================================
    // Modals
    // ==========================================
    const modalBackdrop = document.getElementById("modalBackdrop");
    const modalObjectBadge = document.getElementById("modalObjectBadge");
    const modalObjectHash = document.getElementById("modalObjectHash");
    const modalStoragePath = document.getElementById("modalStoragePath");
    const modalPayloadSize = document.getElementById("modalPayloadSize");
    const modalObjectContent = document.getElementById("modalObjectContent");

    function openObjectModal(obj) {
        modalObjectBadge.className = `badge badge-${obj.type}`;
        modalObjectBadge.textContent = obj.type.toUpperCase();
        modalObjectHash.textContent = obj.hash;
        modalStoragePath.textContent = `.mgit/objects/${obj.hash.substring(0, 2)}/${obj.hash.substring(2)}`;
        modalPayloadSize.textContent = `${obj.size} bytes (${obj.compressedSize} bytes deflated)`;
        modalObjectContent.textContent = obj.raw;
        modalBackdrop.classList.add("show");
    }

    function closeObjectModal() {
        modalBackdrop.classList.remove("show");
    }

    document.getElementById("modalCloseBtn").addEventListener("click", closeObjectModal);
    document.getElementById("modalFooterClose").addEventListener("click", closeObjectModal);
    modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) closeObjectModal();
    });

    // Edit File Modal
    const editModalBackdrop = document.getElementById("editModalBackdrop");
    const editModalFileName = document.getElementById("editModalFileName");
    const editModalContent = document.getElementById("editModalContent");

    document.getElementById("btnEditSelectedFile").addEventListener("click", () => {
        if (!selectedFilePath || !engine.workingDir.has(selectedFilePath)) return;
        editModalFileName.textContent = `Edit: ${selectedFilePath}`;
        editModalContent.value = engine.workingDir.get(selectedFilePath);
        editModalBackdrop.classList.add("show");
    });

    document.getElementById("editModalCloseBtn").addEventListener("click", () => editModalBackdrop.classList.remove("show"));
    document.getElementById("editModalCancel").addEventListener("click", () => editModalBackdrop.classList.remove("show"));
    document.getElementById("editModalSave").addEventListener("click", () => {
        if (selectedFilePath) {
            engine.workingDir.set(selectedFilePath, editModalContent.value);
            editModalBackdrop.classList.remove("show");
            terminal.print(`Updated working copy of <span class="term-cmd">${selectedFilePath}</span>. Run <span class="term-cmd">mgit status</span> or <span class="term-cmd">mgit add</span> to inspect.`, "term-success");
            syncAllUI();
        }
    });

    // ==========================================
    // Quick Actions & Controls
    // ==========================================

    // New change helper
    let changeCounter = 1;
    document.getElementById("btnQuickFile").addEventListener("click", () => {
        const filename = `service_${changeCounter}.cpp`;
        const content = `// Service module #${changeCounter}\nvoid handleRequest() {\n    // Implementation logic\n}\n`;
        engine.workingDir.set(filename, content);
        selectedFilePath = filename;
        changeCounter++;
        terminal.print(`Created new file in working directory: <span class="term-cmd">${filename}</span>`, "term-success");
        syncAllUI();
    });

    // Quick Add
    document.getElementById("btnQuickAdd").addEventListener("click", () => {
        terminal.execute("mgit add .");
    });

    // Quick Commit
    document.getElementById("btnQuickCommit").addEventListener("click", () => {
        const status = engine.status();
        if (status.staged.length === 0) {
            if (status.unstaged.length > 0 || status.untracked.length > 0) {
                terminal.execute("mgit add .");
            } else {
                terminal.print("nothing to commit, working tree clean", "term-error");
                return;
            }
        }
        const msgs = [
            "feat: optimize CAS fan-out directory hashing",
            "refactor: modularize filesystem abstractions",
            "fix: edge case handling in commit parent DAG linking",
            "perf: enhance zlib deflation buffer throughput"
        ];
        const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
        terminal.execute(`mgit commit -m "${randomMsg}"`);
    });

    // Quick Branch
    let branchCounter = 1;
    document.getElementById("btnQuickBranch").addEventListener("click", () => {
        const bName = `feature/module-${branchCounter++}`;
        terminal.execute(`mgit branch ${bName}`);
        terminal.execute(`mgit checkout ${bName}`);
    });

    // Reset Demo
    document.getElementById("btnResetDemo").addEventListener("click", () => {
        engine.reset();
        terminal.body.innerHTML = `
            <div class="terminal-line system-welcome">
                Repository reset to initial clean demo state.<br>
                Type <span class="term-cmd">help</span> for available commands, or click any quick action above.
            </div>
        `;
        syncAllUI();
    });

    // Command Chips
    document.querySelectorAll(".chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const cmd = chip.getAttribute("data-cmd");
            terminal.execute(cmd);
        });
    });

    // Tabs Switcher
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

            tab.classList.add("active");
            const targetId = tab.getAttribute("data-tab");
            document.getElementById(targetId).classList.add("active");
        });
    });

    // Zoom Controls
    document.getElementById("btnZoomIn").addEventListener("click", () => visualizer.zoom(0.2));
    document.getElementById("btnZoomOut").addEventListener("click", () => visualizer.zoom(-0.2));
    document.getElementById("btnZoomFit").addEventListener("click", () => visualizer.fitView());

    // Initial render
    syncAllUI();
});
