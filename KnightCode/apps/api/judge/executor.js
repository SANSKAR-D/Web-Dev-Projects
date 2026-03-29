const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class Executor {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'knightcode_judge_' + Date.now());
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async compile(language, code) {
    if (language === 'cpp') {
      const sourcePath = path.join(this.tempDir, 'solution.cpp');
      const binName = 'solution'; // Linux executable inside container
      fs.writeFileSync(sourcePath, code);

      return new Promise((resolve, reject) => {
        const compiler = spawn('docker', [
          'run', '--rm', 
          '-v', `${this.tempDir}:/app`, 
          '-w', '/app', 
          'knightcode-judge', 
          'g++', 'solution.cpp', '-o', binName, '-O3', '-std=c++17'
        ]);
        
        let errStr = '';
        compiler.stderr.on('data', (data) => { errStr += data.toString(); });
        
        compiler.on('close', (code) => {
          if (code === 0) resolve(binName);
          else reject(new Error('Compilation Error: ' + errStr));
        });
      });
    }
    return null; // No compilation needed for Python/JS
  }

  async run(language, binPath, code, input, timeLimit = 2000) {
    let command = 'docker';
    let args = [];
    
    const sourceName = language === 'cpp' ? binPath : `solution.${language === 'python' ? 'py' : 'js'}`;

    if (language !== 'cpp') {
      fs.writeFileSync(path.join(this.tempDir, sourceName), code);
    }

    const baseArgs = [
      'run', '-i', '--rm', 
      '--net=none', '--cpus=0.5', '--memory=256m', 
      '-v', `${this.tempDir}:/app`, 
      '-w', '/app', 
      '--user', 'judgeuser', 
      'knightcode-judge'
    ];

    if (language === 'cpp') {
      args = [...baseArgs, `./${sourceName}`];
    } else if (language === 'python') {
      args = [...baseArgs, 'python3', `./${sourceName}`];
    } else if (language === 'javascript') {
      args = [...baseArgs, 'node', `./${sourceName}`];
    } else {
      throw new Error('Unsupported language: ' + language);
    }

    return new Promise((resolve) => {
      const child = spawn(command, args);
      let output = '';
      let error = '';
      let isTerminated = false;

      const timer = setTimeout(() => {
        isTerminated = true;
        child.kill();
        resolve({ status: 'Time Limit Exceeded', output: '', time: timeLimit });
      }, timeLimit);

      child.stdin.write(input + '\n');
      child.stdin.end();

      child.stdout.on('data', (data) => { output += data.toString(); });
      child.stderr.on('data', (data) => { error += data.toString(); });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (isTerminated) return;
        
        if (code === 0) {
          resolve({ status: 'Success', output: output.trim(), time: 0 }); 
        } else {
          resolve({ status: 'Runtime Error', output: error.trim(), time: 0 });
        }
      });
    });
  }

  async judge(question, language, code) {
    try {
      const binPath = await this.compile(language, code);
      const results = [];
      let allPassed = true;
      const CHUNK_SIZE = 5; // Run 5 test cases in parallel

      // Process testcases in batches
      for (let i = 0; i < question.testCases.length; i += CHUNK_SIZE) {
        const chunk = question.testCases.slice(i, i + CHUNK_SIZE);
        
        const chunkPromises = chunk.map(async (testCase) => {
          const result = await this.run(language, binPath || code, code, testCase.input, 2000);
          const passed = result.status === 'Success' && result.output === testCase.expectedOutput;
          
          return {
            input: testCase.input,
            expected: testCase.expectedOutput,
            actual: result.output,
            status: passed ? 'Accepted' : (result.status === 'Success' ? 'Wrong Answer' : result.status),
            hidden: testCase.hidden,
            passed: passed
          };
        });

        const chunkResults = await Promise.all(chunkPromises);
        
        for (const res of chunkResults) {
          results.push({
             input: res.input,
             expected: res.expected,
             actual: res.actual,
             status: res.status,
             hidden: res.hidden
          });

          if (!res.passed) {
            allPassed = false;
          }
        }

        // Early exit: stop running subsequent testcases if any failed in the current chunk
        if (!allPassed) {
          break;
        }
      }

      return {
        overallStatus: allPassed ? 'Accepted' : 'Failed',
        testResults: results
      };
    } catch (err) {
      return {
        overallStatus: 'Error',
        message: err.message
      };
    } finally {
      // Cleanup? Maybe keep for a bit or delete
    }
  }

  cleanup() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }
}

module.exports = new Executor();
