#include "Index.h"
#include <fstream>
#include <iostream>

namespace minigit::core {

Index::Index() {
    auto currentPath = std::filesystem::current_path();
    indexPath = currentPath / ".mgit" / "index";
}

void Index::add(const std::string& filePath, const std::string& hash) {
    entries[filePath] = hash;
}

void Index::load() {
    entries.clear();
    if (!std::filesystem::exists(indexPath)) {
        return;
    }

    std::ifstream file(indexPath);
    std::string line;
    while (std::getline(file, line)) {
        if (line.empty()) continue;
        
        size_t spacePos = line.find(' ');
        if (spacePos != std::string::npos) {
            std::string hash = line.substr(0, spacePos);
            std::string path = line.substr(spacePos + 1);
            entries[path] = hash;
        }
    }
}

void Index::save() const {
    std::ofstream file(indexPath);
    for (const auto& [path, hash] : entries) {
        file << hash << " " << path << "\n";
    }
}

const std::map<std::string, std::string>& Index::getEntries() const {
    return entries;
}

}
