#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);

    string name1 = inf.readToken("[a-z]{1,200000}", "name1");
    inf.readEoln();

    string name2 = inf.readToken("[a-z]{1,200000}", "name2");
    inf.readEoln();

    // Word must be exactly love, like, or hate
    string word = inf.readToken("love|like|hate", "word");
    inf.readEoln();

    inf.readEof();
    return 0;
}