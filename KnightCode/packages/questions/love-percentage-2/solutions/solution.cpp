#include <bits/stdc++.h>
using namespace std;

vector<double> calculateCompatibility(string name1, string name2, string word) {
    unordered_set<char> common_chars;
    unordered_set<char> set1(name1.begin(), name1.end());
    unordered_set<char> set2(name2.begin(), name2.end());

    for (char c : set1)
        if (set2.count(c)) common_chars.insert(c);

    string new_name1 = "", new_name2 = "";
    for (char c : name1) if (!common_chars.count(c)) new_name1 += c;
    for (char c : name2) if (!common_chars.count(c)) new_name2 += c;

    string str1 = new_name1 + word + "true"  + new_name2;
    string str2 = new_name1 + word + "false" + new_name2;

    auto toAsciiDigits = [](const string& s) {
        string res = "";
        for (char c : s) res += to_string(static_cast<int>(c));
        return res;
    };

    string num_str1 = toAsciiDigits(str1);
    string num_str2 = toAsciiDigits(str2);

    auto reduceToTwoDigits = [](string s) {
        while (s.length() > 2) {
            int first = s.front() - '0';
            int last  = s.back()  - '0';
            int total = first + last;
            s = to_string(total) + s.substr(1, s.length() - 2);
        }
        return stod(s);
    };

    double ans1 = reduceToTwoDigits(num_str1);
    double ans2 = reduceToTwoDigits(num_str2);

    double total_ans = ans1 + ans2;
    if (total_ans == 0) return {50.0, 50.0};

    double norm1 = round((ans1 / total_ans) * 100.0 * 100.0) / 100.0;
    double norm2 = round((ans2 / total_ans) * 100.0 * 100.0) / 100.0;

    return {norm1, norm2};
}

int main() {
    string name1, name2, word;
    cin >> name1 >> name2 >> word;

    vector<double> result = calculateCompatibility(name1, name2, word);
    cout << result[0] << " " << result[1] << endl;
    return 0;
}