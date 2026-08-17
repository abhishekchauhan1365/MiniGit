#pragma once
#include <string>

namespace minigit::commands {

class HashObjectCommand {
public:
    static int execute(const std::string& filePath, bool write);
};

}
