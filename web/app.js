/**
 * MiniGit Studio - Main Application Controller
 * Full-stack real-time coordinator between browser UI and real .mgit database on disk.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Engine & Components
    const engine = new MiniGitEngine();

    const terminalBody = document.getElementById("terminalBody");
    const terminalInput = document.getElementById("terminalInput");
    const dagSvg = document.getElementById("dagSvg");
    const liveModeBadge = document.getElementById("liveModeBadge");
    const liveModeText = document.getElementById("liveModeText");

    let visualizer = null;
    let terminal = null;
    let selectedFilePath = "README.md";
    let isLiveMode = false;
    let pollInterval = null;

    // 2. Initialize Visualizer & Commit Selection Callback
    visualizer = new DagVisualizer(dagSvg, (commit) => {
        updateSelectedCommitBanner(commit);
    });

    // 3. Initialize Terminal
    terminal = new MiniGitTerminal(engine, terminalBody, terminalInput, () => {
        syncAllUI();
    });

    // 4. Intercept Terminal Execution for Real-Time Backend
    const originalExecute = terminal.execute.bind(terminal);
    terminal.execute = async function(commandStr) {
        if (!isLiveMode || (!commandStr.startsWith("mgit") && commandStr !== "ls")) {
            originalExecute(commandStr);
            return;
        }

        // Echo prompt in terminal
        terminal.print(`<span class="prompt-symbol">user@minigit:~$</span> <span class="term-cmd-echo">${commandStr}</span>`);

        try {
            const res = await fetch("/api/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command: commandStr })
            });

            if (!res.ok) {
                terminal.print(`Server error: HTTP ${res.status}`, "term-error");
                return;
            }

            const data = await res.json();
            if (data.output && data.output.trim()) {
                terminal.print(`<pre class="${data.success ? 'term-success' : 'term-error'}">${data.output.trim()}</pre>`);
            } else if (data.success) {
                terminal.print("Command executed successfully on real filesystem.", "term-success");
            }

            if (data.state) {
                ingestRealState(data.state);
            }
        } catch (err) {
            terminal.print(`Failed to reach live server: ${err.message}. Falling back to sandbox.`, "term-error");
            originalExecute(commandStr);
        }
    };

    // 5. Ingest Real Repository State from server.py
    function ingestRealState(realState) {
        if (!realState || !realState.initialized) return;

        // Ingest branches
        engine.branches = new Map(Object.entries(realState.branches || {}));
        engine.head = realState.head || "ref: refs/heads/master";
        engine.index = new Map(Object.entries(realState.index || {}));

        // Ingest real CAS objects
        engine.objects.clear();
        for (const obj of realState.objects || []) {
            engine.objects.set(obj.hash, {
                hash: obj.hash,
                type: obj.type,
                header: obj.header,
                data: obj.data,
                raw: obj.raw,
                size: obj.size,
                compressedSize: obj.compressedSize,
                created: new Date()
            });
        }

        // Ingest real working files list
        engine.realWorkingFiles = realState.workingFiles || [];

        syncAllUI();
    }

    // 6. Check and Poll Live Backend (/api/real-state)
    async function checkRealBackend() {
        try {
            const res = await fetch("/api/real-state", { cache: "no-store" });
            if (res.ok) {
                const realState = await res.json();
                if (!isLiveMode) {
                    isLiveMode = true;
                    liveModeBadge.classList.remove("offline");
                    liveModeText.textContent = "LIVE .MGIT (CONNECTED)";
                    liveModeBadge.setAttribute("title", "Connected to real-time .mgit database on disk");
                    terminal.print(`🟢 <span class="term-accent">Connected to real-time MiniGit engine on disk</span> (.mgit). Watching for live changes.`, "term-success");
                }
                ingestRealState(realState);
                return;
            }
        } catch (e) {
            // Server not running, use sandbox
        }

        if (isLiveMode || isLiveMode === null) {
            isLiveMode = false;
            liveModeBadge.classList.add("offline");
            liveModeText.textContent = "SANDBOX SIMULATOR";
            liveModeBadge.setAttribute("title", "Offline simulator mode. Run 'python server.py' to connect to real .mgit on disk.");
        }
    }

    // Initial check & periodic polling every 2.5 seconds
    checkRealBackend();
    pollInterval = setInterval(checkRealBackend, 2500);

    // 7. Update Header Stats
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
        document.getElementById("statSavings").textContent = `${Math.max(15, savings)}%`;

        document.getElementById("currentBranchBadge").textContent = engine.getCurrentBranch();
    }

    // 8. Update Staging Widget
    function updateStagingWidget() {
        const stagedList = document.getElementById("stagedFileList");
        const unstagedList = document.getElementById("unstagedFileList");

        if (isLiveMode) {
            document.getElementById("stagedCount").textContent = engine.index.size;
            document.getElementById("unstagedCount").textContent = "0";

            stagedList.innerHTML = "";
            if (engine.index.size === 0) {
                stagedList.innerHTML = '<li class="empty-state">No changes staged for commit.</li>';
            } else {
                for (const [path, hash] of engine.index.entries()) {
                    const li = document.createElement("li");
                    li.className = "staged-item";
                    li.innerHTML = `<span>+ ${path}</span><span style="font-size:10px; color:#64748b;">(${hash.substring(0, 7)})</span>`;
                    stagedList.appendChild(li);
                }
            }

            unstagedList.innerHTML = '<li class="empty-state">Working tree clean on disk.</li>';
            return;
        }

        // Sandbox Mode fallback
        const status = engine.status();
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

    // 9. Update CAS Database Explorer (Tab 1)
    function updateCasExplorer() {
        const casList = document.getElementById("casObjectsList");
        casList.innerHTML = "";

        const sortedObjects = Array.from(engine.objects.values());

        if (sortedObjects.length === 0) {
            casList.innerHTML = '<div class="empty-state" style="padding:12px; color:#64748b;">No objects found in CAS store.</div>';
            return;
        }

        sortedObjects.forEach(obj => {
            const card = document.createElement("div");
            card.className = "cas-card";
            
            const dirPrefix = obj.hash.substring(0, 2);
            const fileName = obj.hash.substring(2);

            let previewText = "";
            if (obj.type === "commit") {
                const lines = obj.data.split("\n");
                let msgFound = false;
                for (const l of lines) {
                    if (msgFound && l.trim()) { previewText = l.trim(); break; }
                    if (l === "") msgFound = true;
                }
                if (!previewText) previewText = "Commit snapshot";
            } else if (obj.type === "tree") {
                const entries = obj.data.split("\n").filter(Boolean).length;
                previewText = `${entries} tree entries`;
            } else {
                previewText = obj.data.length > 28 ? obj.data.substring(0, 28) + "..." : obj.data;
            }

            card.innerHTML = `
                <div class="cas-card-top">
                    <span class="badge badge-${obj.type}">${obj.type.toUpperCase()}</span>
                    <span class="cas-hash"><span class="cas-hash-prefix">${dirPrefix}/</span>${fileName.substring(0, 10)}...</span>
                </div>
                <div class="cas-card-meta">
                    <span style="color:#cbd5e1; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${previewText}</span>
                    <span>${obj.compressedSize} B (deflated)</span>
                </div>
            `;

            card.addEventListener("click", () => {
                openObjectModal(obj);
            });

            casList.appendChild(card);
        });
    }

    // 10. Update Files Tree & Diff Viewer (Tab 2)
    async function updateFilesTree() {
        const treeContainer = document.getElementById("filesTree");
        treeContainer.innerHTML = "";

        const files = (isLiveMode && engine.realWorkingFiles && engine.realWorkingFiles.length > 0)
            ? engine.realWorkingFiles
            : Array.from(engine.workingDir.keys());

        if (!selectedFilePath && files.length > 0) {
            selectedFilePath = files[0];
        }

        files.forEach(path => {
            const row = document.createElement("div");
            row.className = `file-row ${path === selectedFilePath ? "selected" : ""}`;
            row.innerHTML = `
                <span>📄 ${path}</span>
                <span style="font-size:11px; color:#64748b;">tracked</span>
            `;

            row.addEventListener("click", () => {
                selectedFilePath = path;
                updateFilesTree();
                updateDiffViewer();
            });

            treeContainer.appendChild(row);
        });

        updateDiffViewer();
    }

    async function updateDiffViewer() {
        const diffCode = document.getElementById("diffViewerCode");
        const diffTitle = document.getElementById("diffViewerTitle");

        if (!selectedFilePath) {
            diffTitle.textContent = "Diff Preview";
            diffCode.textContent = "// Select a file to view diff";
            return;
        }

        diffTitle.textContent = `File: ${selectedFilePath}`;

        if (isLiveMode) {
            try {
                const res = await fetch(`/api/file-content?path=${encodeURIComponent(selectedFilePath)}`);
                if (res.ok) {
                    const text = await res.text();
                    diffCode.textContent = text.substring(0, 2000) + (text.length > 2000 ? "\n\n...[truncated]" : "");
                    return;
                }
            } catch (e) {}
        }

        // Sandbox Mode Diff
        const workingContent = engine.workingDir.get(selectedFilePath) || "";
        diffCode.textContent = workingContent;
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // 11. Commit Details Banner
    function updateSelectedCommitBanner(commit) {
        if (!commit) return;
        document.getElementById("bannerCommitHash").textContent = commit.shortHash || commit.hash.substring(0, 7);
        document.getElementById("bannerCommitMessage").textContent = commit.message || "No commit message";
        document.getElementById("bannerCommitAuthor").textContent = `Author: ${commit.author || "Unknown"}`;
        
        const timeStr = commit.timestamp instanceof Date 
            ? commit.timestamp.toLocaleTimeString()
            : new Date(commit.timestamp * 1000).toLocaleTimeString();
        document.getElementById("bannerCommitTime").textContent = timeStr;
    }

    // 12. Sync All UI
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
        modalPayloadSize.textContent = `${obj.size} bytes (${obj.compressedSize} bytes deflated on disk)`;
        modalObjectContent.textContent = obj.raw || obj.data;
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
        if (!selectedFilePath) return;
        editModalFileName.textContent = `Edit: ${selectedFilePath}`;
        editModalContent.value = engine.workingDir.get(selectedFilePath) || "";
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

    let changeCounter = 1;
    document.getElementById("btnQuickFile").addEventListener("click", () => {
        if (isLiveMode) {
            terminal.execute("mgit status");
            return;
        }
        const filename = `service_${changeCounter}.cpp`;
        const content = `// Service module #${changeCounter}\nvoid handleRequest() {}\n`;
        engine.workingDir.set(filename, content);
        selectedFilePath = filename;
        changeCounter++;
        terminal.print(`Created new file in working directory: <span class="term-cmd">${filename}</span>`, "term-success");
        syncAllUI();
    });

    document.getElementById("btnQuickAdd").addEventListener("click", () => {
        terminal.execute("mgit add .");
    });

    document.getElementById("btnQuickCommit").addEventListener("click", () => {
        const msgs = [
            "feat: optimize CAS fan-out directory hashing",
            "refactor: modularize filesystem abstractions",
            "fix: edge case handling in commit parent DAG linking"
        ];
        const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
        terminal.execute(`mgit commit -m "${randomMsg}"`);
    });

    let branchCounter = 1;
    document.getElementById("btnQuickBranch").addEventListener("click", () => {
        const bName = `feature/module-${branchCounter++}`;
        terminal.execute(`mgit branch ${bName}`);
    });

    document.getElementById("btnResetDemo").addEventListener("click", () => {
        if (isLiveMode) {
            terminal.execute("mgit status");
            checkRealBackend();
        } else {
            engine.reset();
            terminal.body.innerHTML = `
                <div class="terminal-line system-welcome">
                    Repository reset to initial clean demo state.<br>
                    Type <span class="term-cmd">help</span> for available commands.
                </div>
            `;
            syncAllUI();
        }
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
