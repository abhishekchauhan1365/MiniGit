#include <gtest/gtest.h>
#include "../src/commands/CommitCommand.h"
#include "../src/core/Index.h"
#include <filesystem>
#include <fstream>

using namespace minigit::commands;
using namespace minigit::core;

class CommitCommandTest : public ::testing::Test {
protected:
    void SetUp() override {
        std::filesystem::create_directory(".mgit");
        std::filesystem::create_directory(".mgit/objects");
        std::ofstream headFile(".mgit/HEAD");
        headFile << "ref: refs/heads/master\n";
    }

    void TearDown() override {
        std::filesystem::remove_all(".mgit");
        std::filesystem::remove("test.txt");
    }
};

TEST_F(CommitCommandTest, FailsWithEmptyMessage) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(CommitCommand::execute(""), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("Aborting"), std::string::npos);
}

TEST_F(CommitCommandTest, FailsWithCleanWorkingTree) {
    // index is empty
    testing::internal::CaptureStderr();
    EXPECT_EQ(CommitCommand::execute("Initial commit"), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("nothing to commit"), std::string::npos);
}

TEST_F(CommitCommandTest, SucceedsWithStagedFiles) {
    Index index;
    index.add("test.txt", "somehash");
    index.save(); // stage file
    
    testing::internal::CaptureStdout();
    EXPECT_EQ(CommitCommand::execute("Initial commit"), 0);
    std::string out = testing::internal::GetCapturedStdout();
    EXPECT_NE(out.find("Initial commit"), std::string::npos);
    EXPECT_NE(out.find("master"), std::string::npos);
    
    // Check that branch file was created
    EXPECT_TRUE(std::filesystem::exists(".mgit/refs/heads/master"));
}

TEST_F(CommitCommandTest, BranchRefIsUpdated) {
    Index index;
    index.add("test.txt", "hash1");
    index.save();
    
    testing::internal::CaptureStdout();
    CommitCommand::execute("First");
    testing::internal::GetCapturedStdout();
    
    std::ifstream refFile1(".mgit/refs/heads/master");
    std::string commit1;
    std::getline(refFile1, commit1);
    
    index.add("test2.txt", "hash2");
    index.save();
    
    testing::internal::CaptureStdout();
    CommitCommand::execute("Second");
    testing::internal::GetCapturedStdout();
    
    std::ifstream refFile2(".mgit/refs/heads/master");
    std::string commit2;
    std::getline(refFile2, commit2);
    
    EXPECT_NE(commit1, commit2);
    EXPECT_FALSE(commit1.empty());
    EXPECT_FALSE(commit2.empty());
}
