/**
 * @file InitCommand.h
 * 
 * @brief Implementation of the `mgit init` command.
 * 
 * @details
 * Why this file exists: To provide the execution logic specifically for `init`.
 * Why it belongs inside this folder: Part of the Command pattern for CLI actions.
 * Which modules depend on it: cli/Parser
 * Which modules it depends upon: repository/Repository
 */

#pragma once

namespace minigit::commands {

/**
 * @class InitCommand
 * @brief Executes the initialization of a repository.
 */
class InitCommand {
public:
    /**
     * @brief Executes the init command.
     * @return 0 on success, non-zero on failure.
     */
    static int execute();
};

} // namespace minigit::commands
