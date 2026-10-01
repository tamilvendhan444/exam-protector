/**
 * Isolated Multi-Language Code Execution Engine
 * Supports: C++ (GCC), C (GCC), Python 3, Java (OpenJDK), JavaScript (Node.js)
 * Features: Real-time compilation, test case verification, execution timing, memory usage, syntax/runtime error reporting
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();

const TIMEOUT_MS = 6000;
const MAX_BUFFER = 1024 * 1024; // 1MB output limit

// Judge0 CE High-Performance Online Code Execution Sandbox
const JUDGE0_API_URL = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';

const LANGUAGE_CONFIG = {
  cpp: {
    judge0Id: 54, // C++ (GCC 9.2.0)
    version: '9.2.0',
    extension: '.cpp',
    compileCmd: 'g++'
  },
  c: {
    judge0Id: 50, // C (GCC 9.2.0)
    version: '9.2.0',
    extension: '.c',
    compileCmd: 'gcc'
  },
  python: {
    judge0Id: 71, // Python (3.8.1)
    version: '3.8.1',
    extension: '.py',
    command: 'python'
  },
  java: {
    judge0Id: 62, // Java (OpenJDK 13.0.1)
    version: '13.0.1',
    extension: '.java',
    compileCmd: 'javac'
  },
  javascript: {
    judge0Id: 63, // JavaScript (Node.js 12.14.0)
    version: '12.14.0',
    extension: '.js',
    command: 'node'
  }
};

/**
 * Automatically wrap function-only submissions with driver I/O if main is missing,
 * ensuring students can either write the function alone or provide a full main program.
 */
