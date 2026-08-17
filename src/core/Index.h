#pragma once
#include <string>
#include <map>
#include <filesystem>

namespace minigit::core {

/**
 * @class Index
 * @brief Represents the staging area (.mgit/index).
 */
class Index {
private:
    std::map<std::string, std::string> entries; // FilePath -> SHA-1 Hash
    std::filesystem::path indexPath;

public:
    Index();
    
    /**
     * @brief Adds or updates a file in the index.
     * @param filePath The relative path of the file.
     * @param hash The SHA-1 blob hash of the file.
     */
    void add(const std::string& filePath, const std::string& hash);
    
    /**
     * @brief Loads the index from disk.
     */
    void load();
    
    /**
     * @brief Saves the index to disk.
     */
    void save() const;

    /**
     * @brief Retrieves all staged entries.
     */
    const std::map<std::string, std::string>& getEntries() const;
};

}
