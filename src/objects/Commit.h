#pragma once
#include "GitObject.h"
#include <string>

namespace minigit::objects {

class Commit : public GitObject {
private:
    std::string treeHash;
    std::string parentHash;
    std::string author;
    std::string message;
public:
    Commit(std::string tree, std::string parent, std::string author, std::string message);
    std::string getType() const override;
    std::string serialize() const override;
};

}
