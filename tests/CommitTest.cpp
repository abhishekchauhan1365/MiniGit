#include <gtest/gtest.h>
#include "../src/objects/Commit.h"

using namespace minigit::objects;

TEST(CommitTest, GetTypeReturnsCommit) {
    Commit commit("treehash123", "parenthash456", "author", "message");
    EXPECT_EQ(commit.getType(), "commit");
}

TEST(CommitTest, SerializeWithoutParent) {
    Commit commit("treehash123", "", "John Doe <john@example.com>", "Initial commit");
    std::string content = "tree treehash123\n"
                          "author John Doe <john@example.com>\n\n"
                          "Initial commit\n";
    std::string expected = "commit " + std::to_string(content.size());
    expected += '\0';
    expected += content;
    
    EXPECT_EQ(commit.serialize(), expected);
}

TEST(CommitTest, SerializeWithParent) {
    Commit commit("treehash123", "parenthash456", "Jane Doe <jane@example.com>", "Second commit");
    std::string content = "tree treehash123\n"
                          "parent parenthash456\n"
                          "author Jane Doe <jane@example.com>\n\n"
                          "Second commit\n";
    std::string expected = "commit " + std::to_string(content.size());
    expected += '\0';
    expected += content;
    
    EXPECT_EQ(commit.serialize(), expected);
}

TEST(CommitTest, SerializeEmptyMessage) {
    Commit commit("treehash", "", "author", "");
    std::string content = "tree treehash\n"
                          "author author\n\n\n";
    std::string expected = "commit " + std::to_string(content.size());
    expected += '\0';
    expected += content;
    
    EXPECT_EQ(commit.serialize(), expected);
}
