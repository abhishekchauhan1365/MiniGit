/**
 * @file GitObject.h
 * @brief Base interface for all Git objects (Blob, Tree, Commit, Tag).
 */
#pragma once
#include <string>

namespace minigit::objects {

class GitObject {
public:
    virtual ~GitObject() = default;
    virtual std::string getType() const = 0;
    virtual std::string serialize() const = 0;
};

}
