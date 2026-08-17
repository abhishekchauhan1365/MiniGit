#include <gtest/gtest.h>
#include "../src/cli/Parser.h"
#include <filesystem>
#include <vector>
#include <string>

using namespace minigit::cli;

class ParserTest : public ::testing::Test {
protected:
    void SetUp() override {
        // We test parser in a dummy directory so commands don't affect real stuff
        std::filesystem::create_directory("parser_test_dir");
        std::filesystem::current_path("parser_test_dir");
    }

    void TearDown() override {
        std::filesystem::current_path("..");
        std::filesystem::remove_all("parser_test_dir");
    }
    
    int callParser(const std::vector<std::string>& args) {
        std::vector<char*> argv;
        for (const auto& arg : args) {
            argv.push_back(const_cast<char*>(arg.c_str()));
        }
        return Parser::parseAndExecute(argv.size(), argv.data());
    }
};

TEST_F(ParserTest, MissingCommandPrintsUsage) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(callParser({"mgit"}), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("usage: mgit"), std::string::npos);
}

TEST_F(ParserTest, InvalidCommandPrintsError) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(callParser({"mgit", "invalidcommand"}), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("is not a mgit command"), std::string::npos);
}

TEST_F(ParserTest, InitCommandCallsInit) {
    testing::internal::CaptureStdout();
    EXPECT_EQ(callParser({"mgit", "init"}), 0);
    testing::internal::GetCapturedStdout();
    EXPECT_TRUE(std::filesystem::exists(".mgit"));
}

TEST_F(ParserTest, AddMissingFilePrintsUsage) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(callParser({"mgit", "add"}), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("usage: mgit add"), std::string::npos);
}

TEST_F(ParserTest, CommitMissingMessagePrintsUsage) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(callParser({"mgit", "commit"}), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("usage: mgit commit -m <message>"), std::string::npos);
}

TEST_F(ParserTest, CommitEmptyMessageFlagPrintsUsage) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(callParser({"mgit", "commit", "-m"}), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("usage: mgit commit -m <message>"), std::string::npos);
}

TEST_F(ParserTest, BranchMissingNamePrintsUsage) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(callParser({"mgit", "branch"}), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("usage: mgit branch <branchname>"), std::string::npos);
}

TEST_F(ParserTest, HashObjectMissingFilePrintsUsage) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(callParser({"mgit", "hash-object"}), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("usage: mgit hash-object"), std::string::npos);
}

TEST_F(ParserTest, HashObjectWriteFlagMissingFilePrintsUsage) {
    testing::internal::CaptureStderr();
    EXPECT_EQ(callParser({"mgit", "hash-object", "-w"}), 1);
    std::string err = testing::internal::GetCapturedStderr();
    EXPECT_NE(err.find("usage: mgit hash-object"), std::string::npos);
}
