#pragma once
#include <string>

namespace minigit::commands {

class CommitCommand {
public:
    static int execute(const std::string& message);
};

}
