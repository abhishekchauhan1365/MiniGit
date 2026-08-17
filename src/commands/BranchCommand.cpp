#include "BranchCommand.h"
#include "../filesystem/FileSystem.h"
#include <iostream>
#include <fstream>
#include <filesystem>

namespace minigit::commands {

int BranchCommand::execute(const std::string& name) {
    auto mgitPath = std::filesystem::current_path() / ".mgit";
    std::string headRef;
    {
        std::ifstream headFile(mgitPath / "HEAD");
        std::getline(headFile, headRef);
    }
    
    std::string currentHash;
    auto branchPath = mgitPath / headRef.substr(5);
    if (std::filesystem::exists(branchPath)) {
        std::ifstream branchFile(branchPath);
        std::getline(branchFile, currentHash);
    }
    
    if (currentHash.empty()) {
        std::cerr << "fatal: not a valid object name: 'master'\n";
        return 1;
    }
    
    auto newBranchPath = mgitPath / "refs" / "heads" / name;
    if (std::filesystem::exists(newBranchPath)) {
        std::cerr << "fatal: A branch named '" << name << "' already exists.\n";
        return 1;
    }
    
    filesystem::FileSystem::writeFile(newBranchPath, currentHash + "\n");
    return 0;
}

}
