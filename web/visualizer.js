/**
 * MiniGit DAG Visualizer - Interactive SVG Commit Graph
 * Computes topological branches, coordinates, bezier curves, and branch badges.
 */

class DagVisualizer {
    constructor(svgElement, onCommitSelect) {
        this.svg = svgElement;
        this.edgesGroup = document.getElementById("dagEdgesGroup");
        this.nodesGroup = document.getElementById("dagNodesGroup");
        this.onCommitSelect = onCommitSelect;
        
        this.scale = 1.0;
        this.panX = 30;
        this.panY = 40;
        this.selectedCommitHash = null;

        this.setupPanAndZoom();
    }

    setupPanAndZoom() {
        let isDragging = false;
        let startX, startY;

        this.svg.addEventListener("mousedown", (e) => {
            if (e.target.closest(".commit-node")) return;
            isDragging = true;
            startX = e.clientX - this.panX;
            startY = e.clientY - this.panY;
            this.svg.style.cursor = "grabbing";
        });

        window.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            this.panX = e.clientX - startX;
            this.panY = e.clientY - startY;
            this.applyTransform();
        });

        window.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                this.svg.style.cursor = "default";
            }
        });

        // Wheel Zoom
        this.svg.addEventListener("wheel", (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            this.scale = Math.min(Math.max(0.5, this.scale * zoomFactor), 2.5);
            this.applyTransform();
        });
    }

    zoom(delta) {
        this.scale = Math.min(Math.max(0.5, this.scale + delta), 2.5);
        this.applyTransform();
    }

    fitView() {
        this.scale = 1.0;
        this.panX = 40;
        this.panY = 40;
        this.applyTransform();
    }

    applyTransform() {
        const transformStr = `translate(${this.panX}, ${this.panY}) scale(${this.scale})`;
        this.edgesGroup.setAttribute("transform", transformStr);
        this.nodesGroup.setAttribute("transform", transformStr);
    }

    render(engine) {
        this.edgesGroup.innerHTML = "";
        this.nodesGroup.innerHTML = "";

        // 1. Collect all commits reachable from all branches & HEAD
        const commitsMap = new Map();
        const branchTips = new Map(); // commitHash -> [branchNames]
        
        for (const [branchName, commitHash] of engine.branches.entries()) {
            if (!branchTips.has(commitHash)) branchTips.set(commitHash, []);
            branchTips.get(commitHash).push(branchName);
        }

        const headCommit = engine.getHeadCommitHash();
        const currentBranch = engine.getCurrentBranch();

        // Traverse all commits reachable from branches
        for (const startHash of engine.branches.values()) {
            let cur = startHash;
            while (cur && !commitsMap.has(cur)) {
                const obj = engine.objects.get(cur);
                if (!obj || obj.type !== "commit") break;

                const parentMatch = obj.data.match(/^parent ([a-f0-9]{40})/m);
                const authorMatch = obj.data.match(/^author ([^\n<]+(?:<[^>]+>)?)/m);
                const dateMatch = obj.data.match(/^author [^<]+<[^>]+> (\d+)/m);
                const msgSplit = obj.data.split("\n\n");
                const message = msgSplit.slice(1).join("\n\n").trim();

                const parent = parentMatch ? parentMatch[1] : null;

                commitsMap.set(cur, {
                    hash: cur,
                    shortHash: cur.substring(0, 7),
                    parent,
                    children: [],
                    author: authorMatch ? authorMatch[1].trim() : "Unknown",
                    timestamp: dateMatch ? new Date(parseInt(dateMatch[1]) * 1000) : new Date(),
                    message,
                    branchNames: branchTips.get(cur) || []
                });

                cur = parent;
            }
        }

        // Also discover any additional commit objects stored in CAS
        for (const obj of engine.objects.values()) {
            if (obj.type === "commit" && !commitsMap.has(obj.hash)) {
                const parentMatch = obj.data.match(/^parent ([a-f0-9]{40})/m);
                const authorMatch = obj.data.match(/^author ([^\n<]+(?:<[^>]+>)?)/m);
                const dateMatch = obj.data.match(/^author [^<]+<[^>]+> (\d+)/m);
                const msgSplit = obj.data.split("\n\n");
                const message = msgSplit.slice(1).join("\n\n").trim();

                commitsMap.set(obj.hash, {
                    hash: obj.hash,
                    shortHash: obj.hash.substring(0, 7),
                    parent: parentMatch ? parentMatch[1] : null,
                    children: [],
                    author: authorMatch ? authorMatch[1].trim() : "Unknown",
                    timestamp: dateMatch ? new Date(parseInt(dateMatch[1]) * 1000) : new Date(),
                    message,
                    branchNames: branchTips.get(obj.hash) || []
                });
            }
        }

        if (commitsMap.size === 0) return;

        // Build child links
        for (const [hash, commit] of commitsMap.entries()) {
            if (commit.parent && commitsMap.has(commit.parent)) {
                commitsMap.get(commit.parent).children.push(hash);
            }
        }

        // 2. Assign Lanes and Coordinates (Topological Layout)
        const sortedCommits = Array.from(commitsMap.values()).sort((a, b) => {
            if (a.parent === b.hash) return -1;
            if (b.parent === a.hash) return 1;
            return (b.timestamp || 0) - (a.timestamp || 0);
        });

        const lanes = []; // commitHash -> laneIndex
        const commitPositions = new Map(); // commitHash -> {x, y, lane}
        const ySpacing = 75;
        const xSpacing = 160;

        sortedCommits.forEach((commit, index) => {
            let assignedLane = 0;
            // If parent has a lane, feature branches diverge to the right
            if (commit.branchNames.some(b => b.includes("feature") || b.includes("fix"))) {
                assignedLane = 1;
            } else if (commit.branchNames.length > 0 && !commit.branchNames.includes("master")) {
                assignedLane = 2;
            }

            const x = 80 + assignedLane * xSpacing;
            const y = 50 + index * ySpacing;
            commitPositions.set(commit.hash, { x, y, lane: assignedLane });
        });

        // 3. Render Edges (Parent -> Child connections)
        sortedCommits.forEach(commit => {
            if (commit.parent && commitPositions.has(commit.parent)) {
                const childPos = commitPositions.get(commit.hash);
                const parentPos = commitPositions.get(commit.parent);

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                
                // Smooth bezier curve connecting child to parent
                const d = `M ${childPos.x} ${childPos.y} C ${childPos.x} ${(childPos.y + parentPos.y) / 2}, ${parentPos.x} ${(childPos.y + parentPos.y) / 2}, ${parentPos.x} ${parentPos.y}`;
                path.setAttribute("d", d);
                path.setAttribute("class", "dag-edge");
                this.edgesGroup.appendChild(path);
            }
        });

        // 4. Render Nodes & Labels
        sortedCommits.forEach(commit => {
            const pos = commitPositions.get(commit.hash);
            const isHead = commit.hash === headCommit;
            const isSelected = commit.hash === this.selectedCommitHash;

            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("class", `commit-node ${isSelected ? "selected" : ""}`);
            g.setAttribute("data-hash", commit.hash);

            // Halo pulse if HEAD
            if (isHead) {
                const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                halo.setAttribute("cx", pos.x);
                halo.setAttribute("cy", pos.y);
                halo.setAttribute("r", 20);
                halo.setAttribute("class", "head-halo");
                halo.setAttribute("fill", "none");
                halo.setAttribute("stroke", "#6366f1");
                g.appendChild(halo);
            }

            // Outer node circle
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", pos.x);
            circle.setAttribute("cy", pos.y);
            circle.setAttribute("r", 14);
            circle.setAttribute("class", "node-circle");
            circle.setAttribute("fill", pos.lane === 0 ? "#6366f1" : "#10b981");
            circle.setAttribute("stroke", "#1e293b");
            circle.setAttribute("stroke-width", "3");
            g.appendChild(circle);

            // Inner circle dot
            const innerDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            innerDot.setAttribute("cx", pos.x);
            innerDot.setAttribute("cy", pos.y);
            innerDot.setAttribute("r", 4);
            innerDot.setAttribute("fill", "#ffffff");
            g.appendChild(innerDot);

            // Commit SHA-1 Tag Label
            const textHash = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textHash.setAttribute("x", pos.x + 24);
            textHash.setAttribute("y", pos.y - 2);
            textHash.setAttribute("class", "node-hash-text");
            textHash.textContent = commit.shortHash;
            g.appendChild(textHash);

            // Commit Message Label
            const textMsg = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textMsg.setAttribute("x", pos.x + 90);
            textMsg.setAttribute("y", pos.y - 2);
            textMsg.setAttribute("class", "node-msg-text");
            textMsg.textContent = commit.message.length > 36 ? commit.message.substring(0, 36) + "..." : commit.message;
            g.appendChild(textMsg);

            // Branch Badges (e.g. HEAD -> master, feature/auth)
            let badgeOffsetX = pos.x + 24;
            const badgeY = pos.y + 12;

            commit.branchNames.forEach(bName => {
                const isCurrent = (bName === currentBranch);
                const labelText = isCurrent ? `HEAD -> ${bName}` : bName;
                const tagWidth = labelText.length * 7 + 14;

                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", badgeOffsetX);
                rect.setAttribute("y", badgeY);
                rect.setAttribute("width", tagWidth);
                rect.setAttribute("height", 18);
                rect.setAttribute("class", "branch-tag-rect");
                rect.setAttribute("fill", isCurrent ? "#4f46e5" : "#0f766e");
                rect.setAttribute("stroke", isCurrent ? "#818cf8" : "#2dd4bf");
                rect.setAttribute("stroke-width", "1");
                g.appendChild(rect);

                const tagText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                tagText.setAttribute("x", badgeOffsetX + 7);
                tagText.setAttribute("y", badgeY + 12);
                tagText.setAttribute("class", "branch-tag-text");
                tagText.setAttribute("fill", "#ffffff");
                tagText.textContent = labelText;
                g.appendChild(tagText);

                badgeOffsetX += tagWidth + 6;
            });

            // Click interaction
            g.addEventListener("click", () => {
                this.selectedCommitHash = commit.hash;
                this.render(engine); // re-render to update selected styling
                if (this.onCommitSelect) {
                    this.onCommitSelect(commit);
                }
            });

            this.nodesGroup.appendChild(g);
        });

        this.applyTransform();

        // Default selection to HEAD commit if nothing selected
        if (!this.selectedCommitHash && headCommit && commitsMap.has(headCommit)) {
            this.selectedCommitHash = headCommit;
            if (this.onCommitSelect) {
                this.onCommitSelect(commitsMap.get(headCommit));
            }
        }
    }
}

window.DagVisualizer = DagVisualizer;
