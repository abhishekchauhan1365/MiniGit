#include <gtest/gtest.h>
#include "../src/repository/Repository.h"
#include <filesystem>
#include <fstream>
#include <string>

using namespace minigit::repository;

class RepositoryTest : public ::testing::Test {
protected:
    std::filesystem::path testDir = std::filesystem::current_path() / "test_sandbox_repo";

    void SetUp() override {
        std::filesystem::remove_all(testDir);
        std::filesystem::create_directories(testDir);
    }

    void TearDown() override {
        std::filesystem::remove_all(testDir);
    }
};

TEST_F(RepositoryTest, InitCreatesCorrectStructure) {
    EXPECT_TRUE(Repository::init(testDir));

    auto mgitPath = testDir / ".mgit";
    EXPECT_TRUE(std::filesystem::exists(mgitPath));
    EXPECT_TRUE(std::filesystem::is_directory(mgitPath / "objects" / "info"));
    EXPECT_TRUE(std::filesystem::is_directory(mgitPath / "objects" / "pack"));
    EXPECT_TRUE(std::filesystem::is_directory(mgitPath / "refs" / "heads"));
    EXPECT_TRUE(std::filesystem::is_directory(mgitPath / "refs" / "tags"));

    EXPECT_TRUE(std::filesystem::exists(mgitPath / "HEAD"));
    EXPECT_TRUE(std::filesystem::exists(mgitPath / "config"));

    std::ifstream headFile(mgitPath / "HEAD");
    std::string headContent;
    std::getline(headFile, headContent);
    EXPECT_EQ(headContent, "ref: refs/heads/master");
}
