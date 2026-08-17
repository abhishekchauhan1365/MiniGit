#include <gtest/gtest.h>
#include "../src/commands/AddCommand.h"
#include "../src/commands/InitCommand.h"
#include "../src/core/Index.h"
#include <filesystem>
#include <fstream>

using namespace minigit::commands;
using namespace minigit::core;

class AddCommandTest : public ::testing::Test {
protected:
    void SetUp() override {
        std::filesystem::create_directory(".mgit");
        std::filesystem::create_directory(".mgit/objects");
    }

    void TearDown() override {
        std::filesystem::remove_all(".mgit");
        std::filesystem::remove("testfile.txt");
    }
};

TEST_F(AddCommandTest, AddNonExistentFileFails) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(AddCommand::execute("does_not_exist.txt"), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("fatal"), std::string::npos);
}

TEST_F(AddCommandTest, AddExistingFileSucceeds) {
    std::ofstream file("testfile.txt");
    file << "hello world";
    file.close();
    
    EXPECT_EQ(AddCommand::execute("testfile.txt"), 0);
    
    Index index;
    index.load();
    auto entries = index.getEntries();
    
    EXPECT_EQ(entries.size(), 1);
    EXPECT_TRUE(entries.find("testfile.txt") != entries.end());
    // "hello world" blob hash
    EXPECT_EQ(entries.at("testfile.txt"), "95d09f2b10159347eece71399a7e2e907ea3df4f");
}

TEST_F(AddCommandTest, AddUpdatesIndex) {
    std::ofstream file("testfile.txt");
    file << "hello";
    file.close();
    EXPECT_EQ(AddCommand::execute("testfile.txt"), 0);
    
    file.open("testfile.txt");
    file << "hello world";
    file.close();
    EXPECT_EQ(AddCommand::execute("testfile.txt"), 0);
    
    Index index;
    index.load();
    EXPECT_EQ(index.getEntries().at("testfile.txt"), "95d09f2b10159347eece71399a7e2e907ea3df4f");
}

TEST_F(AddCommandTest, AddCreatesObjectInDatabase) {
    std::ofstream file("testfile.txt");
    file << "hello world";
    file.close();
    EXPECT_EQ(AddCommand::execute("testfile.txt"), 0);
    
    std::string hash = "95d09f2b10159347eece71399a7e2e907ea3df4f";
    std::string dir = hash.substr(0, 2);
    std::string name = hash.substr(2);
    
    EXPECT_TRUE(std::filesystem::exists(std::filesystem::path(".mgit") / "objects" / dir / name));
}
