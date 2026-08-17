#include "Tree.h"
#include <sstream>

namespace minigit::objects {

std::string hexToBytes(const std::string& hex) {
    std::string bytes;
    for (size_t i = 0; i < hex.length(); i += 2) {
        bytes.push_back(static_cast<char>(std::stoi(hex.substr(i, 2), nullptr, 16)));
    }
    return bytes;
}

Tree::Tree(const std::map<std::string, std::string>& indexEntries) : entries(indexEntries) {}

std::string Tree::getType() const {
    return "tree";
}

std::string Tree::serialize() const {
    std::string content;
    // Format: [mode] [name]\0[20-byte-hash]
    for (const auto& [path, hash] : entries) {
        // Simplified: assuming everything is a normal file (mode 100644)
        content += "100644 " + path;
        content.push_back('\0');
        content += hexToBytes(hash);
    }
    
    std::ostringstream ss;
    ss << getType() << " " << content.size() << '\0' << content;
    return ss.str();
}

}