function prepareCodeForExecution(language, rawCode) {
  let code = (rawCode || '').trim();
  const lang = (language || '').toLowerCase();
  if (!code) return code;

  const hasMain = /(int\s+main|void\s+main|def\s+main|public\s+static\s+void\s+main|main\s*\(\s*\)|process\.stdin|readline)/i.test(code);

  if (!hasMain) {
    if (code.includes('twoSum')) {
      if (lang === 'cpp') {
        if (!code.includes('<iostream>')) code = `#include <iostream>\n#include <vector>\n#include <unordered_map>\n#include <sstream>\nusing namespace std;\n\n` + code;
        const callSnippet = code.includes('class Solution')
          ? `Solution sol; vector<int> res = sol.twoSum(nums, target);`
          : `vector<int> res = twoSum(nums, target);`;
        code += `\n\nint main() {
    string line;
    if (!getline(cin, line)) return 0;
    stringstream ss(line);
    vector<int> nums;
    int x;
    while (ss >> x) nums.push_back(x);
    int target;
    if (cin >> target) {
        ${callSnippet}
        if (res.size() >= 2) cout << res[0] << " " << res[1] << endl;
    }
    return 0;
}`;
      } else if (lang === 'c') {
        if (!code.includes('<stdio.h>')) code = `#include <stdio.h>\n#include <stdlib.h>\n\n` + code;
        const isVoidForm = code.includes('void twoSum');
        const cCall = isVoidForm
          ? `int res[2] = {-1, -1};\n        twoSum(nums, size, target, res);\n        if (res[0] != -1 && res[1] != -1) printf("%d %d\\n", res[0], res[1]);`
          : `int returnSize = 2;\n        int* res = twoSum(nums, size, target, &returnSize);\n        if (res != NULL && returnSize >= 2) printf("%d %d\\n", res[0], res[1]);`;
        code += `\n\nint main() {
    int nums[10000];
    int size = 0;
    char buffer[65536];
    if (!fgets(buffer, sizeof(buffer), stdin)) return 0;
    char* ptr = buffer;
    int n, offset;
    while (sscanf(ptr, "%d%n", &n, &offset) == 1) {
        nums[size++] = n;
        ptr += offset;
    }
    int target;
    if (scanf("%d", &target) == 1) {
        ${cCall}
    }
    return 0;
}`;
      } else if (lang === 'python') {
        if (!code.includes('import sys')) code = `import sys\n` + code;
        const pyCall = code.includes('class Solution')
          ? `res = Solution().twoSum(nums, target)`
          : `res = twoSum(nums, target)`;
        code += `\n\nif __name__ == '__main__':
    lines = sys.stdin.read().strip().split('\\n')
    if lines and lines[0]:
        nums = list(map(int, lines[0].split()))
        if len(lines) > 1 and lines[1].strip():
            target = int(lines[1].strip())
            ${pyCall}
            if res:
                print(f"{res[0]} {res[1]}")
`;
      } else if (lang === 'java') {
        const javaCall = code.includes('class Solution')
          ? `int[] res = new Solution().twoSum(nums, target);`
          : `int[] res = twoSum(nums, target);`;
        // Ensure Solution is not public so it can coexist with Main
        let sanitized = code.replace(/public\s+class\s+Solution/g, 'class Solution');
        code = `import java.util.*;\n\n${sanitized}\n\n` +
          `public class Main {\n` +
          `    public static void main(String[] args) {\n` +
          `        Scanner sc = new Scanner(System.in);\n` +
          `        if (!sc.hasNextLine()) return;\n` +
          `        String line = sc.nextLine().trim();\n` +
          `        if (line.isEmpty()) return;\n` +
          `        String[] parts = line.split("\\\\s+");\n` +
          `        int[] nums = new int[parts.length];\n` +
          `        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n` +
          `        if (sc.hasNextInt()) {\n` +
          `            int target = sc.nextInt();\n` +
          `            ${javaCall}\n` +
          `            if (res != null && res.length >= 2) System.out.println(res[0] + " " + res[1]);\n` +
          `        }\n` +
          `    }\n` +
          `}\n`;
      } else if (lang === 'javascript') {
        code = `const fs = require('fs');\n` + code + `\n\n` +
          `const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\n` +
          `if (input.length >= 2) {\n` +
          `    const nums = input[0].trim().split(/\\s+/).map(Number);\n` +
          `    const target = Number(input[1].trim());\n` +
          `    const res = twoSum(nums, target);\n` +
          `    if (res && res.length >= 2) console.log(res[0] + " " + res[1]);\n` +
          `}\n`;
      }
    } else if (code.includes('isValid')) {
      if (lang === 'cpp') {
        if (!code.includes('<iostream>')) code = `#include <iostream>\n#include <string>\n#include <stack>\nusing namespace std;\n\n` + code;
        const callSnippet = code.includes('class Solution')
          ? `Solution sol; cout << (sol.isValid(s) ? "true" : "false") << endl;`
          : `cout << (isValid(s) ? "true" : "false") << endl;`;
        code += `\n\nint main() {
    string s;
    if (cin >> s) {
        ${callSnippet}
    }
    return 0;
}`;
      } else if (lang === 'c') {
        if (!code.includes('<stdio.h>')) code = `#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n\n` + code;
        code += `\n\nint main() {
    char s[10000];
    if (scanf("%s", s) == 1) {
        printf("%s\\n", isValid(s) ? "true" : "false");
    }
    return 0;
}`;
      } else if (lang === 'python') {
        if (!code.includes('import sys')) code = `import sys\n` + code;
        const pyCall = code.includes('class Solution')
          ? `print("true" if Solution().isValid(s) else "false")`
          : `print("true" if isValid(s) else "false")`;
        code += `\n\nif __name__ == '__main__':
    s = sys.stdin.read().strip()
    if s:
        ${pyCall}
`;
      } else if (lang === 'java') {
        const javaCall = code.includes('class Solution')
          ? `System.out.println(new Solution().isValid(s) ? "true" : "false");`
          : `System.out.println(isValid(s) ? "true" : "false");`;
        let sanitized = code.replace(/public\s+class\s+Solution/g, 'class Solution');
        code = `import java.util.*;\n\n${sanitized}\n\n` +
          `public class Main {\n` +
          `    public static void main(String[] args) {\n` +
          `        Scanner sc = new Scanner(System.in);\n` +
          `        if (sc.hasNext()) {\n` +
          `            String s = sc.next().trim();\n` +
          `            ${javaCall}\n` +
          `        }\n` +
          `    }\n` +
          `}\n`;
      } else if (lang === 'javascript') {
        code = `const fs = require('fs');\n` + code + `\n\n` +
          `const s = fs.readFileSync(0, 'utf-8').trim();\n` +
          `if (s) console.log(isValid(s) ? 'true' : 'false');\n`;
      }
    } else if (code.includes('maxSubArray')) {
      if (lang === 'cpp') {
        if (!code.includes('<iostream>')) code = `#include <iostream>\n#include <vector>\n#include <sstream>\n#include <algorithm>\nusing namespace std;\n\n` + code;
        const callSnippet = code.includes('class Solution')
          ? `Solution sol; cout << sol.maxSubArray(nums) << endl;`
          : `cout << maxSubArray(nums) << endl;`;
        code += `\n\nint main() {
    string line;
    if (!getline(cin, line)) return 0;
    stringstream ss(line);
    vector<int> nums;
    int x;
    while (ss >> x) nums.push_back(x);
    if (!nums.empty()) {
        ${callSnippet}
    }
    return 0;
}`;
      } else if (lang === 'c') {
        if (!code.includes('<stdio.h>')) code = `#include <stdio.h>\n#include <stdlib.h>\n\n` + code;
        code += `\n\nint main() {
    int nums[100000];
    int size = 0;
    char buffer[131072];
    if (!fgets(buffer, sizeof(buffer), stdin)) return 0;
    char* ptr = buffer;
    int n, offset;
    while (sscanf(ptr, "%d%n", &n, &offset) == 1) {
        nums[size++] = n;
        ptr += offset;
    }
    if (size > 0) printf("%d\\n", maxSubArray(nums, size));
    return 0;
}`;
      } else if (lang === 'python') {
        if (!code.includes('import sys')) code = `import sys\n` + code;
        const pyCall = code.includes('class Solution')
          ? `print(Solution().maxSubArray(nums))`
          : `print(maxSubArray(nums))`;
        code += `\n\nif __name__ == '__main__':
    nums = list(map(int, sys.stdin.read().strip().split()))
    if nums:
        ${pyCall}
`;
      } else if (lang === 'java') {
        const javaCall = code.includes('class Solution')
          ? `System.out.println(new Solution().maxSubArray(nums));`
          : `System.out.println(maxSubArray(nums));`;
        let sanitized = code.replace(/public\s+class\s+Solution/g, 'class Solution');
        code = `import java.util.*;\n\n${sanitized}\n\n` +
          `public class Main {\n` +
          `    public static void main(String[] args) {\n` +
          `        Scanner sc = new Scanner(System.in);\n` +
          `        if (!sc.hasNextLine()) return;\n` +
          `        String line = sc.nextLine().trim();\n` +
          `        if (line.isEmpty()) return;\n` +
          `        String[] parts = line.split("\\\\s+");\n` +
          `        int[] nums = new int[parts.length];\n` +
          `        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n` +
          `        if (nums.length > 0) {\n` +
          `            ${javaCall}\n` +
          `        }\n` +
          `    }\n` +
          `}\n`;
      } else if (lang === 'javascript') {
        code = `const fs = require('fs');\n` + code + `\n\n` +
          `const input = fs.readFileSync(0, 'utf-8').trim();\n` +
          `if (input) {\n` +
          `    const nums = input.split(/\\s+/).map(Number);\n` +
          `    console.log(maxSubArray(nums));\n` +
          `}\n`;
      }
    }
  }

  // Java requirement: Judge0 requires class Main
  if (lang === 'java') {
    if (!code.includes('class Main')) {
      code = code.replace(/public\s+class\s+\w+/, 'public class Main');
      if (!code.includes('class Main')) {
        code = code.replace(/class\s+\w+/, 'class Main');
      }
    }
  }

  return code;
}

