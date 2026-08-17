#pragma once
#include "GitObject.h"

namespace minigit::objects {

class Blob : public GitObject {
private:
    std::string content;
public:
    explicit Blob(std::string data);
    std::string getType() const override;
    std::string serialize() const override;
};

}
