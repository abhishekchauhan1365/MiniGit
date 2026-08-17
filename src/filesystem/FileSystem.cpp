#include "FileSystem.h"
#include <fstream>
#include <iostream>

namespace minigit::filesystem {

bool FileSystem::createDirectory(const std::filesystem::path& path) {
    try {
        if (!std::filesystem::exists(path)) {
            return std::filesystem::create_directories(path);
        }
        return true; // Already exists
    } catch (const std::filesystem::filesystem_error& e) {
        std::cerr << "Filesystem error: " << e.what() << '\n';
        return false;
    }
}

bool FileSystem::writeFile(const std::filesystem::path& path, const std::string& content) {
    try {
        std::ofstream file(path);
        if (!file.is_open()) {
            return false;
        }
        file << content;
        return true;
    } catch (...) {
        return false;
    }
}

} // namespace minigit::filesystem