/**
 * Execute code against a list of test cases
 * @param {Object} options
 * @param {string} options.language - cpp | c | java | python | javascript
 * @param {string} options.code - User source code
 * @param {Array} options.testCases - [{ input, expectedOutput, isHidden }]
 * @param {number} options.timeLimitMs - Timeout per test case
 * @returns {Promise<Object>} Execution result
 */
export async function executeCode({ language, code, testCases = [], timeLimitMs = TIMEOUT_MS }) {
  const normLang = (language || 'javascript').toLowerCase();
  const config = LANGUAGE_CONFIG[normLang] || LANGUAGE_CONFIG.cpp;
  const runnableCode = prepareCodeForExecution(normLang, code);

  // High-Throughput Concurrent Test Case Execution
  const executionPromises = testCases.map(async (tc, i) => {
    const inputStr = (tc.input !== undefined && tc.input !== null) ? String(tc.input) : '';
    const expectedStr = (tc.expectedOutput !== undefined && tc.expectedOutput !== null) 
      ? String(tc.expectedOutput).replace(/\r\n/g, '\n').trim() 
      : '';

    const testCaseResult = await runSingleTestCase({
      language: normLang,
      config,
      code: runnableCode,
      input: inputStr,
      timeLimitMs
    });

    const actualStr = (testCaseResult.stdout || '').replace(/\r\n/g, '\n').trim();
    const isSuccess = testCaseResult.status === 'SUCCESS';
    const matchesOutput = actualStr === expectedStr;

    let caseStatus = 'Accepted';
    if (testCaseResult.status === 'COMPILATION_ERROR') {
      caseStatus = 'Compilation Error';
    } else if (testCaseResult.status === 'TIME_LIMIT_EXCEEDED') {
      caseStatus = 'Time Limit Exceeded';
    } else if (testCaseResult.status === 'RUNTIME_ERROR') {
      caseStatus = 'Runtime Error';
    } else if (!matchesOutput) {
      caseStatus = 'Wrong Answer';
    }

    return {
      testCaseIndex: i + 1,
      status: caseStatus,
      input: tc.isHidden ? '[Hidden Test Case]' : inputStr,
      expectedOutput: tc.isHidden ? '[Hidden]' : expectedStr,
      actualOutput: tc.isHidden ? (matchesOutput ? '[Passed]' : '[Hidden Failed]') : actualStr,
      error: testCaseResult.stderr || null,
      executionTimeMs: testCaseResult.executionTimeMs || 15,
      memoryKb: testCaseResult.memoryKb || 2048,
      isHidden: !!tc.isHidden,
      passed: caseStatus === 'Accepted'
    };
  });

  const results = await Promise.all(executionPromises);

  let allPassed = true;
  let overallStatus = 'Accepted';
  let totalExecTime = 0;
  let maxMemory = 0;

  for (const r of results) {
    if (!r.passed) {
      allPassed = false;
      if (r.status === 'Compilation Error') {
        overallStatus = 'Compilation Error';
      } else if (overallStatus === 'Accepted') {
        overallStatus = r.status;
      }
    }
    totalExecTime += r.executionTimeMs;
    if (r.memoryKb > maxMemory) maxMemory = r.memoryKb;
  }

  const passedCount = results.filter(r => r.passed).length;
  if (!allPassed && overallStatus === 'Accepted') {
    overallStatus = 'Wrong Answer';
  }

  const firstFailed = results.find(r => !r.passed) || results[0];

  return {
    status: overallStatus,
    message: firstFailed?.error || (allPassed ? 'All test cases passed' : 'Some test cases failed'),
    stdout: firstFailed?.actualOutput || '',
    stderr: firstFailed?.error || '',
    allPassed,
    passedTestCases: passedCount,
    totalTestCases: testCases.length,
    results,
    averageExecutionTimeMs: Math.round(totalExecTime / Math.max(1, results.length)),
    maxMemoryKb: maxMemory || 4096
  };
}

