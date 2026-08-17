#include <gtest/gtest.h>
#include "../src/objects/Blob.h"

using namespace minigit::objects;

TEST(BlobTest, GetTypeReturnsBlob) {
    Blob blob("some data");
    EXPECT_EQ(blob.getType(), "blob");
}

TEST(BlobTest, SerializeEmptyData) {
    Blob blob("");
    std::string expected = "blob 0";
    expected += '\0';
    EXPECT_EQ(blob.serialize(), expected);
}

TEST(BlobTest, SerializeHelloWorld) {
    Blob blob("hello world");
    std::string expected = "blob 11";
    expected += '\0';
    expected += "hello world";
    EXPECT_EQ(blob.serialize(), expected);
}

TEST(BlobTest, SerializeWithNewlines) {
    Blob blob("line 1\nline 2\n");
    std::string expected = "blob 14";
    expected += '\0';
    expected += "line 1\nline 2\n";
    EXPECT_EQ(blob.serialize(), expected);
}

TEST(BlobTest, SerializeBinaryData) {
    std::string binaryData;
    binaryData += '\x00';
    binaryData += '\x01';
    binaryData += '\x00';
    Blob blob(binaryData);
    
    std::string expected = "blob 3";
    expected += '\0';
    expected += binaryData;
    EXPECT_EQ(blob.serialize(), expected);
}

TEST(BlobTest, SerializeLargeData) {
    std::string largeData(10000, 'A');
    Blob blob(largeData);
    
    std::string expected = "blob 10000";
    expected += '\0';
    expected += largeData;
    EXPECT_EQ(blob.serialize(), expected);
}
