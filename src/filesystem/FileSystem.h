/**
 * @file FileSystem.h
 * 
 * @brief Platform-agnostic file and directory operations.
 * 
 * @details
 * Why this file exists: To isolate std::filesystem calls. This makes it easier to mock file I/O 
 * during unit testing and centralizes error handling for I/O operations.
 * Why it belongs inside this folder: The filesystem module handles all direct disk access.
 * Which modules depend on it: repository, storage
 * Which modules it depends upon: None
 * 
 * Future scalability considerations:
 * Might need an abstract interface (IFileSystem) to fully mock disk operations in tests.
 */

#pragma once

#include <string>
#include <filesystem>

namespace minigit::filesystem {

/**
 * @class FileSystem
 * @brief Provides static methods for filesystem operations.
 * 
 * Responsibilities:
 * - Safely creating directories.
 * - Safely writing files.
 * - Checking file existence.
 * 
 * Thread Safety: File operations are generally not thread-safe at the application level unless explicitly synchronized.
 */
class FileSystem {
public:
    /**
     * @brief Creates a directory and any necessary parent directories.
     * 
     * @param path The path of the directory to create.
     * @return true if created or already exists, false if failed.
     * 
     * Time Complexity: O(Depth of path)
     * Space Complexity: O(1)
     */
    static bool createDirectory(const std::filesystem::path& path);

    /**
     * @brief Writes content to a file.
     * 
     * @param path The file path.
     * @param content The string content to write.
     * @return true if successful, false otherwise.
     */
    static bool writeFile(const std::filesystem::path& path, const std::string& content);
};

} // namespace minigit::filesystem