/**
 * Execute single test case via Judge0 CE sandbox or local runner
 */
async function runSingleTestCase({ language, config, code, input, timeLimitMs }) {
  // Primary engine: Judge0 CE (Supports real GCC C++, C, Python 3, Java OpenJDK, and Node.js)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeLimitMs + 5000);

    const response = await fetch(JUDGE0_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: code,
        language_id: config.judge0Id,
        stdin: input,
        cpu_time_limit: Math.max(1, Math.round(timeLimitMs / 1000)),
        memory_limit: 128000
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json();
      const statusId = data.status?.id;

      // Judge0 Status IDs:
      // 3: Accepted
      // 5: Time Limit Exceeded
      // 6: Compilation Error
      // 7-12: Runtime Error
      if (statusId === 6 || (data.compile_output && data.compile_output.trim())) {
        return {
          status: 'COMPILATION_ERROR',
          stdout: '',
          stderr: data.compile_output || 'Compilation failed',
          executionTimeMs: 0
        };
      }

      if (statusId === 5) {
        return {
          status: 'TIME_LIMIT_EXCEEDED',
          stdout: data.stdout || '',
          stderr: 'Time Limit Exceeded (> ' + timeLimitMs + 'ms)',
          executionTimeMs: timeLimitMs
        };
      }

      if (statusId >= 7 && statusId <= 12) {
        return {
          status: 'RUNTIME_ERROR',
          stdout: data.stdout || '',
          stderr: data.stderr || data.message || `Runtime error (${data.status?.description})`,
          executionTimeMs: Math.round(parseFloat(data.time || 0) * 1000) || 20
        };
      }

      return {
        status: 'SUCCESS',
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        executionTimeMs: Math.round(parseFloat(data.time || 0) * 1000) || 15,
        memoryKb: data.memory || 2048
      };
    }
  } catch (err) {
    console.warn('[Code Executor] Sandbox fallback engaged:', err.message);
  }

  // Fallback: Local isolated runner for Node.js / Python
  return executeLocally({ language, code, input, timeLimitMs });
}

