const path = require('path');
const executor = require(path.join(__dirname, '../apps/api/judge/executor.js'));

(async () => {
  try {
    const question = {
      testCases: [
        { input: '1 2', expectedOutput: '3' },
        { input: '-1 5', expectedOutput: '4' }
      ]
    };

    const pythonCode = `
import sys
if __name__ == '__main__':
    a, b = map(int, sys.stdin.read().split())
    print(a + b)
    `;

    console.log('Judging Python code...');
    const result = await executor.judge(question, 'python', pythonCode);
    console.log(JSON.stringify(result, null, 2));

    const cppCode = `
#include <iostream>
using namespace std;
int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << a + b << endl;
    }
    return 0;
}
    `;
    console.log('Judging C++ code...');
    const cppResult = await executor.judge(question, 'cpp', cppCode);
    console.log(JSON.stringify(cppResult, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    executor.cleanup();
  }
})();
