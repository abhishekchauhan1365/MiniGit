#include "Blob.h"
#include <sstream>

namespace minigit::objects {

Blob::Blob(std::string data) : content(std::move(data)) {}

std::string Blob::getType() const {
    return "blob";
}

std::string Blob::serialize() const {
    std::ostringstream ss;
    ss << getType() << " " << content.size() << '\0' << content;
    return ss.str();
}

}
