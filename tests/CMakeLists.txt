include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/03597a01ee50ed33e9dfd640b249b4be3799d395.zip
)
FetchContent_MakeAvailable(googletest)

add_executable(mgit_tests
    FileSystemTest.cpp
    RepositoryTest.cpp
    SHA1Test.cpp
    BlobTest.cpp
    CommitTest.cpp
    TreeTest.cpp
    IndexTest.cpp
    ObjectDatabaseTest.cpp
    ParserTest.cpp
    InitCommandTest.cpp
    AddCommandTest.cpp
    CommitCommandTest.cpp
    LogCommandTest.cpp
    BranchCommandTest.cpp
    HashObjectCommandTest.cpp
)

target_link_libraries(mgit_tests PRIVATE minigit_core gtest_main)

include(GoogleTest)
gtest_discover_tests(mgit_tests)
