#include <gtest/gtest.h>
#include "../src/filesystem/FileSystem.h"
#include <filesystem>
#include <fstream>
#include <string>

using namespace minigit::filesystem;

class FileSystemTest : public ::testing::Test {
protected:
    std::filesystem::path testDir = std::filesystem::current_path() / "test_sandbox_fs";

    void SetUp() override {
        std::filesystem::remove_all(testDir);
    }

    void TearDown() override {
        std::filesystem::remove_all(testDir);
    }
};

TEST_F(FileSystemTest, CreateDirectorySuccess) {
    auto path = testDir / "new_dir";
    EXPECT_TRUE(FileSystem::createDirectory(path));
    EXPECT_TRUE(std::filesystem::exists(path));
    EXPECT_TRUE(std::filesystem::is_directory(path));
}

TEST_F(FileSystemTest, WriteFileSuccess) {
    auto path = testDir / "test.txt";
    FileSystem::createDirectory(testDir);
    
    std::string content = "Hello MiniGit!";
    EXPECT_TRUE(FileSystem::writeFile(path, content));
    
    EXPECT_TRUE(std::filesystem::exists(path));
    
    std::ifstream file(path);
    std::string readContent((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    EXPECT_EQ(content, readContent);
}
