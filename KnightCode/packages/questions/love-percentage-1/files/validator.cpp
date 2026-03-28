#include "testlib.h"
using namespace std;

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);

    // First name — only letters, length 1-100
    string a = inf.readToken("[a-zA-Z]{1,100}", "name1");
    inf.readEoln();

    // Second name — only letters, length 1-100
    string b = inf.readToken("[a-zA-Z]{1,100}", "name2");
    inf.readEoln();

    inf.readEof();
    return 0;
}