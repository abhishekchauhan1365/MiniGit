#include "HashObjectCommand.h"
#include "../objects/Blob.h"
#include "../storage/ObjectDatabase.h"
#include <filesystem>
#include <fstream>
#include <iostream>

namespace minigit::commands {

int HashObjectCommand::execute(const std::string& filePath, bool write) {
    std::filesystem::path path(filePath);
    
    if (!std::filesystem::exists(path)) {
        std::cerr << "fatal: could not open '" << filePath << "' for reading: No such file or directory\n";
        return 1;
    }

    std::ifstream file(path, std::ios::binary);
    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

    objects::Blob blob(content);
    
    try {
        std::string hash = storage::ObjectDatabase::writeObject(blob, write);
        std::cout << hash << "\n";
        return 0;
    } catch (const std::exception& e) {
        std::cerr << e.what() << "\n";
        return 1;
    }
}

}
