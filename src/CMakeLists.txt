include(FetchContent)
FetchContent_Declare(
    ZLIB
    URL https://github.com/madler/zlib/releases/download/v1.3.1/zlib-1.3.1.tar.gz
)
FetchContent_MakeAvailable(ZLIB)

# We will create a static library for the core logic to make it testable
add_library(minigit_core
    filesystem/FileSystem.cpp
    repository/Repository.cpp
    core/Index.cpp
    cli/Parser.cpp
    commands/InitCommand.cpp
    commands/HashObjectCommand.cpp
    commands/AddCommand.cpp
    commands/CommitCommand.cpp
    commands/LogCommand.cpp
    commands/BranchCommand.cpp
    hashing/SHA1.cpp
    objects/Blob.cpp
    objects/Tree.cpp
    objects/Commit.cpp
    storage/ObjectDatabase.cpp
)

target_include_directories(minigit_core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_link_libraries(minigit_core PUBLIC zlibstatic)

# Main executable
add_executable(mgit main.cpp)
target_link_libraries(mgit PRIVATE minigit_core)
