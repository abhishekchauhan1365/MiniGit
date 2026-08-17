#include "InitCommand.h"
#include "../repository/Repository.h"
#include <filesystem>

namespace minigit::commands {

int InitCommand::execute() {
    auto currentPath = std::filesystem::current_path();
    if (repository::Repository::init(currentPath)) {
        return 0; // Success
    }
    return 1; // Failure
}

} // namespace minigit::commands
