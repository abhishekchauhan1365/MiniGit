#include "CommitCommand.h"
#include "../core/Index.h"
#include "../objects/Tree.h"
#include "../objects/Commit.h"
#include "../storage/ObjectDatabase.h"
#include "../filesystem/FileSystem.h"
#include <iostream>
#include <fstream>
#include <filesystem>

namespace minigit::commands {

int CommitCommand::execute(const std::string& message) {
    if (message.empty()) {
        std::cerr << "Aborting commit due to empty commit message.\n";
        return 1;
    }

    core::Index index;
    index.load();

    if (index.getEntries().empty()) {
        std::cerr << "nothing to commit, working tree clean\n";
        return 1;
    }

    // 1. Write Tree
    objects::Tree tree(index.getEntries());
    std::string treeHash = storage::ObjectDatabase::writeObject(tree, true);

    // 2. Get Parent Commit (if any)
    auto mgitPath = std::filesystem::current_path() / ".mgit";
    std::string headRef;
    {
        std::ifstream headFile(mgitPath / "HEAD");
        std::getline(headFile, headRef);
    }
    
    std::string parentHash = "";
    std::string branchPathStr = headRef.substr(5); // strip "ref: "
    auto branchPath = mgitPath / branchPathStr;
    
    if (std::filesystem::exists(branchPath)) {
        std::ifstream branchFile(branchPath);
        std::getline(branchFile, parentHash);
    }

    // 3. Write Commit
    objects::Commit commit(treeHash, parentHash, "MiniGit User <user@example.com>", message);
    std::string commitHash = storage::ObjectDatabase::writeObject(commit, true);

    // 4. Update Branch Ref
    filesystem::FileSystem::createDirectory(branchPath.parent_path());
    filesystem::FileSystem::writeFile(branchPath, commitHash + "\n");

    std::cout << "[" << branchPath.filename().string() << " " << commitHash.substr(0, 7) << "] " << message << "\n";
    return 0;
}

}
