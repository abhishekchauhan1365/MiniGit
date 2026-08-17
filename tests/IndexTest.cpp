#include <gtest/gtest.h>
#include "../src/core/Index.h"
#include <filesystem>
#include <fstream>

using namespace minigit::core;

class IndexTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Create a fake .mgit directory for testing
        std::filesystem::create_directory(".mgit");
    }

    void TearDown() override {
        // Clean up
        std::filesystem::remove_all(".mgit");
    }
};

TEST_F(IndexTest, AddNewEntry) {
    Index index;
    index.add("file.txt", "hash123");
    
    auto entries = index.getEntries();
    EXPECT_EQ(entries.size(), 1);
    EXPECT_EQ(entries["file.txt"], "hash123");
}

TEST_F(IndexTest, UpdateExistingEntry) {
    Index index;
    index.add("file.txt", "hash123");
    index.add("file.txt", "hash456"); // Overwrite
    
    auto entries = index.getEntries();
    EXPECT_EQ(entries.size(), 1);
    EXPECT_EQ(entries["file.txt"], "hash456");
}

TEST_F(IndexTest, AddMultipleEntries) {
    Index index;
    index.add("file1.txt", "hash1");
    index.add("file2.txt", "hash2");
    
    auto entries = index.getEntries();
    EXPECT_EQ(entries.size(), 2);
    EXPECT_EQ(entries["file1.txt"], "hash1");
    EXPECT_EQ(entries["file2.txt"], "hash2");
}

TEST_F(IndexTest, SaveAndLoadEmptyIndex) {
    Index indexToSave;
    indexToSave.save();
    
    Index indexToLoad;
    indexToLoad.load();
    
    EXPECT_TRUE(indexToLoad.getEntries().empty());
}

TEST_F(IndexTest, SaveAndLoadPopulatedIndex) {
    Index indexToSave;
    indexToSave.add("a.txt", "hashA");
    indexToSave.add("b.txt", "hashB");
    indexToSave.save();
    
    Index indexToLoad;
    indexToLoad.load();
    
    auto entries = indexToLoad.getEntries();
    EXPECT_EQ(entries.size(), 2);
    EXPECT_EQ(entries["a.txt"], "hashA");
    EXPECT_EQ(entries["b.txt"], "hashB");
}

TEST_F(IndexTest, LoadNonExistentIndexDoesNotCrash) {
    // Ensure index file doesn't exist
    std::filesystem::remove(".mgit/index");
    
    Index index;
    // Should not throw, should just have empty entries
    EXPECT_NO_THROW(index.load());
    EXPECT_TRUE(index.getEntries().empty());
}

TEST_F(IndexTest, SaveCreatesIndexFile) {
    Index index;
    index.add("test.txt", "hash");
    index.save();
    
    EXPECT_TRUE(std::filesystem::exists(".mgit/index"));
}
