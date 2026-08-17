#include <gtest/gtest.h>
#include "../src/commands/HashObjectCommand.h"
#include "../src/commands/InitCommand.h"
#include <filesystem>
#include <fstream>

using namespace minigit::commands;

class HashObjectCommandTest : public ::testing::Test {
protected:
    void SetUp() override {
        InitCommand::execute();
    }

    void TearDown() override {
        std::filesystem::remove_all(".mgit");
        std::filesystem::remove("file.txt");
    }
};

TEST_F(HashObjectCommandTest, HashObjectFailsOnMissingFile) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(HashObjectCommand::execute("missing.txt", false), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("fatal: Cannot open"), std::string::npos);
}

TEST_F(HashObjectCommandTest, HashObjectPrintsHash) {
    std::ofstream file("file.txt");
    file << "hello world";
    file.close();
    
    testing::internal::CaptureStdout();
    EXPECT_EQ(HashObjectCommand::execute("file.txt", false), 0);
    std::string out = testing::internal::GetCapturedStdout();
    EXPECT_NE(out.find("95d09f2b10159347eece71399a7e2e907ea3df4f"), std::string::npos);
    
    // Check it didn't write to database
    EXPECT_FALSE(std::filesystem::exists(".mgit/objects/95/d09f2b10159347eece71399a7e2e907ea3df4f"));
}

TEST_F(HashObjectCommandTest, HashObjectWritesToDatabaseWithFlag) {
    std::ofstream file("file.txt");
    file << "hello world";
    file.close();
    
    testing::internal::CaptureStdout();
    EXPECT_EQ(HashObjectCommand::execute("file.txt", true), 0);
    testing::internal::GetCapturedStdout();
    
    EXPECT_TRUE(std::filesystem::exists(".mgit/objects/95/d09f2b10159347eece71399a7e2e907ea3df4f"));
}
