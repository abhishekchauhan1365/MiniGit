import sys
import os
import hashlib
import zlib
import time

def init():
    os.makedirs(".mgit/objects/info", exist_ok=True)
    os.makedirs(".mgit/objects/pack", exist_ok=True)
    os.makedirs(".mgit/refs/heads", exist_ok=True)
    os.makedirs(".mgit/refs/tags", exist_ok=True)
    with open(".mgit/HEAD", "w") as f:
        f.write("ref: refs/heads/master\n")
    print("Initialized empty MiniGit repository in .mgit")

def hash_object(data, obj_type):
    header = f"{obj_type} {len(data)}\0".encode()
    store = header + data if isinstance(data, bytes) else header + data.encode()
    sha1 = hashlib.sha1(store).hexdigest()
    compressed = zlib.compress(store)
    
    dir_name = sha1[:2]
    file_name = sha1[2:]
    
    os.makedirs(f".mgit/objects/{dir_name}", exist_ok=True)
    obj_path = f".mgit/objects/{dir_name}/{file_name}"
    
    if not os.path.exists(obj_path):
        with open(obj_path, "wb") as f:
            f.write(compressed)
            
    return sha1

def add(filepath):
    if not os.path.exists(filepath):
        print(f"fatal: pathspec '{filepath}' did not match any files")
        return
        
    with open(filepath, "rb") as f:
        data = f.read()
        
    sha1 = hash_object(data, "blob")
    
    index_entries = {}
    if os.path.exists(".mgit/index"):
        with open(".mgit/index", "r") as f:
            for line in f:
                if line.strip():
                    parts = line.strip().split(" ", 1)
                    if len(parts) == 2:
                        index_entries[parts[1]] = parts[0]
                        
    index_entries[filepath] = sha1
    
    with open(".mgit/index", "w") as f:
        for path, hash_val in index_entries.items():
            f.write(f"{hash_val} {path}\n")
            
def commit(message):
    if not os.path.exists(".mgit/index"):
        print("nothing to commit")
        return
        
    tree_content = b""
    with open(".mgit/index", "r") as f:
        for line in f:
            if line.strip():
                hash_val, path = line.strip().split(" ", 1)
                tree_content += f"100644 {path}\0".encode()
                tree_content += bytes.fromhex(hash_val)
                
    tree_hash = hash_object(tree_content, "tree")
    
    parent = ""
    if os.path.exists(".mgit/refs/heads/master"):
        with open(".mgit/refs/heads/master", "r") as f:
            parent = f.read().strip()
            
    commit_content = f"tree {tree_hash}\n"
    if parent:
        commit_content += f"parent {parent}\n"
    commit_content += f"author MiniGit User <user@example.com> 1700000000 +0000\n"
    commit_content += f"committer MiniGit User <user@example.com> 1700000000 +0000\n\n"
    commit_content += f"{message}\n"
    
    commit_hash = hash_object(commit_content, "commit")
    
    with open(".mgit/refs/heads/master", "w") as f:
        f.write(commit_hash + "\n")
        
    print(f"[master {commit_hash[:7]}] {message}")

def log():
    if not os.path.exists(".mgit/HEAD"):
        return
        
    with open(".mgit/HEAD", "r") as f:
        ref = f.read().strip()
        
    branch_path = ".mgit/" + ref.split(" ")[1] if ref.startswith("ref: ") else ".mgit/" + ref
    
    if not os.path.exists(branch_path):
        print("fatal: your current branch does not have any commits yet")
        return
        
    with open(branch_path, "r") as f:
        current_hash = f.read().strip()
        
    while current_hash:
        dir_name = current_hash[:2]
        file_name = current_hash[2:]
        obj_path = f".mgit/objects/{dir_name}/{file_name}"
        
        if not os.path.exists(obj_path):
            break
            
        with open(obj_path, "rb") as f:
            compressed = f.read()
            
        decompressed = zlib.decompress(compressed).decode('latin1')
        content = decompressed.split('\0', 1)[1]
        
        parent = ""
        author = ""
        message = ""
        parsing_msg = False
        
        for line in content.split('\n'):
            if parsing_msg:
                message += line + "\n"
            elif not line.strip():
                parsing_msg = True
            elif line.startswith("parent "):
                parent = line[7:].strip()
            elif line.startswith("author "):
                author = line[7:].strip()
                
        print(f"commit {current_hash}")
        print(f"Author: {author}\n")
        print(f"    {message.strip()}\n")
        
        current_hash = parent

def branch(name):
    if not os.path.exists(".mgit/HEAD"):
        return
        
    with open(".mgit/HEAD", "r") as f:
        ref = f.read().strip()
        
    branch_path = ".mgit/" + ref.split(" ")[1] if ref.startswith("ref: ") else ".mgit/" + ref
    
    if not os.path.exists(branch_path):
        print("fatal: not a valid object name: 'master'")
        return
        
    with open(branch_path, "r") as f:
        current_hash = f.read().strip()
        
    new_branch_path = f".mgit/refs/heads/{name}"
    if os.path.exists(new_branch_path):
        print(f"fatal: A branch named '{name}' already exists.")
        return
        
    with open(new_branch_path, "w") as f:
        f.write(current_hash + "\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "init": init()
    elif cmd == "add": add(sys.argv[2])
    elif cmd == "commit": commit(sys.argv[3] if len(sys.argv)>3 else "msg")
    elif cmd == "log": log()
    elif cmd == "branch": branch(sys.argv[2] if len(sys.argv)>2 else "")
