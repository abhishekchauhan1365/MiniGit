/**
 * @file Repository.h
 * 
 * @brief Core facade for interacting with a MiniGit repository.
 * 
 * @details
 * Why this file exists: To encapsulate all logic related to managing the `.mgit` folder state.
 * Why it belongs inside this folder: Represents the domain logic for the repository structure.
 * Which modules depend on it: commands/InitCommand
 * Which modules it depends upon: filesystem/FileSystem
 */

#pragma once

#include <filesystem>
#include <string>

namespace minigit::repository {

/**
 * @class Repository
 * @brief Manages the state and layout of a Git repository.
 * 
 * Responsibilities:
 * - Initializing new repositories (mgit init).
 * - Locating the .mgit folder.
 */
class Repository {
public:
    /**
     * @brief Initializes a new repository in the specified directory.
     * 
     * problem we are solving: We need to create the required folder structure 
     * for our CAS and branch pointers.
     * 
     * @param path The root directory to initialize the repository in.
     * @return true if successful, false otherwise.
     */
    static bool init(const std::filesystem::path& path);
};

} // namespace minigit::repository
