#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);

    // Random name length between 3 and 10
    int len1 = rnd.next(3, 10);
    int len2 = rnd.next(3, 10);

    // Generate random lowercase names
    string name1 = "", name2 = "";
    for (int i = 0; i < len1; i++)
        name1 += (char)rnd.next('a', 'z');
    for (int i = 0; i < len2; i++)
        name2 += (char)rnd.next('a', 'z');

    // Capitalize first letter
    name1[0] = toupper(name1[0]);
    name2[0] = toupper(name2[0]);

    cout << name1 << "\n" << name2 << "\n";
    return 0;
}