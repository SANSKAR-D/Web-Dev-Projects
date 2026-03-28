#include "testlib.h"
using namespace std;

int main(int argc, char* argv[]) {
    registerChecker(argc, argv);
    
    // Read expected output (jury answer)
    int jury = ans.readDouble();
    
    // Read user output
    int user = ouf.readDouble();
    
    // Compare with 1e-6 tolerance (adjust for your problem)
    if (fabs(jury - user) > 1e-6)
        quitf(_wa, "Expected %.6f, got %.6f", jury, user);
    
    quitf(_ok, "Correct");
    return 0;
}