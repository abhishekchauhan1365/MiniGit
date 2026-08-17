#include "Repository.h"
#include "../filesystem/FileSystem.h"
#include <iostream>

namespace minigit::repository {

bool Repository::init(const std::filesystem::path& path) {
    auto mgitPath = path / ".mgit";

    if (std::filesystem::exists(mgitPath)) {
        std::cout << "Reinitialized existing MiniGit repository in " << mgitPath.string() << "\n";
        return true;
    }

    // 1. Create the .mgit directory and its subdirectories
    auto objectsPath = mgitPath / "objects";
    auto refsHeadsPath = mgitPath / "refs" / "heads";
    auto refsTagsPath = mgitPath / "refs" / "tags";

    if (!filesystem::FileSystem::createDirectory(objectsPath / "info") ||
        !filesystem::FileSystem::createDirectory(objectsPath / "pack") ||
        !filesystem::FileSystem::createDirectory(refsHeadsPath) ||
        !filesystem::FileSystem::createDirectory(refsTagsPath)) {
        std::cerr << "Failed to create directory structure.\n";
        return false;
    }

    // 2. Create HEAD file
    std::string headContent = "ref: refs/heads/master\n";
    if (!filesystem::FileSystem::writeFile(mgitPath / "HEAD", headContent)) {
        std::cerr << "Failed to write HEAD file.\n";
        return false;
    }

    // 3. Create basic config file
    std::string configContent = "[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n";
    if (!filesystem::FileSystem::writeFile(mgitPath / "config", configContent)) {
        std::cerr << "Failed to write config file.\n";
        return false;
    }

    std::cout << "Initialized empty MiniGit repository in " << mgitPath.string() << "\n";
    return true;
}

} // namespace minigit::repository
