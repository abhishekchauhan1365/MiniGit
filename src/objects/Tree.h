#pragma once
#include "GitObject.h"
#include <map>
#include <string>

namespace minigit::objects {

class Tree : public GitObject {
private:
    std::map<std::string, std::string> entries; // FilePath -> Hash
public:
    explicit Tree(const std::map<std::string, std::string>& indexEntries);
    std::string getType() const override;
    std::string serialize() const override;
};

}
