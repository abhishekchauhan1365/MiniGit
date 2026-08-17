/**
 * @file ObjectDatabase.h
 * @brief Responsible for saving and reading objects from .mgit/objects
 */
#pragma once
#include "../objects/GitObject.h"
#include <string>
#include <filesystem>

namespace minigit::storage {

class ObjectDatabase {
public:
    /**
     * @brief Writes a GitObject to the .mgit/objects directory.
     * @param obj The object to save.
     * @param writeToDisk If true, writes the object. If false, just calculates the hash.
     * @return The 40-character SHA-1 hash.
     */
    static std::string writeObject(const objects::GitObject& obj, bool writeToDisk = true);
    
    /**
     * @brief Reads and decompresses a GitObject from the database.
     * @param hash The 40-character SHA-1 hash.
     * @return The raw payload content of the object (header stripped).
     */
    static std::string readObject(const std::string& hash);

private:
    static std::string compress(const std::string& data);
    static std::string decompress(const std::string& data);
};

}
