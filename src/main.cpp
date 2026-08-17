/**
 * @file main.cpp
 * 
 * @brief Entry point for the MiniGit application.
 * 
 * @details
 * Why this file exists: It is the main executable entry point that bootstraps the CLI parser and routes the command.
 * Why it belongs inside this folder: It is the root of the source tree for the executable.
 * Which modules depend on it: None.
 * Which modules it depends upon: cli/Parser
 * 
 * Future scalability considerations: 
 * As the application grows, `main.cpp` should remain as thin as possible. All error handling, signal trapping,
 * and dependency injection should be delegated to specialized modules.
 */

#include "cli/Parser.h"
#include <iostream>
#include <exception>

int main(int argc, char* argv[]) {
    try {
        minigit::cli::Parser parser;
        return parser.parseAndExecute(argc, argv);
    } catch (const std::exception& e) {
        std::cerr << "fatal: " << e.what() << '\n';
        return 1;
    } catch (...) {
        std::cerr << "fatal: An unknown error occurred.\n";
        return 1;
    }
}
