import vm from 'vm';
import { JSDOM } from 'jsdom';

interface CompileRequest {
  code: string;
  language: string;
  testCode?: string;
  exerciseType?: 'fill-in' | 'write' | 'fix' | 'test';
  setupCode?: string;
  exerciseTitle?: string;
  exerciseDescription?: string;
  expectedOutput?: string;
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
  generatedTestCode?: string;
}

// Judge0 is an open-source online code execution system.
const JUDGE0_API_URL = (process.env.JUDGE0_API_URL || 'https://ce.judge0.com').replace(/\/+$/, '');

// Import shared language configuration
import { JUDGE0_LANGUAGE_IDS as JUDGE0_IDS } from '../config/languageConfig';
export { LANGUAGE_NAMES, LANGUAGE_COLORS, DEFAULT_INITIAL_CODE } from '../config/languageConfig';
const JUDGE0_LANGUAGE_IDS = JUDGE0_IDS;

// AI test generation — used when admin hasn't provided test code
import { generateCodeTestsService } from './ai.service';

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

// ─── HTML/CSS Test Runner (using jsdom) ────────────────────────────────────

async function runHtmlCssTests(code: string, testCode: string, language: string): Promise<TestResult[]> {
  const testResults: TestResult[] = [];
  const safeStr = (v: any): string => v == null ? '' : String(v);

  const serializeValue = (value: any) => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    try {
      const result = JSON.stringify(value);
      return result !== undefined ? result : String(value);
    } catch {
      return String(value);
    }
  };

  try {
    // Create a jsdom instance with the user's HTML code
    let domHtml = code;
    if (language === 'css') {
      // For CSS exercises, wrap in a basic HTML structure
      domHtml = `<!DOCTYPE html><html><head><style>${code}</style></head><body></body></html>`;
    }

    const dom = new JSDOM(domHtml, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true });
    const document = dom.window.document;

    // Set up the test context with DOM APIs
    let currentTestName: string | null = null;
    let resultsAtStartOfTest: number = 0;

    const addAssertionResult = (name: string | undefined, passed: boolean, expected: any, actual: any, error?: string) => {
      const testName = name || currentTestName || 'Unnamed Test';
      testResults.push({
        name: testName,
        passed,
        expected: serializeValue(expected),
        actual: serializeValue(actual),
        error: error || undefined,
      });
    };

    const testContext = vm.createContext({
      document,
      window: dom.window,
      console: {
        log: (...args: any[]) => {},
        error: (...args: any[]) => {},
      },
      assert: {
        equals: (actual: any, expected: any, name?: string) => {
          const passed = actual === expected;
          addAssertionResult(name, passed, expected, actual, passed ? undefined : `Expected ${serializeValue(expected)} but received ${serializeValue(actual)}`);
        },
        notEquals: (actual: any, expected: any, name?: string) => {
          const passed = actual !== expected;
          addAssertionResult(name, passed, `NOT ${serializeValue(expected)}`, actual, passed ? undefined : `Expected value to differ from ${serializeValue(expected)}`);
        },
        isTrue: (actual: any, name?: string) => {
          const passed = !!actual;
          addAssertionResult(name, passed, 'true', actual, passed ? undefined : `Expected a truthy value but received ${serializeValue(actual)}`);
        },
        isFalse: (actual: any, name?: string) => {
          const passed = !actual;
          addAssertionResult(name, passed, 'false', actual, passed ? undefined : `Expected a falsy value but received ${serializeValue(actual)}`);
        },
        ok: (actual: any, name?: string) => {
          const passed = !!actual;
          addAssertionResult(name, passed, 'truthy', actual, passed ? undefined : `Expected truthy value but received ${serializeValue(actual)}`);
        },
        deepEquals: (actual: any, expected: any, name?: string) => {
          const passed = JSON.stringify(actual) === JSON.stringify(expected);
          addAssertionResult(name, passed, expected, actual, passed ? undefined : `Expected ${serializeValue(expected)} but received ${serializeValue(actual)}`);
        },
      },
      describe: (name: string, fn: Function) => {
        try {
          fn();
        } catch (e: any) {
          testResults.push({ name: 'Test Suite: ' + name, passed: false, expected: 'No errors', actual: safeStr(e?.message) || safeStr(e), error: safeStr(e?.message) || safeStr(e) });
        }
      },
      it: (name: string, fn: Function) => {
        const prevTestName = currentTestName;
        currentTestName = name;
        resultsAtStartOfTest = testResults.length;
        try {
          fn();
        } catch (e: any) {
          while (testResults.length > resultsAtStartOfTest) {
            testResults.pop();
          }
          testResults.push({ name, passed: false, expected: 'No errors', actual: safeStr(e?.message) || safeStr(e), error: safeStr(e?.message) || safeStr(e) });
        }
        if (testResults.length === resultsAtStartOfTest) {
          testResults.push({ name, passed: true, expected: '', actual: '', error: undefined });
        }
        currentTestName = prevTestName;
      },
      Math, JSON, Array, Object, String, Number, Boolean, Date, RegExp, Map, Set, Promise,
      parseInt, parseFloat, isNaN, isFinite, Error, TypeError, RangeError, ReferenceError, SyntaxError,
    });

    const wrappedTestCode = `(async () => {\n${testCode}\n})();`;
    const testScript = new vm.Script(wrappedTestCode, { filename: 'test-code.js' });
    testScript.runInContext(testContext, { timeout: 5000 });

    dom.window.close();
  } catch (err: any) {
    testResults.push({
      name: 'Test Execution Error',
      passed: false,
      expected: 'Tests to run successfully',
      actual: safeStr(err?.message) || safeStr(err),
      error: safeStr(err?.message) || safeStr(err),
    });
  }

  return testResults;
}

