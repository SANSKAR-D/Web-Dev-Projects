#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    setName("checker for love-percentage");
    registerTestlibCmd(argc, argv);

    // Read jury answer
    double jury1 = ans.readDouble();
    double jury2 = ans.readDouble();

    // Read user answer
    double user1 = ouf.readDouble();
    double user2 = ouf.readDouble();

    double eps = 1e-2;

    if (fabs(jury1 - user1) > eps || fabs(jury2 - user2) > eps)
        quitf(_wa, "Expected [%.2f, %.2f] but got [%.2f, %.2f]",
              jury1, jury2, user1, user2);

    quitf(_ok, "Correct: [%.2f, %.2f]", user1, user2);
    return 0;
}