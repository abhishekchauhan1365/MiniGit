#include "LogCommand.h"
#include "../storage/ObjectDatabase.h"
#include <iostream>
#include <fstream>
#include <filesystem>
#include <sstream>

namespace minigit::commands {

int LogCommand::execute() {
    auto mgitPath = std::filesystem::current_path() / ".mgit";
    std::string headRef;
    {
        std::ifstream headFile(mgitPath / "HEAD");
        std::getline(headFile, headRef);
    }
    
    std::string currentHash;
    auto branchPath = mgitPath / headRef.substr(5);
    if (std::filesystem::exists(branchPath)) {
        std::ifstream branchFile(branchPath);
        std::getline(branchFile, currentHash);
    }
    
    if (currentHash.empty()) {
        std::cerr << "fatal: your current branch '" << branchPath.filename().string() << "' does not have any commits yet\n";
        return 1;
    }
    
    while (!currentHash.empty()) {
        try {
            std::string content = storage::ObjectDatabase::readObject(currentHash);
            std::istringstream iss(content);
            std::string line;
            std::string parentHash = "";
            std::string author = "";
            std::string message = "";
            bool parsingMessage = false;
            
            while (std::getline(iss, line)) {
                if (parsingMessage) {
                    message += line + "\n";
                } else if (line.empty()) {
                    parsingMessage = true;
                } else if (line.find("parent ") == 0) {
                    parentHash = line.substr(7);
                } else if (line.find("author ") == 0) {
                    author = line.substr(7);
                }
            }
            
            std::cout << "commit " << currentHash << "\n";
            std::cout << "Author: " << author << "\n\n";
            std::cout << "    " << message << "\n";
            
            currentHash = parentHash;
        } catch (const std::exception& e) {
            std::cerr << e.what() << "\n";
            break;
        }
    }
    return 0;
}

}
