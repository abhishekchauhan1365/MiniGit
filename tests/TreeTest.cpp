#include <gtest/gtest.h>
#include "../src/objects/Tree.h"
#include <map>
#include <string>

using namespace minigit::objects;

TEST(TreeTest, GetTypeReturnsTree) {
    std::map<std::string, std::string> entries;
    Tree tree(entries);
    EXPECT_EQ(tree.getType(), "tree");
}

TEST(TreeTest, SerializeEmptyTree) {
    std::map<std::string, std::string> entries;
    Tree tree(entries);
    
    std::string expected = "tree 0";
    expected += '\0';
    
    EXPECT_EQ(tree.serialize(), expected);
}

TEST(TreeTest, SerializeSingleEntry) {
    std::map<std::string, std::string> entries = {
        {"file.txt", "hash123"}
    };
    Tree tree(entries);
    
    std::string content = "100644 file.txt\0hash123";
    std::string expected = "tree " + std::to_string(content.size());
    expected += '\0';
    expected += content;
    
    EXPECT_EQ(tree.serialize(), expected);
}

TEST(TreeTest, SerializeMultipleEntries) {
    std::map<std::string, std::string> entries = {
        {"a.txt", "hashA"},
        {"b.txt", "hashB"}
    };
    Tree tree(entries);
    
    // std::map is sorted by key, so a.txt comes before b.txt
    std::string content = "100644 a.txt\0hashA100644 b.txt\0hashB";
    std::string expected = "tree " + std::to_string(content.size());
    expected += '\0';
    expected += content;
    
    EXPECT_EQ(tree.serialize(), expected);
}