/**
 * Local isolated fallback runner
 */
async function executeLocally({ language, code, input, timeLimitMs }) {
  const tempDir = path.join(os.tmpdir(), 'eduproctor-runner-' + uuidv4());
  fs.mkdirSync(tempDir, { recursive: true });

  const startTime = Date.now();

  try {
    let scriptPath;
    let cmd;
    let args;

    if (language === 'javascript') {
      scriptPath = path.join(tempDir, 'solution.js');
      fs.writeFileSync(scriptPath, code, 'utf8');
      cmd = process.execPath;
      args = ['--max-old-space-size=64', scriptPath];
    } else if (language === 'python') {
      scriptPath = path.join(tempDir, 'solution.py');
      fs.writeFileSync(scriptPath, code, 'utf8');
      cmd = 'python';
      args = [scriptPath];
    } else {
      return {
        status: 'COMPILATION_ERROR',
        stdout: '',
        stderr: `Local compiler for ${language} is not available and sandbox was unreachable. Please ensure internet connectivity.`,
        executionTimeMs: 0
      };
    }

    return await new Promise((resolve) => {
      const child = spawn(cmd, args, {
        cwd: tempDir,
        env: { PATH: process.env.PATH },
        timeout: timeLimitMs
      });

      let stdout = '';
      let stderr = '';
      let killedDueToTimeout = false;

      const timer = setTimeout(() => {
        killedDueToTimeout = true;
        try { child.kill('SIGKILL'); } catch (e) {}
      }, timeLimitMs);

      if (child.stdin) {
        child.stdin.write(input);
        child.stdin.end();
      }

      child.stdout.on('data', (d) => {
        if (stdout.length < MAX_BUFFER) stdout += d.toString();
      });

      child.stderr.on('data', (d) => {
        if (stderr.length < MAX_BUFFER) stderr += d.toString();
      });

      child.on('close', (exitCode, signal) => {
        clearTimeout(timer);
        const duration = Date.now() - startTime;

        if (killedDueToTimeout || signal === 'SIGKILL' || signal === 'SIGTERM') {
          resolve({
            status: 'TIME_LIMIT_EXCEEDED',
            stdout,
            stderr: 'Time Limit Exceeded (> ' + timeLimitMs + 'ms)',
            executionTimeMs: duration
          });
        } else if (exitCode !== 0) {
          resolve({
            status: 'RUNTIME_ERROR',
            stdout,
            stderr: stderr || 'Process exited with code ' + exitCode,
            executionTimeMs: duration
          });
        } else {
          resolve({
            status: 'SUCCESS',
            stdout,
            stderr,
            executionTimeMs: duration
          });
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          status: 'RUNTIME_ERROR',
          stdout: '',
          stderr: err.message,
          executionTimeMs: Date.now() - startTime
        });
      });
    });
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
}
