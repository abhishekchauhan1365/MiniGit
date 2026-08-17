#include "Parser.h"
#include "../commands/InitCommand.h"
#include "../commands/HashObjectCommand.h"
#include "../commands/AddCommand.h"
#include "../commands/CommitCommand.h"
#include "../commands/LogCommand.h"
#include "../commands/BranchCommand.h"
#include <iostream>
#include <string>

namespace minigit::cli {

int Parser::parseAndExecute(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "usage: mgit <command> [<args>]\n\n";
        std::cerr << "These are common mgit commands used in various situations:\n";
        std::cerr << "   init          Create an empty Git repository\n";
        std::cerr << "   add           Add file contents to the index\n";
        std::cerr << "   commit        Record changes to the repository\n";
        std::cerr << "   log           Show commit logs\n";
        std::cerr << "   branch        List, create, or delete branches\n";
        std::cerr << "   hash-object   Compute object ID and optionally creates a blob from a file\n";
        return 1;
    }

    std::string command = argv[1];

    if (command == "init") {
        return commands::InitCommand::execute();
    }
    else if (command == "add") {
        if (argc < 3) {
            std::cerr << "usage: mgit add <file>\n";
            return 1;
        }
        return commands::AddCommand::execute(argv[2]);
    }
    else if (command == "commit") {
        std::string message;
        for (int i = 2; i < argc; ++i) {
            std::string arg = argv[i];
            if (arg == "-m" && i + 1 < argc) {
                message = argv[++i];
            }
        }
        if (message.empty()) {
            std::cerr << "usage: mgit commit -m <message>\n";
            return 1;
        }
        return commands::CommitCommand::execute(message);
    }
    else if (command == "log") {
        return commands::LogCommand::execute();
    }
    else if (command == "branch") {
        if (argc < 3) {
            std::cerr << "usage: mgit branch <branchname>\n";
            return 1;
        }
        return commands::BranchCommand::execute(argv[2]);
    }
    else if (command == "hash-object") {
        bool write = false;
        std::string file;
        for (int i = 2; i < argc; ++i) {
            std::string arg = argv[i];
            if (arg == "-w") {
                write = true;
            } else {
                file = arg;
            }
        }
        if (file.empty()) {
            std::cerr << "usage: mgit hash-object [-w] <file>\n";
            return 1;
        }
        return commands::HashObjectCommand::execute(file, write);
    }

    std::cerr << "mgit: '" << command << "' is not a mgit command. See 'mgit --help'.\n";
    return 1;
}

} // namespace minigit::cli
