/**
 * MiniGit Virtual Terminal Emulator
 * Handles command line execution, command history, and formatted terminal outputs.
 */

class MiniGitTerminal {
    constructor(engine, terminalBody, inputElement, onStateChange) {
        this.engine = engine;
        this.body = terminalBody;
        this.input = inputElement;
        this.onStateChange = onStateChange;

        this.history = [];
        this.historyIndex = -1;

        this.setupListeners();
    }

    setupListeners() {
        this.input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const cmd = this.input.value.trim();
                if (cmd) {
                    this.execute(cmd);
                    this.history.push(cmd);
                    this.historyIndex = this.history.length;
                    this.input.value = "";
                }
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.input.value = this.history[this.historyIndex];
                }
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.input.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    this.input.value = "";
                }
            }
        });
    }

    print(text, className = "") {
        const line = document.createElement("div");
        line.className = `terminal-line ${className}`;
        line.innerHTML = text;
        this.body.appendChild(line);
        this.body.scrollTop = this.body.scrollHeight;
    }

    execute(commandStr) {
        // Echo command
        this.print(`<span class="prompt-symbol">user@minigit:~$</span> <span class="term-cmd-echo">${commandStr}</span>`);

        const parts = commandStr.trim().split(/\s+/);
        const baseCmd = parts[0];

        try {
            if (baseCmd === "clear") {
                this.body.innerHTML = "";
                return;
            }

            if (baseCmd === "help") {
                this.printHelp();
                return;
            }

            if (baseCmd === "ls") {
                let out = "";
                for (const path of this.engine.workingDir.keys()) {
                    out += `<div>📄 ${path}</div>`;
                }
                this.print(out);
                return;
            }

            if (baseCmd === "cat") {
                const target = parts[1];
                if (!target) {
                    this.print("cat: missing file operand", "term-error");
                    return;
                }
                if (target === ".mgit/HEAD") {
                    this.print(`ref: ${this.engine.head}`);
                    return;
                }
                if (this.engine.workingDir.has(target)) {
                    this.print(`<pre>${this.engine.workingDir.get(target)}</pre>`);
                    return;
                }
                this.print(`cat: ${target}: No such file or directory`, "term-error");
                return;
            }

            if (baseCmd !== "mgit") {
                this.print(`command not found: ${baseCmd}. Type <span class="term-cmd">help</span> for commands.`, "term-error");
                return;
            }

            const subCmd = parts[1];

            switch (subCmd) {
                case "init":
                    this.engine.reset();
                    this.print("Initialized empty MiniGit repository in .mgit/", "term-success");
                    break;

                case "status": {
                    const status = this.engine.status();
                    let out = `On branch <span class="term-accent">${status.branch}</span><br>`;
                    
                    if (status.staged.length > 0) {
                        out += `<br><span class="term-success">Changes to be committed:</span><br>`;
                        status.staged.forEach(f => out += `&nbsp;&nbsp;<span class="term-success">modified: &nbsp;${f}</span><br>`);
                    }

                    if (status.unstaged.length > 0) {
                        out += `<br><span class="term-error">Changes not staged for commit:</span><br>`;
                        status.unstaged.forEach(f => out += `&nbsp;&nbsp;<span class="term-error">modified: &nbsp;${f}</span><br>`);
                    }

                    if (status.untracked.length > 0) {
                        out += `<br><span class="term-error">Untracked files:</span><br>`;
                        status.untracked.forEach(f => out += `&nbsp;&nbsp;<span class="term-error">${f}</span><br>`);
                    }

                    if (status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0) {
                        out += "nothing to commit, working tree clean";
                    }
                    this.print(out);
                    break;
                }

                case "add": {
                    const pathArg = parts[2];
                    if (!pathArg) {
                        this.print("fatal: nothing specified, nothing added.", "term-error");
                        return;
                    }
                    if (pathArg === "." || pathArg === "-A") {
                        const added = this.engine.addAll();
                        this.print(`Staged ${added.length} file(s) into index.`, "term-success");
                    } else {
                        const result = this.engine.add(pathArg);
                        this.print(`Staged <span class="term-cmd">${result.filePath}</span> (blob: ${result.blobHash.substring(0, 7)})`, "term-success");
                    }
                    break;
                }

                case "commit": {
                    let message = "";
                    const mIdx = parts.indexOf("-m");
                    if (mIdx !== -1 && parts[mIdx + 1]) {
                        message = parts.slice(mIdx + 1).join(" ").replace(/^["']|["']$/g, "");
                    } else {
                        this.print("Aborting commit due to empty commit message. Use: mgit commit -m 'message'", "term-error");
                        return;
                    }

                    const res = this.engine.commit(message);
                    this.print(`[${res.branch} ${res.commitHash.substring(0, 7)}] ${res.message}`, "term-success");
                    break;
                }

                case "branch": {
                    const branchName = parts[2];
                    if (!branchName) {
                        const branches = this.engine.branch();
                        let out = "";
                        branches.forEach(b => {
                            if (b.isCurrent) {
                                out += `<span class="term-success">* ${b.name}</span><br>`;
                            } else {
                                out += `&nbsp;&nbsp;${b.name}<br>`;
                            }
                        });
                        this.print(out);
                    } else {
                        this.engine.branch(branchName);
                        this.print(`Created branch '<span class="term-accent">${branchName}</span>'`, "term-success");
                    }
                    break;
                }

                case "checkout": {
                    const branchName = parts[2];
                    if (!branchName) {
                        this.print("fatal: missing branch name to checkout.", "term-error");
                        return;
                    }
                    const res = this.engine.checkout(branchName);
                    this.print(`Switched to branch '<span class="term-accent">${res.branch || res.detached}</span>'`, "term-success");
                    break;
                }

                case "log": {
                    const logs = this.engine.log();
                    if (logs.length === 0) {
                        this.print("fatal: current branch does not have any commits yet.", "term-error");
                        return;
                    }
                    let out = "";
                    logs.forEach(c => {
                        out += `<span class="term-accent">commit ${c.hash}</span><br>`;
                        out += `Author: ${c.author}<br>`;
                        out += `Date:   ${c.timestamp.toLocaleString()}<br><br>`;
                        out += `&nbsp;&nbsp;&nbsp;&nbsp;${c.message}<br><br>`;
                    });
                    this.print(out);
                    break;
                }

                case "hash-object": {
                    const writeFlag = parts[2] === "-w";
                    const file = writeFlag ? parts[3] : parts[2];
                    if (!file || !this.engine.workingDir.has(file)) {
                        this.print(`fatal: Cannot open '${file}': No such file`, "term-error");
                        return;
                    }
                    const data = this.engine.workingDir.get(file);
                    const hash = this.engine.hashObject(data, "blob", writeFlag);
                    this.print(`<span class="term-cmd">${hash}</span>`);
                    break;
                }

                default:
                    this.print(`Unknown command: 'mgit ${subCmd || ""}'. Type <span class="term-cmd">help</span> for commands.`, "term-error");
                    break;
            }

            if (this.onStateChange) {
                this.onStateChange();
            }

        } catch (err) {
            this.print(`fatal: ${err.message}`, "term-error");
        }
    }

    printHelp() {
        const helpText = `
<span class="term-accent">MiniGit Supported Commands:</span>
  <span class="term-cmd">mgit init</span>                      Initialize repository schema
  <span class="term-cmd">mgit status</span>                    Show working tree and staging status
  <span class="term-cmd">mgit add &lt;file|.&gt;</span>              Stage file(s) into index
  <span class="term-cmd">mgit commit -m "&lt;msg&gt;"</span>         Record snapshot in commit DAG
  <span class="term-cmd">mgit branch [name]</span>             List or create branches
  <span class="term-cmd">mgit checkout &lt;branch&gt;</span>         Switch branches and restore tree
  <span class="term-cmd">mgit log</span>                       Display commit DAG backwards
  <span class="term-cmd">mgit hash-object [-w] &lt;f&gt;</span>      Compute SHA-1 hash (write with -w)
  <span class="term-cmd">ls</span>, <span class="term-cmd">cat &lt;file&gt;</span>, <span class="term-cmd">clear</span>           Virtual filesystem inspection
`;
        this.print(helpText);
    }
}

window.MiniGitTerminal = MiniGitTerminal;
