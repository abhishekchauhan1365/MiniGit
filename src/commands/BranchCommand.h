#pragma once
#include <string>

namespace minigit::commands {
class BranchCommand {
public:
    static int execute(const std::string& name);
};
}
