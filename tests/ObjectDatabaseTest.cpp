#include <gtest/gtest.h>
#include "../src/storage/ObjectDatabase.h"
#include "../src/objects/Blob.h"
#include "../src/objects/Commit.h"
#include <filesystem>
#include <fstream>
#include <stdexcept>

using namespace minigit::storage;
using namespace minigit::objects;

class ObjectDatabaseTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Create a fake .mgit repository structure for testing
        std::filesystem::create_directory(".mgit");
        std::filesystem::create_directory(".mgit/objects");
    }

    void TearDown() override {
        // Clean up
        std::filesystem::remove_all(".mgit");
    }
};

TEST_F(ObjectDatabaseTest, WriteObjectCalculatesCorrectHash) {
    Blob blob("hello world");
    // "hello world" blob hash is widely known
    std::string expectedHash = "95d09f2b10159347eece71399a7e2e907ea3df4f";
    std::string hash = ObjectDatabase::writeObject(blob, false); // Don't write to disk
    
    EXPECT_EQ(hash, expectedHash);
}

TEST_F(ObjectDatabaseTest, WriteObjectCreatesCorrectFile) {
    Blob blob("hello world");
    std::string hash = ObjectDatabase::writeObject(blob, true);
    
    std::string dirName = hash.substr(0, 2);
    std::string fileName = hash.substr(2);
    
    std::filesystem::path objectPath = std::filesystem::path(".mgit") / "objects" / dirName / fileName;
    
    EXPECT_TRUE(std::filesystem::exists(objectPath));
}

TEST_F(ObjectDatabaseTest, ReadObjectThrowsOnInvalidHash) {
    EXPECT_THROW(ObjectDatabase::readObject("invalidhash"), std::runtime_error);
}

TEST_F(ObjectDatabaseTest, WriteAndReadObjectConsistency) {
    std::string content = "consistency test data";
    Blob blob(content);
    std::string hash = ObjectDatabase::writeObject(blob, true);
    
    std::string decompressedPayload = ObjectDatabase::readObject(hash);
    
    // readObject strips the header, returning only the payload!
    EXPECT_EQ(decompressedPayload, content);
}

TEST_F(ObjectDatabaseTest, WriteAndReadCommitObject) {
    Commit commit("treehash123", "parenthash456", "Author <auth@example.com>", "Message");
    std::string hash = ObjectDatabase::writeObject(commit, true);
    
    std::string decompressedPayload = ObjectDatabase::readObject(hash);
    
    std::string expectedContent = "tree treehash123\n"
                                  "parent parenthash456\n"
                                  "author Author <auth@example.com>\n\n"
                                  "Message\n";
                                  
    EXPECT_EQ(decompressedPayload, expectedContent);
}

TEST_F(ObjectDatabaseTest, ThrowsErrorIfMgitDoesNotExist) {
    std::filesystem::remove_all(".mgit");
    
    Blob blob("some data");
    EXPECT_THROW(ObjectDatabase::writeObject(blob, true), std::runtime_error);
}
