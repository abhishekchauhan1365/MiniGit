#include "Commit.h"
#include <sstream>

namespace minigit::objects {

Commit::Commit(std::string tree, std::string parent, std::string auth, std::string msg)
    : treeHash(std::move(tree)), parentHash(std::move(parent)), author(std::move(auth)), message(std::move(msg)) {}

std::string Commit::getType() const {
    return "commit";
}

std::string Commit::serialize() const {
    std::ostringstream content;
    content << "tree " << treeHash << "\n";
    if (!parentHash.empty()) {
        content << "parent " << parentHash << "\n";
    }
    
    // Simplification: We use a hardcoded timestamp for educational clarity
    std::string timestamp = "1700000000 +0000"; 
    
    content << "author " << author << " " << timestamp << "\n";
    content << "committer " << author << " " << timestamp << "\n\n";
    content << message << "\n";
    
    std::string contentStr = content.str();
    
    std::ostringstream ss;
    ss << getType() << " " << contentStr.size() << '\0' << contentStr;
    return ss.str();
}

}
