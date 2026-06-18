import vm from 'vm';

interface CompileRequest {
  code: string;
  language: string;
  testCode?: string;
  exerciseType?: 'fill-in' | 'write' | 'fix' | 'test';
  setupCode?: string;
}

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

interface CompileResult {
  output: string;
  passed: boolean;
  testResults: TestResult[];
  error: string | null;
}

// Judge0 is an open-source online code execution system.
const JUDGE0_API_URL = (process.env.JUDGE0_API_URL || 'https://ce.judge0.com').replace(/\/+$/, '');

// Import shared language configuration
import { JUDGE0_LANGUAGE_IDS as JUDGE0_IDS } from '../config/languageConfig';
export { LANGUAGE_NAMES, LANGUAGE_COLORS, DEFAULT_INITIAL_CODE } from '../config/languageConfig';
const JUDGE0_LANGUAGE_IDS = JUDGE0_IDS;

// ─── Judge0 API Execution ──────────────────────────────────────────────────

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  exit_code: number | null;
  exit_signal: number | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

/**
 * Execute code using the Judge0 API.
 * Uses synchronous mode (wait=true) for simplicity.
 */
async function executeWithJudge0(code: string, languageId: number, stdin: string = ''): Promise<{ stdout: string; error: string | null }> {
  const url = `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  // No API key required — the public Judge0 CE instance is open source and free.

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin,
        cpu_time_limit: 5,
        memory_limit: 128000,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded (429). Please wait a moment and try again.`);
      }
      if (response.status >= 500) {
        throw new Error(`Judge0 service error (${response.status}). The remote code runner is temporarily unavailable. Please try again later.`);
      }
      throw new Error(`Judge0 API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as Judge0Response;

    const statusId = data.status?.id;
    const stdout = data.stdout || '';
    const stderr = data.stderr || '';
    const compileOutput = data.compile_output || '';
    const statusDescription = data.status?.description || 'Unknown';

    // 3 = Accepted (success)
    if (statusId === 3) {
      return { stdout: stdout.trim(), error: null };
    }

    // 6 = Compilation Error
    if (statusId === 6) {
      const errorMsg = compileOutput || stderr || statusDescription;
      return { stdout: stdout?.trim() || '', error: `Compilation Error:\n${errorMsg}` };
    }

    // 7-12 = Runtime Errors
    if (statusId >= 7 && statusId <= 12) {
      const errorMsg = stderr || compileOutput || statusDescription;
      return { stdout: stdout?.trim() || '', error: `Runtime Error (${statusDescription}):\n${errorMsg}` };
    }

    // Other errors (time limit, internal error, etc.)
    if (statusId === 5) {
      return { stdout: stdout?.trim() || '', error: 'Time Limit Exceeded. Your code took too long to execute.' };
    }

    if (statusId === 13) {
      return { stdout: stdout?.trim() || '', error: `Internal Error: ${data.message || statusDescription}` };
    }

    // Fallback: include stderr/compile_output if present
    const combinedError = [stderr, compileOutput, statusDescription].filter(Boolean).join('\n');
    return { stdout: stdout?.trim() || '', error: combinedError || statusDescription };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        stdout: '',
        error: '⏱ Code execution timed out. Your code took too long to execute (30s limit).\n\nSuggestions:\n• Check for infinite loops or long-running operations\n• Simplify complex computations\n• Try running smaller code snippets'
      };
    }

    // Network-level failures (DNS resolution, connection refused, etc.)
    if (err.message?.includes('fetch') || err.message?.includes('ENOTFOUND') || err.message?.includes('ECONNREFUSED') || err.message?.includes('Network')) {
      return {
        stdout: '',
        error: '🔌 Code execution service is not reachable.\n\nThe remote code runner (Judge0) could not be reached from this server.\n\nSuggestions:\n• Check your internet connection\n• Set JUDGE0_API_URL to a self-hosted Judge0 instance\n• Try again later\n\nNote: JavaScript, TypeScript, HTML, and CSS exercises still work without this service.'
      };
    }

    // Rate limiting / service unavailable
    if (err.message?.includes('429') || err.message?.includes('Rate limit') || err.message?.includes('503')) {
      return {
        stdout: '',
        error: '⏳ Code execution service is temporarily unavailable.\n\nThe remote code runner is experiencing high demand or is temporarily down.\n\nSuggestions:\n• Wait a moment and try again\n• If the problem persists, contact the platform administrator'
      };
    }

    // Generic API error with helpful fallback message
    return {
      stdout: '',
      error: `❌ Code execution service error.\n\nThe remote code runner returned an error:\n${err.message}\n\nSuggestions:\n• Try running your code again in a few seconds\n• If the problem persists, contact the platform administrator\n\nNote: JavaScript, TypeScript, HTML, and CSS exercises still work without this service.`
    };
  }
}

// ─── JavaScript Execution (VM sandbox) ─────────────────────────────────────

/**
 * Execute JavaScript code safely using Node.js vm module
 */
function executeJavaScript(code: string, setupCode?: string): { stdout: string; error: string | null } {
  let stdout = '';
  const consoleLogs: string[] = [];

  const sandbox = {
    console: {
      log: (...args: any[]) => {
        consoleLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
      },
      error: (...args: any[]) => {
        consoleLogs.push('Error: ' + args.map(a => String(a)).join(' '));
      },
      warn: (...args: any[]) => {
        consoleLogs.push('Warning: ' + args.map(a => String(a)).join(' '));
      },
    },
    setTimeout: (fn: (...args: any[]) => void, ms: number) => {
      if (ms === 0) fn();
    },
    Math,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    RegExp,
    Map,
    Set,
    Promise,
    Error,
    TypeError,
    RangeError,
    ReferenceError,
    SyntaxError,
  };

  try {
    const context = vm.createContext(sandbox);
    const fullCode = setupCode ? `${setupCode}\n\n${code}` : code;

    const script = new vm.Script(fullCode, {
      filename: 'code-editor.js',
    });

    script.runInContext(context, {
      timeout: 5000,
      breakOnSigint: true,
    });

    stdout = consoleLogs.join('\n');
    return { stdout, error: null };
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    if (consoleLogs.length > 0) {
      return { stdout: consoleLogs.join('\n'), error: errorMsg };
    }
    return { stdout: '', error: errorMsg };
  }
}

// ─── HTML Execution ────────────────────────────────────────────────────────

function executeHtml(code: string): { stdout: string; error: string | null } {
  return { stdout: code, error: null };
}

// ─── CSS Execution ─────────────────────────────────────────────────────────

function executeCss(code: string): { stdout: string; error: string | null } {
  return { stdout: code, error: null };
}

// ─── JavaScript Test Runner ────────────────────────────────────────────────

function runTests(code: string, testCode: string, language: string, setupCode?: string): TestResult[] {
  const testResults: TestResult[] = [];

  const testContext = vm.createContext({
    console: {
      log: (...args: any[]) => {
        const msg = args.join(' ');
        if (msg.startsWith('TEST_RESULT:')) {
          const parts = msg.replace('TEST_RESULT:', '').split('|');
          testResults.push({
            name: parts[0] || 'Unnamed Test',
            passed: parts[1] === 'true',
            expected: parts[2] || '',
            actual: parts[3] || '',
          });
        }
      },
      error: (...args: any[]) => {},
    },
    assert: {
      equals: (actual: any, expected: any, name?: string) => {
        const passed = actual === expected;
        testResults.push({ name: name || 'Unnamed Test', passed, expected: JSON.stringify(expected), actual: JSON.stringify(actual) });
      },
      notEquals: (actual: any, expected: any, name?: string) => {
        const passed = actual !== expected;
        testResults.push({ name: name || 'Unnamed Test', passed, expected: `NOT ${JSON.stringify(expected)}`, actual: JSON.stringify(actual) });
      },
      isTrue: (actual: any, name?: string) => {
        const passed = !!actual;
        testResults.push({ name: name || 'Unnamed Test', passed, expected: 'true', actual: JSON.stringify(actual) });
      },
      isFalse: (actual: any, name?: string) => {
        const passed = !actual;
        testResults.push({ name: name || 'Unnamed Test', passed, expected: 'false', actual: JSON.stringify(actual) });
      },
      deepEquals: (actual: any, expected: any, name?: string) => {
        const passed = JSON.stringify(actual) === JSON.stringify(expected);
        testResults.push({ name: name || 'Unnamed Test', passed, expected: JSON.stringify(expected), actual: JSON.stringify(actual) });
      },
    },
    describe: (name: string, fn: Function) => {
      try { fn(); } catch (e: any) {
        testResults.push({ name: `Test Suite: ${name}`, passed: false, expected: 'No errors', actual: e.message, error: e.message });
      }
    },
    it: (name: string, fn: Function) => {
      try { fn(); } catch (e: any) {
        testResults.push({ name, passed: false, expected: 'No errors', actual: e.message, error: e.message });
      }
    },
    Math, JSON, Array, Object, String, Number, Boolean, Date, RegExp, Map, Set, Promise,
    parseInt, parseFloat, isNaN, isFinite, Error, TypeError, RangeError, ReferenceError, SyntaxError,
  });

  try {
    if (setupCode) {
      const setupScript = new vm.Script(setupCode, { filename: 'setup-code.js' });
      setupScript.runInContext(testContext, { timeout: 3000 });
    }

    const userScript = new vm.Script(code, { filename: 'user-code.js' });
    userScript.runInContext(testContext, { timeout: 3000 });

    const testScript = new vm.Script(testCode, { filename: 'test-code.js' });
    testScript.runInContext(testContext, { timeout: 5000 });
  } catch (err: any) {
    testResults.push({
      name: 'Test Execution Error',
      passed: false,
      expected: 'Tests to run successfully',
      actual: err.message,
      error: err.message,
    });
  }

  return testResults;
}

// ─── Main Compile Function ─────────────────────────────────────────────────

/**
 * Main compile function.
 * - JavaScript/TypeScript: Uses Node.js vm module (sandboxed, supports tests)
 * - HTML: Returns code for iframe rendering
 * - CSS: Returns code for styling
 * - All other languages: Uses Judge0 API for remote execution
 */
export async function compileCode(request: CompileRequest): Promise<CompileResult> {
  const { code, language, testCode, exerciseType, setupCode } = request;

  if (!code || code.trim() === '') {
    return { output: '', passed: false, testResults: [], error: 'No code provided' };
  }

  let output = '';
  let error: string | null = null;
  let testResults: TestResult[] = [];
  let passed = true;

  try {
    switch (language) {
      // ── JavaScript/TypeScript: Use VM sandbox (supports tests) ──
      case 'javascript':
      case 'typescript': {
        const jsResult = executeJavaScript(code, setupCode);
        output = jsResult.stdout;
        error = jsResult.error;

        if (testCode) {
          testResults = runTests(code, testCode, language, setupCode);
          passed = testResults.length === 0 || testResults.every(t => t.passed);
        } else {
          passed = error === null;
        }
        break;
      }

      // ── HTML: Return as-is for iframe rendering ──
      case 'html': {
        const htmlResult = executeHtml(code);
        output = htmlResult.stdout;
        error = htmlResult.error;
        passed = error === null;
        break;
      }

      // ── CSS: Return as-is for styling ──
      case 'css': {
        const cssResult = executeCss(code);
        output = cssResult.stdout;
        error = cssResult.error;
        passed = error === null;
        break;
      }

      // ── All other languages: Use Judge0 API ──
      default: {
        const judge0Id = JUDGE0_LANGUAGE_IDS[language];
        if (!judge0Id) {
          error = `Unsupported language: ${language}. Supported languages are: ${Object.keys(JUDGE0_LANGUAGE_IDS).join(', ')}, javascript, typescript, html, css`;
          passed = false;
          break;
        }

        let fullCode = code;
        if (setupCode) {
          // For most languages, prepend setup code (works for Python, Ruby, Bash, etc.)
          fullCode = `${setupCode}\n${code}`;
        }

        const judge0Result = await executeWithJudge0(fullCode, judge0Id);
        output = judge0Result.stdout;
        error = judge0Result.error;
        passed = error === null;
        break;
      }
    }
  } catch (err: any) {
    error = err.message || String(err);
    passed = false;
  }

  return { output, passed, testResults, error };
}
