#include <bits/stdc++.h>
using namespace std;

vector<double> calculateCompatibility(string name1, string name2, string word) {
    // Step 1: Find and remove common characters
    unordered_set<char> common_chars;
    unordered_set<char> set1(name1.begin(), name1.end());
    unordered_set<char> set2(name2.begin(), name2.end());
    
    for (char c : set1) {
        if (set2.count(c)) common_chars.insert(c);
    }
    
    string new_name1 = "", new_name2 = "";
    for (char c : name1) if (!common_chars.count(c)) new_name1 += c;
    for (char c : name2) if (!common_chars.count(c)) new_name2 += c;
    
    // Step 2 & 3: Concatenate and immediately convert to Deque of digits
    string base_str = new_name1 + word;
    string str1 = base_str + "true" + new_name2;
    string str2 = base_str + "false" + new_name2;
    
    auto getAsciiDeque = [](const string& s) {
        deque<int> dq;
        for (char c : s) {
            string ascii_val = to_string(static_cast<int>(c));
            for (char digit : ascii_val) {
                dq.push_back(digit - '0'); // Convert char to integer
            }
        }
        return dq;
    };
    
    deque<int> dq1 = getAsciiDeque(str1);
    deque<int> dq2 = getAsciiDeque(str2);
    
    // Step 4: Fast reduction using Deque
    auto reduceToTwoDigits = [](deque<int>& dq) {
        while (dq.size() > 2) {
            // Pop front and back in O(1)
            int first = dq.front(); dq.pop_front();
            int last = dq.back(); dq.pop_back();
            int sum = first + last;
            
            // Push sum back to the front in O(1)
            if (sum >= 10) {
                // E.g., if sum is 15, we want 1 at the front, 5 next.
                // Push 5 first, then 1.
                dq.push_front(sum % 10);
                dq.push_front(sum / 10);
            } else {
                dq.push_front(sum);
            }
        }
        
        // Edge cases for empty or single digit remaining
        if (dq.empty()) return 0.0;
        if (dq.size() == 1) return static_cast<double>(dq[0]);
        
        return static_cast<double>(dq[0] * 10 + dq[1]);
    };
    
    // Execute reduction
    double ans1 = reduceToTwoDigits(dq1);
    double ans2 = reduceToTwoDigits(dq2);
    
    // Step 5: Normalize to sum to 100
    double total_ans = ans1 + ans2;
    if (total_ans == 0) return {50.0, 50.0}; // Prevent division by zero
    
    double norm1 = (ans1 / total_ans) * 100.0;
    double norm2 = (ans2 / total_ans) * 100.0;
    
    // Round to 2 decimal places
    norm1 = round(norm1 * 100.0) / 100.0;
    norm2 = round(norm2 * 100.0) / 100.0;
    
    return {norm1, norm2};
}
int main() {
    string name1, name2, word;
    cin >> name1 >> name2 >> word;

    vector<double> result = calculateCompatibility(name1, name2, word);
    cout << result[0] << " " << result[1] << endl;
    return 0;
}