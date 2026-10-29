#!/usr/bin/env python3
"""
MiniGit Live Server & Full-Stack API Bridge
Serves MiniGit Studio web interface and provides real-time REST API endpoints
connected directly to the real .mgit database and filesystem.
"""

import http.server
import socketserver
import os
import sys
import json
import zlib
import hashlib
import subprocess
import glob
from urllib.parse import urlparse, parse_qs

PORT = 8080
REPO_ROOT = os.path.abspath(os.path.dirname(__file__))
MGIT_DIR = os.path.join(REPO_ROOT, ".mgit")
WEB_DIR = os.path.join(REPO_ROOT, "web")

def parse_git_object(raw_data):
    """Parses decompressed Git/MiniGit object bytes into (type, header, payload)."""
    null_idx = raw_data.find(b"\x00")
    if null_idx == -1:
        return "blob", "", raw_data.decode("utf-8", errors="replace")
    
    header = raw_data[:null_idx].decode("utf-8", errors="replace")
    obj_type = header.split(" ")[0]
    payload = raw_data[null_idx + 1:]
    
    return obj_type, header, payload

def get_real_mgit_state():
    """Reads real .mgit filesystem state and returns a complete structured dictionary."""
    if not os.path.exists(MGIT_DIR):
        return {
            "initialized": False,
            "head": None,
            "currentBranch": None,
            "branches": {},
            "commits": [],
            "objects": [],
            "index": {},
            "workingDir": []
        }

    # 1. Read HEAD
    head_content = ""
    head_file = os.path.join(MGIT_DIR, "HEAD")
    current_branch = "master"
    if os.path.exists(head_file):
        with open(head_file, "r") as f:
            head_content = f.read().strip()
        if head_content.startswith("ref: refs/heads/"):
            current_branch = head_content.replace("ref: refs/heads/", "")
        elif head_content.startswith("ref: "):
            current_branch = head_content.replace("ref: ", "")

    # 2. Read Branches (refs/heads/*)
    branches = {}
    refs_heads = os.path.join(MGIT_DIR, "refs", "heads")
    if os.path.exists(refs_heads):
        for b_name in os.listdir(refs_heads):
            b_path = os.path.join(refs_heads, b_name)
            if os.path.isfile(b_path):
                with open(b_path, "r") as f:
                    branches[b_name] = f.read().strip()

    # 3. Read Staging Area (.mgit/index)
    index_entries = {}
    index_file = os.path.join(MGIT_DIR, "index")
    if os.path.exists(index_file):
        with open(index_file, "r") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                # Support "hash path" or "path hash"
                parts = line.split(" ", 1)
                if len(parts) == 2:
                    if len(parts[0]) == 40:
                        index_entries[parts[1]] = parts[0]
                    else:
                        index_entries[parts[0]] = parts[1]

    # 4. Read Real CAS Objects (.mgit/objects/xx/xxxx...)
    objects_dict = {}
    objects_list = []
    obj_base = os.path.join(MGIT_DIR, "objects")
    if os.path.exists(obj_base):
        for prefix in os.listdir(obj_base):
            prefix_dir = os.path.join(obj_base, prefix)
            if os.path.isdir(prefix_dir) and len(prefix) == 2:
                for file_name in os.listdir(prefix_dir):
                    full_hash = prefix + file_name
                    obj_path = os.path.join(prefix_dir, file_name)
                    if os.path.isfile(obj_path):
                        compressed_size = os.path.getsize(obj_path)
                        try:
                            with open(obj_path, "rb") as f:
                                comp_bytes = f.read()
                            decomp_bytes = zlib.decompress(comp_bytes)
                            obj_type, header, payload = parse_git_object(decomp_bytes)
                            
                            payload_str = payload.decode("utf-8", errors="replace") if isinstance(payload, bytes) else str(payload)
                            
                            obj_info = {
                                "hash": full_hash,
                                "type": obj_type,
                                "header": header,
                                "compressedSize": compressed_size,
                                "size": len(decomp_bytes),
                                "data": payload_str,
                                "raw": header + "\0" + payload_str
                            }
                            objects_dict[full_hash] = obj_info
                            objects_list.append(obj_info)
                        except Exception as e:
                            # Skip unreadable or corrupted object
                            pass

    # 5. Build Commit DAG Graph from Real Commits
    commits_map = {}
    for obj in objects_list:
        if obj["type"] == "commit":
            commit_text = obj["data"]
            parent_hash = None
            tree_hash = None
            author = "Unknown"
            message = ""

            lines = commit_text.split("\n")
            in_message = False
            msg_lines = []

            for line in lines:
                if in_message:
                    msg_lines.append(line)
                elif line == "":
                    in_message = True
                elif line.startswith("tree "):
                    tree_hash = line.split(" ")[1].strip()
                elif line.startswith("parent "):
                    parent_hash = line.split(" ")[1].strip()
                elif line.startswith("author "):
                    author = line[7:].strip()

            message = "\n".join(msg_lines).strip()

            # Find matching branch labels
            matching_branches = [b for b, h in branches.items() if h == obj["hash"]]

            commits_map[obj["hash"]] = {
                "hash": obj["hash"],
                "shortHash": obj["hash"][:7],
                "parent": parent_hash,
                "tree": tree_hash,
                "author": author,
                "message": message,
                "branchNames": matching_branches,
                "timestamp": os.path.getmtime(os.path.join(obj_base, obj["hash"][:2], obj["hash"][2:]))
            }

    # 6. Real Working Directory Files
    working_files = []
    ignore_set = {".git", ".mgit", "build", "__pycache__", ".vscode", "web"}
    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if d not in ignore_set]
        for f in files:
            if not f.endswith((".exe", ".obj", ".lib", ".dll", ".zip")):
                rel_path = os.path.relpath(os.path.join(root, f), REPO_ROOT).replace("\\", "/")
                working_files.append(rel_path)

    return {
        "initialized": True,
        "head": head_content,
        "currentBranch": current_branch,
        "branches": branches,
        "commits": list(commits_map.values()),
        "objects": objects_list,
        "index": index_entries,
        "workingFiles": sorted(working_files)
    }

class MiniGitAPIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        
        # Real-Time API Endpoint: /api/real-state
        if parsed.path == "/api/real-state":
            state = get_real_mgit_state()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.end_headers()
            self.wfile.write(json.dumps(state).encode("utf-8"))
            return

        # Real-Time API Endpoint: /api/file-content?path=...
        if parsed.path == "/api/file-content":
            params = parse_qs(parsed.query)
            file_rel = params.get("path", [""])[0]
            full_path = os.path.abspath(os.path.join(REPO_ROOT, file_rel))

            # Security check: must be inside REPO_ROOT
            if not full_path.startswith(REPO_ROOT) or not os.path.isfile(full_path):
                self.send_response(404)
                self.end_headers()
                return

            with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content.encode("utf-8"))
            return

        # Serve static web files
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)

        # Real-Time Command Execution Endpoint: /api/execute
        if parsed.path == "/api/execute":
            content_len = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_len).decode("utf-8")
            data = json.loads(post_body) if post_body else {}
            cmd_str = data.get("command", "").strip()

            output = ""
            success = True

            # If user types "mgit ...", execute real mgit.py
            if cmd_str.startswith("mgit"):
                args = cmd_str.split()[1:]
                python_exe = sys.executable
                script_path = os.path.join(REPO_ROOT, "mgit.py")
                
                try:
                    result = subprocess.run(
                        [python_exe, script_path] + args,
                        cwd=REPO_ROOT,
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    output = result.stdout or result.stderr
                    if result.returncode != 0:
                        success = False
                except Exception as e:
                    output = f"Execution error: {str(e)}"
                    success = False
            else:
                output = f"Command not allowed: {cmd_str}"
                success = False

            # Refresh real state
            updated_state = get_real_mgit_state()

            resp = {
                "success": success,
                "output": output,
                "state": updated_state
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(resp).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MiniGitAPIHandler) as httpd:
        print(f"============================================================")
        print(f" MiniGit Studio Live Server Running on http://localhost:{PORT}")
        print(f" Connected to Real Repository: {REPO_ROOT}")
        print(f" Real .mgit Database: {MGIT_DIR}")
        print(f"============================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    run_server()