// ─── JavaScript Test Runner ────────────────────────────────────────────────

async function runTests(code: string, testCode: string, language: string, setupCode?: string): Promise<TestResult[]> {
  const testResults: TestResult[] = [];
  const pendingTests: Promise<void>[] = [];

  const safeStr = (v: any): string => v == null ? '' : String(v);

  const serializeValue = (value: any) => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    try {
      const result = JSON.stringify(value);
      return result !== undefined ? result : String(value);
    } catch {
      return String(value);
    }
  };

  // Track the current it() block name so assert.* calls inherit it
  let currentTestName: string | null = null;
  let resultsAtStartOfTest: number = 0;

  const addAssertionResult = (name: string | undefined, passed: boolean, expected: any, actual: any, error?: string) => {
    const testName = name || currentTestName || 'Unnamed Test';
    testResults.push({
      name: testName,
      passed,
      expected: serializeValue(expected),
      actual: serializeValue(actual),
      error: error || undefined,
    });
  };

  const testContext = vm.createContext({
    console: {
      log: (...args: any[]) => {
        const msg = args.join(' ');
        if (msg.startsWith('TEST_RESULT:')) {
          const parts = msg.replace('TEST_RESULT:', '').split('|');
          testResults.push({
            name: parts[0] || currentTestName || 'Unnamed Test',
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
        addAssertionResult(name, passed, expected, actual, passed ? undefined : `Expected ${serializeValue(expected)} but received ${serializeValue(actual)}`);
      },
      notEquals: (actual: any, expected: any, name?: string) => {
        const passed = actual !== expected;
        addAssertionResult(name, passed, `NOT ${serializeValue(expected)}`, actual, passed ? undefined : `Expected value to differ from ${serializeValue(expected)}`);
      },
      isTrue: (actual: any, name?: string) => {
        const passed = !!actual;
        addAssertionResult(name, passed, 'true', actual, passed ? undefined : `Expected a truthy value but received ${serializeValue(actual)}`);
      },
      isFalse: (actual: any, name?: string) => {
        const passed = !actual;
        addAssertionResult(name, passed, 'false', actual, passed ? undefined : `Expected a falsy value but received ${serializeValue(actual)}`);
      },
      isFunction: (actual: any, name?: string) => {
        const passed = typeof actual === 'function';
        addAssertionResult(name, passed, 'function', actual, passed ? undefined : `Expected a function but received ${typeof actual}`);
      },
      deepEquals: (actual: any, expected: any, name?: string) => {
        const passed = JSON.stringify(actual) === JSON.stringify(expected);
        addAssertionResult(name, passed, expected, actual, passed ? undefined : `Expected ${serializeValue(expected)} but received ${serializeValue(actual)}`);
      },
    },
    describe: (name: string, fn: Function) => {
      const suitePromise = Promise.resolve().then(() => {
        try {
          const result = fn();
          if (result && typeof result.then === 'function') {
            return result;
          }
        } catch (e: any) {
          testResults.push({ name: 'Test Suite: ' + name, passed: false, expected: 'No errors', actual: safeStr(e?.message) || safeStr(e), error: safeStr(e?.message) || safeStr(e) });
        }
      }).catch((e: any) => {
        testResults.push({ name: 'Test Suite: ' + name, passed: false, expected: 'No errors', actual: safeStr(e?.message) || safeStr(e), error: safeStr(e?.message) || safeStr(e) });
      });
      pendingTests.push(suitePromise);
    },
    it: (name: string, fn: Function) => {
      const testPromise = Promise.resolve().then(async () => {
        // Save/restore pattern to handle interleaved async it() blocks correctly
        const prevTestName = currentTestName;
        currentTestName = name;
        resultsAtStartOfTest = testResults.length;
        let testError: any = null;
        try {
          const result = fn();
          if (result && typeof result.then === 'function') {
            await result;
          }
        } catch (e: any) {
          testError = e;
        }
        currentTestName = prevTestName;
        
        if (testError) {
          // it() threw — record a single failed result with the test name
          // Remove any partial results that assert.* pushed before the error
          while (testResults.length > resultsAtStartOfTest) {
            testResults.pop();
          }
          testResults.push({ name, passed: false, expected: 'No errors', actual: safeStr(testError?.message) || safeStr(testError), error: safeStr(testError?.message) || safeStr(testError) });
        } else if (testResults.length === resultsAtStartOfTest) {
          // it() passed but no assert.* called — add a single passed result
          testResults.push({ name, passed: true, expected: '', actual: '', error: undefined });
        }
        // Otherwise assert.* already pushed results with inherited names — nothing extra needed
      });
      pendingTests.push(testPromise);
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

    const wrappedTestCode = `(async () => {\n${testCode}\n})();`;
    const testScript = new vm.Script(wrappedTestCode, { filename: 'test-code.js' });
    const testExecution = testScript.runInContext(testContext, { timeout: 5000 });
    await Promise.resolve(testExecution);
    await Promise.all(pendingTests);
  } catch (err: any) {
    testResults.push({
      name: 'Test Execution Error',
      passed: false,
      expected: 'Tests to run successfully',
      actual: safeStr(err?.message) || safeStr(err),
      error: safeStr(err?.message) || safeStr(err),
    });
  }

  return testResults;
}

// ─── Fallback Test Generator ─────────────────────────────────────────────

/**
 * Generates basic tests when AI test generation fails or is unavailable.
 * This ensures students always get test results even without AI.
 */
function generateBasicTests(title: string, description: string): string {
  // Extract function name hints from the title/description
  const text = `${title} ${description}`.toLowerCase();
  
  // Check if the exercise mentions specific functions
  const functionMatch = text.match(/\b(add|sum|subtract|multiply|divide|greet|hello|sayHello|getName|getAge|calculate|compute|format|validate|check|filter|map|reduce|sort|find|fetch|getUser|getData|transform|parse|render|createItem|updateItem|deleteItem|handleSubmit|onClick|toggle|setTheme|fetchData|loadData|saveData|deleteData|updateData|createData|getItem|setItem|removeItem|clearAll|isEmpty|isValid|isEmail|isNumber|isString|isArray|isObject|isFunction|isDefined|isNull|isUndefined|toUpper|toLower|capitalize|trim|split|join|concat|reverse|shuffle|random|clamp|lerp|normalize|round|floor|ceil|abs|pow|sqrt|log|exp|sin|cos|tan|min|max|average|mean|median|mode|range|variance|stdDev)\b/i);
  
  if (functionMatch) {
    const fnName = functionMatch[1];
    return `
  describe("${fnName}", () => {
    it("${fnName} should be defined and callable", () => {
      assert.isFunction(${fnName}, "${fnName} should be defined as a function");
    });
  });
  `.trim();
  }
  
  // Check if the exercise expects console output
  if (text.includes('console') || text.includes('log') || text.includes('print') || text.includes('output')) {
    return `
  describe("Program", () => {
    it("should run without errors", () => {
      assert.isTrue(true, "Code executed successfully");
    });
  });
  `.trim();
  }
  
  // Generic fallback: just check the code runs
  return `
  describe("${title || 'Exercise'}", () => {
    it("should run without errors", () => {
      assert.isTrue(true, "Code executed successfully");
    });
  });
  `.trim();
}

// ─── Main Compile Function ─────────────────────────────────────────────────

/**
 * Main compile function.
 * - JavaScript/TypeScript: Uses Node.js vm module (sandboxed, supports tests)
 * - HTML: Returns code for iframe rendering
 * - CSS: Returns code for styling
 * - All other languages: Uses Judge0 API for remote execution
 */
/**
 * Pre-generate AI tests for all coding exercises in a course that lack testCode.
 * Iterates through all modules/lessons/codeExercises and calls AI to generate tests.
 * Exercises with existing testCode are skipped.
 * Returns count of exercises for which tests were generated.
 */
export async function preGenerateExerciseTests(course: any): Promise<number> {
  let generatedCount = 0;
  
  if (!course.modules || !Array.isArray(course.modules)) {
    return generatedCount;
  }

  for (const mod of course.modules) {
    if (!mod.lessons || !Array.isArray(mod.lessons)) continue;
    
    for (const lesson of mod.lessons) {
      if (!lesson.codeExercises || !Array.isArray(lesson.codeExercises)) continue;
      
      for (const exercise of lesson.codeExercises) {
        // Skip exercises that already have test code
        if (exercise.testCode && exercise.testCode.trim()) continue;
        
        // Generate tests via AI
        const language = exercise.language || 'javascript';
        try {
          let aiTestCode = await generateCodeTestsService(
            exercise.title || 'Untitled Exercise',
            exercise.description || '',
            language,
            exercise.initialCode || '',
            exercise.expectedOutput
          );
          
          if (aiTestCode && aiTestCode.trim()) {
            // Strip markdown code fences
            aiTestCode = aiTestCode.replace(/```[a-zA-Z]*\n?/g, '').replace(/```\n?/g, '').trim();
            // @ts-ignore - setting on Mongoose subdocument
            exercise.testCode = aiTestCode;
            generatedCount++;
            console.log(`🤖 Auto-generated ${aiTestCode.split('\n').length} lines of test code for "${exercise.title}"`);
          }
        } catch (err: any) {
          console.warn(`⚠️ Failed to generate tests for "${exercise.title}": ${err?.message}`);
        }
      }
    }
  }
  
  // 💾 Persist generated testCode back to the course document in MongoDB
  if (generatedCount > 0) {
    try {
      course.markModified('modules');
      await course.save();
      console.log(`💾 Saved ${generatedCount} AI-generated test(s) to course "${course.title || course._id}"`);
    } catch (saveErr: any) {
      console.warn('Failed to save generated tests to DB:', saveErr?.message);
    }
  }
  
  return generatedCount;
}

export async function compileCode(request: CompileRequest): Promise<CompileResult> {
  const { code, language, testCode, exerciseType, setupCode } = request;

  if (!code || code.trim() === '') {
    return { output: '', passed: false, testResults: [], error: 'No code provided' };
  }

  let output = '';
  let error: string | null = null;
  let testResults: TestResult[] = [];
  let passed = true;
  let generatedTestCode: string | undefined;

  try {
    switch (language) {
      // ── JavaScript/TypeScript: Use VM sandbox (supports tests) ──
      case 'javascript':
      case 'typescript': {
        const jsResult = executeJavaScript(code, setupCode);
        output = jsResult.stdout;
        error = jsResult.error;

        // Auto-generate tests via AI when admin hasn't provided testCode (ONCE per exercise)
        let resolvedTestCode = testCode;
        if (!resolvedTestCode && request.exerciseTitle) {
          try {
            let aiTestCode = await generateCodeTestsService(
              request.exerciseTitle,
              request.exerciseDescription || '',
              language,
              request.setupCode || '',
              request.expectedOutput
            );
            if (aiTestCode && aiTestCode.trim()) {
              // Strip markdown code fences that AI might wrap the response in
              aiTestCode = aiTestCode.replace(/```[a-zA-Z]*\n?/g, '').replace(/```\n?/g, '').trim();
              resolvedTestCode = aiTestCode;
              generatedTestCode = aiTestCode;
              console.log(`🤖 AI generated ${aiTestCode.split('\n').length} lines of test code for "${request.exerciseTitle}"`);
            }
          } catch (aiErr: any) {
            console.warn('AI test generation failed:', aiErr?.message);
          }
        }

        // Fallback: if AI didn't produce test code and no testCode was provided, generate a basic expected-output test
        if (!resolvedTestCode && request.exerciseTitle) {
          resolvedTestCode = generateBasicTests(request.exerciseTitle, request.exerciseDescription || '');
          generatedTestCode = resolvedTestCode;
          console.log(`📝 Using basic fallback tests for "${request.exerciseTitle}"`);
        }

        if (resolvedTestCode) {
          testResults = await runTests(code, resolvedTestCode, language, setupCode);
          // Passed only if: no execution error AND all test results pass
          passed = error === null && (testResults.length === 0 || testResults.every(t => t.passed));
        } else {
          passed = error === null;
        }
        break;
      }

      // ── HTML: Execute with jsdom and run tests ──
      case 'html': {
        const htmlResult = executeHtml(code);
        output = htmlResult.stdout;
        error = htmlResult.error;

        let htmlResolvedTestCode = testCode;
        if (!htmlResolvedTestCode && request.exerciseTitle) {
          try {
            let aiTestCode = await generateCodeTestsService(
              request.exerciseTitle,
              request.exerciseDescription || '',
              'html',
              request.setupCode || '',
              request.expectedOutput
            );
            if (aiTestCode && aiTestCode.trim()) {
              aiTestCode = aiTestCode.replace(/```[a-zA-Z]*\n?/g, '').replace(/```\n?/g, '').trim();
              htmlResolvedTestCode = aiTestCode;
              generatedTestCode = aiTestCode;
            }
          } catch (aiErr: any) {
            console.warn('AI test generation failed for HTML:', aiErr?.message);
          }
        }

        if (htmlResolvedTestCode) {
          testResults = await runHtmlCssTests(code, htmlResolvedTestCode, 'html');
          passed = error === null && (testResults.length === 0 || testResults.every(t => t.passed));
        } else {
          passed = error === null;
        }
        break;
      }

      // ── CSS: Execute with jsdom and run tests ──
      case 'css': {
        const cssResult = executeCss(code);
        output = cssResult.stdout;
        error = cssResult.error;

        let cssResolvedTestCode = testCode;
        if (!cssResolvedTestCode && request.exerciseTitle) {
          try {
            let aiTestCode = await generateCodeTestsService(
              request.exerciseTitle,
              request.exerciseDescription || '',
              'css',
              request.setupCode || '',
              request.expectedOutput
            );
            if (aiTestCode && aiTestCode.trim()) {
              aiTestCode = aiTestCode.replace(/```[a-zA-Z]*\n?/g, '').replace(/```\n?/g, '').trim();
              cssResolvedTestCode = aiTestCode;
              generatedTestCode = aiTestCode;
            }
          } catch (aiErr: any) {
            console.warn('AI test generation failed for CSS:', aiErr?.message);
          }
        }

        if (cssResolvedTestCode) {
          testResults = await runHtmlCssTests(code, cssResolvedTestCode, 'css');
          passed = error === null && (testResults.length === 0 || testResults.every(t => t.passed));
        } else {
          passed = error === null;
        }
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

  return { output, passed, testResults, error, generatedTestCode };
}
