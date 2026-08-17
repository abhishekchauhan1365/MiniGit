/**
 * @file Parser.h
 * 
 * @brief Parses command line arguments and routes to the appropriate command.
 */

#pragma once

namespace minigit::cli {

/**
 * @class Parser
 * @brief Routes argv to the correct Command object.
 */
class Parser {
public:
    /**
     * @brief Parses CLI arguments and executes the requested command.
     * 
     * @param argc Argument count.
     * @param argv Argument values.
     * @return Exit code (0 for success).
     */
    int parseAndExecute(int argc, char* argv[]);
};

} // namespace minigit::cli
