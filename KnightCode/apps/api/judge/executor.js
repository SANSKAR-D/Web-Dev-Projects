const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class Executor {
  createTempDir() {
    const dir = path.join(os.tmpdir(), 'knightcode_judge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8));
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  cleanupDir(dir) {
    try {
      if (dir && fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error('Cleanup error:', e.message);
    }
  }

  async compile(language, code, tempDir) {
    const useDocker = process.env.USE_DOCKER === 'true';

    if (language === 'cpp') {
      const sourcePath = path.join(tempDir, 'solution.cpp');
      const binName = os.platform() === 'win32' ? 'solution.exe' : 'solution';
      fs.writeFileSync(sourcePath, code);

      return new Promise((resolve, reject) => {
        let command, args;
        
        if (useDocker) {
          command = 'docker';
          args = [
            'run', '--rm', 
            '-v', `${tempDir}:/app`, 
            '-w', '/app', 
            'knightcode-judge', 
            'g++', 'solution.cpp', '-o', 'solution', '-O3', '-std=c++17'
          ];
        } else {
          command = 'g++';
          args = ['solution.cpp', '-o', binName, '-O3', '-std=c++17'];
        }

        const compiler = spawn(command, args, { cwd: tempDir });
        
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

  async run(language, binPath, code, input, timeLimit = 1000, memoryLimit = 268435456, tempDir) {
    const useDocker = process.env.USE_DOCKER === 'true';
    let command, args;
    
    const sourceName = language === 'cpp' ? binPath : `solution.${language === 'python' ? 'py' : 'js'}`;

    if (language !== 'cpp') {
      const filePath = path.join(tempDir, sourceName);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, code);
      }
    }

    if (useDocker) {
      command = 'docker';
      const baseArgs = [
        'run', '-i', '--rm', 
        '--net=none', '--cpus=0.5', '--memory=256m', 
        '-v', `${tempDir}:/app`, 
        '-w', '/app', 
        '--user', 'judgeuser', 
        'knightcode-judge'
      ];

      if (language === 'cpp') {
        args = [...baseArgs, './solution'];
      } else if (language === 'python') {
        args = [...baseArgs, 'python3', `./${sourceName}`];
      } else if (language === 'javascript') {
        args = [...baseArgs, 'node', `./${sourceName}`];
      }
    } else {
      // Direct execution
      if (language === 'cpp') {
        command = os.platform() === 'win32' ? `.\\${binPath}` : `./${binPath}`;
        args = [];
      } else if (language === 'python') {
        command = 'python3';
        args = [sourceName];
      } else if (language === 'javascript') {
        command = 'node';
        args = [sourceName];
      }
    }

    if (!command) throw new Error('Unsupported language: ' + language);

    return new Promise((resolve) => {
      const child = spawn(command, args, { cwd: tempDir });
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
    const tempDir = this.createTempDir();
    try {
      const binPath = await this.compile(language, code, tempDir);
      
      // Pre-write source file once for interpreted languages (avoid parallel write race)
      if (language !== 'cpp') {
        const srcName = `solution.${language === 'python' ? 'py' : 'js'}`;
        fs.writeFileSync(path.join(tempDir, srcName), code);
      }
      
      const results = [];
      let allPassed = true;
      const CHUNK_SIZE = 10;

      // Process testcases in batches
      const limitTime = question.timeLimit || 1000;
      const limitMem = question.memoryLimit || 268435456;

      for (let i = 0; i < question.testCases.length; i += CHUNK_SIZE) {
        const chunk = question.testCases.slice(i, i + CHUNK_SIZE);
        
        const chunkPromises = chunk.map(async (testCase) => {
          const result = await this.run(language, binPath || code, code, testCase.input, limitTime, limitMem, tempDir);
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
      this.cleanupDir(tempDir);
    }
  }

  async runCustom(language, code, testCases) {
    const tempDir = this.createTempDir();
    try {
      const binPath = await this.compile(language, code, tempDir);
      
      // Pre-write source file once for interpreted languages
      if (language !== 'cpp') {
        const srcName = `solution.${language === 'python' ? 'py' : 'js'}`;
        fs.writeFileSync(path.join(tempDir, srcName), code);
      }
      
      const results = [];
      const CHUNK_SIZE = 10;

      for (let i = 0; i < testCases.length; i += CHUNK_SIZE) {
        const chunk = testCases.slice(i, i + CHUNK_SIZE);
        
        const chunkPromises = chunk.map(async (testCase) => {
          const result = await this.run(language, binPath || code, code, testCase.input, 1000, undefined, tempDir);
          
          return {
            input: testCase.input,
            actual: result.output,
            status: result.status 
          };
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }

      return {
        overallStatus: 'Executed',
        testResults: results
      };
    } catch (err) {
      return {
        overallStatus: 'Error',
        message: err.message
      };
    } finally {
      this.cleanupDir(tempDir);
    }
  }
}


module.exports = new Executor();
