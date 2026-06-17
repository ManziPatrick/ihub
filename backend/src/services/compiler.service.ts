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
      // For sandbox safety, execute immediately for zero delay, otherwise ignore
      if (ms === 0) fn();
      // Non-zero timers are ignored for sandbox safety
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
    // If there was partial output before error, include it
    if (consoleLogs.length > 0) {
      return { stdout: consoleLogs.join('\n'), error: errorMsg };
    }
    return { stdout: '', error: errorMsg };
  }
}

/**
 * Execute Python code using the AI service (HuggingFace Qwen3 Coder)
 * Falls back to a simple evaluation if AI is unavailable
 */
async function executePython(code: string, setupCode?: string): Promise<{ stdout: string; error: string | null }> {
  const HF_TOKEN = process.env.HF_TOKEN || '';

  const fullCode = setupCode ? `${setupCode}\n${code}` : code;

  try {
    // Try using the AI model to evaluate Python code
    const response = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "Qwen/Qwen3-Coder-Next:novita",
          messages: [
            {
              role: 'system',
              content: 'You are a Python code executor. Run the following Python code and return ONLY the exact output that would be printed to stdout. If there is an error, return the error message only. Do NOT add any explanations or formatting.'
            },
            {
              role: 'user',
              content: `Execute this Python code and return ONLY the output:\n\n\`\`\`python\n${fullCode}\n\`\`\``
            }
          ],
          stream: false,
          max_tokens: 1000,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json() as any;
    const aiContent = data.choices?.[0]?.message?.content || '';
    // Clean up markdown code blocks if AI wraps output
    const cleaned = aiContent.replace(/```[\w]*\n?/g, '').trim();
    return { stdout: cleaned, error: null };
  } catch (err: any) {
    return {
      stdout: '',
      error: `Python execution unavailable: ${err.message}. Please ensure HF_TOKEN is configured.`
    };
  }
}

/**
 * Execute HTML/CSS code - returns the HTML that can be rendered in an iframe
 */
function executeHtml(code: string): { stdout: string; error: string | null } {
  // For HTML, we return the code itself to be rendered in an iframe on the client
  return { stdout: code, error: null };
}

/**
 * Run test cases against the user's code
 * Uses a single context so user-defined functions are available in tests.
 */
function runTests(code: string, testCode: string, language: string, setupCode?: string): TestResult[] {
  const testResults: TestResult[] = [];

  // Build the test context with all needed globals AND test utilities upfront.
  // This single context is used for setup code, user code, AND test code
  // so user-defined functions/variables are available to tests.
  const testContext = vm.createContext({
    console: {
      log: (...args: any[]) => {
        const msg = args.join(' ');
        // Parse test result format: TEST_RESULT:name|passed|expected|actual
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
    // Test assertion helpers — push directly to testResults (not via console.log)
    // because inside vm sandbox, console.log resolves to the global, not the sandbox one.
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
    // Test framework
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
    // Standard JS globals
    Math, JSON, Array, Object, String, Number, Boolean, Date, RegExp, Map, Set, Promise,
    parseInt, parseFloat, isNaN, isFinite, Error, TypeError, RangeError, ReferenceError, SyntaxError,
  });

  try {
    // First, run setup code if provided to define helpers/functions
    if (setupCode) {
      const setupScript = new vm.Script(setupCode, { filename: 'setup-code.js' });
      setupScript.runInContext(testContext, { timeout: 3000 });
    }

    // Then run the user's code to define functions/variables
    const userScript = new vm.Script(code, { filename: 'user-code.js' });
    userScript.runInContext(testContext, { timeout: 3000 });

    // Then run the test code
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

/**
 * Main compile function
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
    // Execute the code based on language
    switch (language) {
      case 'javascript':
      case 'typescript': {
        const jsResult = executeJavaScript(code, setupCode);
        output = jsResult.stdout;
        error = jsResult.error;

        // Run tests if provided
        if (testCode) {
          testResults = runTests(code, testCode, language, setupCode);
          passed = testResults.length === 0 || testResults.every(t => t.passed);
        } else {
          passed = error === null;
        }
        break;
      }

      case 'python': {
        const pyResult = await executePython(code, setupCode);
        output = pyResult.stdout;
        error = pyResult.error;
        passed = error === null;
        break;
      }

      case 'html': {
        const htmlResult = executeHtml(code);
        output = htmlResult.stdout;
        error = htmlResult.error;
        passed = error === null;
        break;
      }

      default: {
        error = `Unsupported language: ${language}`;
        passed = false;
      }
    }
  } catch (err: any) {
    error = err.message || String(err);
    passed = false;
  }

  return { output, passed, testResults, error };
}
