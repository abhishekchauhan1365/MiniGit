#include <gtest/gtest.h>
#include "../src/hashing/SHA1.h"

using namespace minigit::hashing;

TEST(SHA1Test, ComputesEmptyStringHash) {
    // The SHA1 for an empty string is widely known.
    EXPECT_EQ(SHA1::computeHash(""), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
}

TEST(SHA1Test, ComputesHelloWorldHash) {
    EXPECT_EQ(SHA1::computeHash("hello world"), "2aae6c35c94fcfb415dbe95f408b9ce91ee846ed");
}

TEST(SHA1Test, ComputesGitStyleBlobHash) {
    std::string content = "blob 11\0hello world";
    // We construct the string with the null byte manually
    std::string data = "blob 11";
    data += '\0';
    data += "hello world";
    EXPECT_EQ(SHA1::computeHash(data), "95d09f2b10159347eece71399a7e2e907ea3df4f");
}

TEST(SHA1Test, HashLengthIsAlways40) {
    EXPECT_EQ(SHA1::computeHash("").length(), 40);
    EXPECT_EQ(SHA1::computeHash("a").length(), 40);
    EXPECT_EQ(SHA1::computeHash("this is a very long string that should also produce a 40 character hash because sha1 is fixed length").length(), 40);
}

TEST(SHA1Test, HashIsDeterministic) {
    std::string data = "deterministic data";
    std::string hash1 = SHA1::computeHash(data);
    std::string hash2 = SHA1::computeHash(data);
    EXPECT_EQ(hash1, hash2);
}

TEST(SHA1Test, AvalancheEffect) {
    // Changing a single bit should drastically change the hash
    std::string hash1 = SHA1::computeHash("Test data 1");
    std::string hash2 = SHA1::computeHash("Test data 2");
    EXPECT_NE(hash1, hash2);
}

TEST(SHA1Test, HandlesBinaryData) {
    std::string binaryData;
    binaryData += '\x00';
    binaryData += '\xFF';
    binaryData += '\x7F';
    binaryData += '\x00';
    std::string hash = SHA1::computeHash(binaryData);
    EXPECT_EQ(hash.length(), 40);
    // Ensure it doesn't crash or stop at first null byte
    EXPECT_NE(hash, SHA1::computeHash(""));
    EXPECT_NE(hash, SHA1::computeHash(std::string("\x00", 1)));
}

TEST(SHA1Test, HashIsLowercase) {
    std::string hash = SHA1::computeHash("uppercase test");
    for (char c : hash) {
        if (std::isalpha(c)) {
            EXPECT_TRUE(std::islower(c));
        }
    }
}
