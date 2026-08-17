#include <gtest/gtest.h>
#include "../src/commands/BranchCommand.h"
#include "../src/commands/InitCommand.h"
#include "../src/commands/CommitCommand.h"
#include "../src/core/Index.h"
#include <filesystem>
#include <fstream>

using namespace minigit::commands;
using namespace minigit::core;

class BranchCommandTest : public ::testing::Test {
protected:
    void SetUp() override {
        InitCommand::execute();
    }

    void TearDown() override {
        std::filesystem::remove_all(".mgit");
        std::filesystem::remove("file.txt");
    }
};

TEST_F(BranchCommandTest, BranchFailsWithoutCommits) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(BranchCommand::execute("new-branch"), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("fatal: Not a valid object name"), std::string::npos);
}

TEST_F(BranchCommandTest, BranchCreatesNewRef) {
    std::ofstream file("file.txt");
    file << "a";
    file.close();
    
    Index index;
    index.add("file.txt", "hash");
    index.save();
    
    testing::internal::CaptureStdout();
    CommitCommand::execute("Initial");
    testing::internal::GetCapturedStdout();
    
    testing::internal::CaptureStdout();
    EXPECT_EQ(BranchCommand::execute("new-branch"), 0);
    testing::internal::GetCapturedStdout();
    
    EXPECT_TRUE(std::filesystem::exists(".mgit/refs/heads/new-branch"));
    
    std::ifstream headFile(".mgit/refs/heads/master");
    std::string masterHash;
    std::getline(headFile, masterHash);
    
    std::ifstream newBranchFile(".mgit/refs/heads/new-branch");
    std::string branchHash;
    std::getline(newBranchFile, branchHash);
    
    EXPECT_EQ(masterHash, branchHash);
    EXPECT_FALSE(masterHash.empty());
}
