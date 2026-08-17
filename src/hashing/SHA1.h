/**
 * @file SHA1.h
 * 
 * @brief Minimal SHA-1 implementation for educational purposes.
 * 
 * @details
 * Why this file exists: Git relies entirely on SHA-1 hashes for addressing objects.
 * We include a minimal implementation to avoid pulling in massive cryptography libraries like OpenSSL.
 */

#pragma once

#include <string>
#include <cstdint>

namespace minigit::hashing {

/**
 * @class SHA1
 * @brief Computes SHA-1 hash of an input string.
 */
class SHA1 {
public:
    /**
     * @brief Computes the SHA-1 hash of the given data.
     * @param data The input buffer.
     * @return 40-character hexadecimal string representing the hash.
     */
    static std::string computeHash(const std::string& data);
};

} // namespace minigit::hashing
