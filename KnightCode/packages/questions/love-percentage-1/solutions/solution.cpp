#include <iostream>
#include <string>
#include <cctype>

using namespace std;

int calculateLovePercentage(const string& name1, const string& name2) {
    string combined = name1 + name2;
    int trueCount = 0;
    int loveCount = 0;

    // Count occurrences for both words
    for (char c : combined) {
        char lowerC = tolower(c);
        
        // Check for T, R, U, E
        if (lowerC == 't' || lowerC == 'r' || lowerC == 'u' || lowerC == 'e') {
            trueCount++;
        }
        
        // Check for L, O, V, E
        if (lowerC == 'l' || lowerC == 'o' || lowerC == 'v' || lowerC == 'e') {
            loveCount++;
        }
    }

    // Concatenate counts
    string percentageStr = to_string(trueCount) + to_string(loveCount);
    
    // Convert back to integer
    int percentage = stoi(percentageStr);

    // Cap at 100
    if (percentage > 100) {
        return 100;
    }
    
    return percentage;
}

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string name1, name2;
    if (cin >> name1 >> name2) {
        cout << calculateLovePercentage(name1, name2) << "\n";
    }

    return 0;
}