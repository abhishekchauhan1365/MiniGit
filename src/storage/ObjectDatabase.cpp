#include "ObjectDatabase.h"
#include "../hashing/SHA1.h"
#include "../filesystem/FileSystem.h"
#include <zlib.h>
#include <iostream>
#include <fstream>
#include <cstring>

namespace minigit::storage {

std::string ObjectDatabase::compress(const std::string& data) {
    z_stream zs;
    memset(&zs, 0, sizeof(zs));
    
    if (deflateInit(&zs, Z_BEST_COMPRESSION) != Z_OK) {
        throw std::runtime_error("deflateInit failed while compressing.");
    }

    zs.next_in = (Bytef*)data.data();
    zs.avail_in = data.size();

    int ret;
    char outbuffer[32768];
    std::string outstring;

    do {
        zs.next_out = reinterpret_cast<Bytef*>(outbuffer);
        zs.avail_out = sizeof(outbuffer);
        
        ret = deflate(&zs, Z_FINISH);
        
        if (outstring.size() < zs.total_out) {
            outstring.append(outbuffer, zs.total_out - outstring.size());
        }
    } while (ret == Z_OK);
    
    deflateEnd(&zs);

    if (ret != Z_STREAM_END) {
        throw std::runtime_error("Exception during zlib compression.");
    }
    
    return outstring;
}

std::string ObjectDatabase::decompress(const std::string& data) {
    z_stream zs;
    memset(&zs, 0, sizeof(zs));
    
    if (inflateInit(&zs) != Z_OK) {
        throw std::runtime_error("inflateInit failed while decompressing.");
    }

    zs.next_in = (Bytef*)data.data();
    zs.avail_in = data.size();

    int ret;
    char outbuffer[32768];
    std::string outstring;

    do {
        zs.next_out = reinterpret_cast<Bytef*>(outbuffer);
        zs.avail_out = sizeof(outbuffer);
        
        ret = inflate(&zs, 0);
        
        if (outstring.size() < zs.total_out) {
            outstring.append(outbuffer, zs.total_out - outstring.size());
        }
    } while (ret == Z_OK);
    
    inflateEnd(&zs);

    if (ret != Z_STREAM_END) {
        throw std::runtime_error("Exception during zlib decompression.");
    }
    
    return outstring;
}

std::string ObjectDatabase::readObject(const std::string& hash) {
    auto currentPath = std::filesystem::current_path();
    auto objectFile = currentPath / ".mgit" / "objects" / hash.substr(0, 2) / hash.substr(2);
    
    if (!std::filesystem::exists(objectFile)) {
        throw std::runtime_error("fatal: Not a valid object name " + hash);
    }
    
    std::ifstream file(objectFile, std::ios::binary);
    std::string compressed((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    std::string decompressed = decompress(compressed);
    
    size_t nullPos = decompressed.find('\0');
    if (nullPos == std::string::npos) {
        throw std::runtime_error("fatal: corrupt object file " + hash);
    }
    
    return decompressed.substr(nullPos + 1);
}

std::string ObjectDatabase::writeObject(const objects::GitObject& obj, bool writeToDisk) {
    std::string serialized = obj.serialize();
    std::string hash = hashing::SHA1::computeHash(serialized);

    if (writeToDisk) {
        auto currentPath = std::filesystem::current_path();
        auto mgitPath = currentPath / ".mgit";
        
        if (!std::filesystem::exists(mgitPath)) {
            throw std::runtime_error("fatal: not a minigit repository (or any of the parent directories): .mgit");
        }

        std::string dirName = hash.substr(0, 2);
        std::string fileName = hash.substr(2);
        
        auto objectDir = mgitPath / "objects" / dirName;
        filesystem::FileSystem::createDirectory(objectDir);
        
        auto objectFile = objectDir / fileName;
        if (!std::filesystem::exists(objectFile)) {
            std::string compressed = compress(serialized);
            
            std::ofstream file(objectFile, std::ios::binary);
            if (!file.is_open()) {
                throw std::runtime_error("Failed to open object file for writing.");
            }
            file.write(compressed.data(), compressed.size());
        }
    }

    return hash;
}

}
