#include "AddCommand.h"
#include "../core/Index.h"
#include "../objects/Blob.h"
#include "../storage/ObjectDatabase.h"
#include <filesystem>
#include <fstream>
#include <iostream>

namespace minigit::commands {

int AddCommand::execute(const std::string& filePath) {
    std::filesystem::path path(filePath);
    
    if (!std::filesystem::exists(path)) {
        std::cerr << "fatal: pathspec '" << filePath << "' did not match any files\n";
        return 1;
    }

    std::ifstream file(path, std::ios::binary);
    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

    // 1. Create and write Blob
    objects::Blob blob(content);
    std::string hash = storage::ObjectDatabase::writeObject(blob, true);
    
    // 2. Load index, add entry, save index
    core::Index index;
    index.load();
    index.add(filePath, hash);
    index.save();
    
    return 0;
}

}
