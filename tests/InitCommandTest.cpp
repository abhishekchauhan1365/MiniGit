#include <gtest/gtest.h>
#include "../src/commands/InitCommand.h"
#include <filesystem>
#include <fstream>
#include <iostream>

using namespace minigit::commands;

class InitCommandTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Ensure clean state before each test
        if (std::filesystem::exists(".mgit")) {
            std::filesystem::remove_all(".mgit");
        }
    }

    void TearDown() override {
        // Clean up
        if (std::filesystem::exists(".mgit")) {
            std::filesystem::remove_all(".mgit");
        }
    }
};

TEST_F(InitCommandTest, CreatesMgitDirectory) {
    EXPECT_FALSE(std::filesystem::exists(".mgit"));
    
    // Redirect stdout to avoid polluting test output
    testing::internal::CaptureStdout();
    EXPECT_EQ(InitCommand::execute(), 0);
    testing::internal::GetCapturedStdout();
    
    EXPECT_TRUE(std::filesystem::exists(".mgit"));
    EXPECT_TRUE(std::filesystem::exists(".mgit/objects"));
    EXPECT_TRUE(std::filesystem::exists(".mgit/refs/heads"));
}

TEST_F(InitCommandTest, CreatesHeadFile) {
    testing::internal::CaptureStdout();
    InitCommand::execute();
    testing::internal::GetCapturedStdout();
    
    EXPECT_TRUE(std::filesystem::exists(".mgit/HEAD"));
    
    std::ifstream headFile(".mgit/HEAD");
    std::string headRef;
    std::getline(headFile, headRef);
    EXPECT_EQ(headRef, "ref: refs/heads/master");
}

TEST_F(InitCommandTest, RepeatedInitIsSafe) {
    testing::internal::CaptureStdout();
    EXPECT_EQ(InitCommand::execute(), 0);
    EXPECT_EQ(InitCommand::execute(), 0); // Second time shouldn't crash
    testing::internal::GetCapturedStdout();
    
    EXPECT_TRUE(std::filesystem::exists(".mgit"));
}
