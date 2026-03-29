#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);

    // Random name lengths 1-1000
    int len1 = rnd.next(1, 1000);
    int len2 = rnd.next(1, 1000);

    string name1 = "", name2 = "";

    // Only lowercase
    for (int i = 0; i < len1; i++) name1 += (char)rnd.next('a', 'z');
    for (int i = 0; i < len2; i++) name2 += (char)rnd.next('a', 'z');

    // Pick one of the 3 fixed words randomly
    string words[] = {"love", "like", "hate"};
    string word = words[rnd.next(0, 2)];

    cout << name1 << "\n" << name2 << "\n" << word << "\n";
    return 0;
}