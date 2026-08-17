#include <gtest/gtest.h>
#include "../src/commands/LogCommand.h"
#include "../src/commands/CommitCommand.h"
#include "../src/core/Index.h"
#include "../src/commands/InitCommand.h"
#include <filesystem>
#include <fstream>

using namespace minigit::commands;
using namespace minigit::core;

class LogCommandTest : public ::testing::Test {
protected:
    void SetUp() override {
        InitCommand::execute();
    }

    void TearDown() override {
        std::filesystem::remove_all(".mgit");
        std::filesystem::remove("file.txt");
    }
};

TEST_F(LogCommandTest, LogFailsWithoutCommits) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(LogCommand::execute(), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("fatal"), std::string::npos);
}

TEST_F(LogCommandTest, LogPrintsCommitHistory) {
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
    EXPECT_EQ(LogCommand::execute(), 0);
    std::string out = testing::internal::GetCapturedStdout();
    
    EXPECT_NE(out.find("commit "), std::string::npos);
    EXPECT_NE(out.find("Author: "), std::string::npos);
    EXPECT_NE(out.find("Initial"), std::string::npos);
}
