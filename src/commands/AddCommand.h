#pragma once
#include <string>

namespace minigit::commands {

class AddCommand {
public:
    static int execute(const std::string& filePath);
};

}
