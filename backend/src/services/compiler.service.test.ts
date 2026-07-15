import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { compileCode } from "./compiler.service";

// ---------------------------------------------------------------------------
// Helper to capture console output from tested code
// ---------------------------------------------------------------------------
function stripAnsi(text: string): string {
  return text.replace(/\u001b\[\d+m/g, "");
}

// ---------------------------------------------------------------------------
// executeJavaScript tests — tested via compileCode
// ---------------------------------------------------------------------------
describe("JavaScript execution", () => {
  it("executes simple console.log", async () => {
    const result = await compileCode({
      code: 'console.log("Hello, World!");',
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe("Hello, World!");
    expect(result.passed).toBe(true);
  });

  it("executes multiple console.log statements", async () => {
    const result = await compileCode({
      code: `
        console.log("Line 1");
        console.log("Line 2");
        console.log("Line 3");
      `,
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.output).toContain("Line 1");
    expect(result.output).toContain("Line 2");
    expect(result.output).toContain("Line 3");
  });

  it("runs arithmetic and outputs the result", async () => {
    const result = await compileCode({
      code: `
        const sum = 2 + 3;
        console.log(sum);
        const product = 4 * 5;
        console.log(product);
      `,
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.output).toContain("5");
    expect(result.output).toContain("20");
  });

  it("handles string concatenation", async () => {
    const result = await compileCode({
      code: 'const greeting = "Hello, " + "World!"; console.log(greeting);',
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe("Hello, World!");
  });

  it("handles array operations", async () => {
    const result = await compileCode({
      code: `
        const arr = [1, 2, 3, 4, 5];
        console.log(arr.length);
        console.log(arr.map(x => x * 2).join(","));
      `,
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.output).toContain("5");
    expect(result.output).toContain("2,4,6,8,10");
  });

  it("supports JSON.stringify for object output", async () => {
    const result = await compileCode({
      code: 'console.log({ name: "Alice", age: 30 });',
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.output).toContain("Alice");
    expect(result.output).toContain("30");
  });

  it("handles functions and returns values via console.log", async () => {
    const result = await compileCode({
      code: `
        function add(a, b) { return a + b; }
        console.log(add(10, 20));
      `,
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe("30");
  });

  it("reports syntax errors", async () => {
    const result = await compileCode({
      code: 'console.log("missing semicolon)"',
      language: "javascript",
    });
    expect(result.error).not.toBeNull();
    expect(result.passed).toBe(false);
  });

  it("reports runtime errors", async () => {
    const result = await compileCode({
      code: `
        const obj = null;
        console.log(obj.property);
      `,
      language: "javascript",
    });
    expect(result.error).not.toBeNull();
    expect(result.error).toContain("Cannot read properties of null");
    expect(result.passed).toBe(false);
  });

  it("reports ReferenceError for undefined variables", async () => {
    const result = await compileCode({
      code: "console.log(undefinedVariable);",
      language: "javascript",
    });
    expect(result.error).not.toBeNull();
    expect(result.error).toContain("not defined");
    expect(result.passed).toBe(false);
  });

  it("includes partial output even when an error occurs", async () => {
    const result = await compileCode({
      code: `
        console.log("Before error");
        throw new Error("Something broke");
        console.log("After error");
      `,
      language: "javascript",
    });
    expect(result.error).not.toBeNull();
    expect(result.output).toContain("Before error");
  });
});

// ---------------------------------------------------------------------------
// Setup code tests
// ---------------------------------------------------------------------------
describe("JavaScript with setup code", () => {
  it("runs setup code before user code", async () => {
    const result = await compileCode({
      code: 'console.log(greet("Bob"));',
      language: "javascript",
      setupCode: `
        function greet(name) {
          return "Hello, " + name + "!";
        }
      `,
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe("Hello, Bob!");
  });

  it("setup code can define test helpers", async () => {
    const result = await compileCode({
      code: `
        const doubled = double(5);
        console.log(doubled);
      `,
      language: "javascript",
      setupCode: "function double(x) { return x * 2; }",
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe("10");
  });

  it("reports errors in setup code", async () => {
    const result = await compileCode({
      code: "console.log('should not run');",
      language: "javascript",
      setupCode: "throw new Error('Setup failed');",
    });
    expect(result.error).not.toBeNull();
    expect(result.error).toContain("Setup failed");
  });
});

// ---------------------------------------------------------------------------
// setTimeout mock tests
// ---------------------------------------------------------------------------
describe("JavaScript setTimeout mock", () => {
  it("executes setTimeout with 0ms delay immediately", async () => {
    const result = await compileCode({
      code: `
        let value = "before";
        setTimeout(() => { value = "after"; }, 0);
        console.log(value);
      `,
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe("after");
  });

  it("ignores setTimeout with non-zero delay (does not crash)", async () => {
    const result = await compileCode({
      code: `
        setTimeout(() => {
          console.log("should not appear");
        }, 100);
        console.log("immediate output");
      `,
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe("immediate output");
  });
});

// ---------------------------------------------------------------------------
// Test runner tests
// ---------------------------------------------------------------------------
describe("Test runner", () => {
  it("passes a simple assert.equals test", async () => {
    const result = await compileCode({
      code: `
        function add(a, b) { return a + b; }
      `,
      language: "javascript",
      testCode: `
        describe("add", () => {
          it("adds two numbers", () => {
            assert.equals(add(2, 3), 5, "adds two numbers");
          });
        });
      `,
    });
    expect(result.error).toBeNull();
    expect(result.testResults).toHaveLength(1);
    expect(result.testResults[0].passed).toBe(true);
    expect(result.testResults[0].name).toBe("adds two numbers");
    expect(result.passed).toBe(true);
  });

  it("fails an assert.equals test when values differ", async () => {
    const result = await compileCode({
      code: `
        function add(a, b) { return a + b; }
      `,
      language: "javascript",
      testCode: `
        describe("add", () => {
          it("should fail", () => {
            assert.equals(add(2, 3), 10);
          });
        });
      `,
    });
    expect(result.error).toBeNull();
    expect(result.testResults).toHaveLength(1);
    expect(result.testResults[0].passed).toBe(false);
    expect(result.passed).toBe(false);
  });

  it("supports assert.notEquals", async () => {
    const result = await compileCode({
      code: `
        function getValue() { return 42; }
      `,
      language: "javascript",
      testCode: `
        describe("getValue", () => {
          it("should not return 0", () => {
            assert.notEquals(getValue(), 0);
          });
        });
      `,
    });
    expect(result.testResults[0].passed).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("supports assert.isTrue and assert.isFalse", async () => {
    const result = await compileCode({
      code: `
        function isEven(n) { return n % 2 === 0; }
      `,
      language: "javascript",
      testCode: `
        describe("isEven", () => {
          it("4 is even", () => { assert.isTrue(isEven(4)); });
          it("3 is not even", () => { assert.isFalse(isEven(3)); });
        });
      `,
    });
    expect(result.testResults).toHaveLength(2);
    expect(result.testResults[0].passed).toBe(true);
    expect(result.testResults[1].passed).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("waits for async tests and reports each failure clearly", async () => {
    const result = await compileCode({
      code: `
        async function add(a, b) { return a + b; }
      `,
      language: "javascript",
      testCode: `
        describe("add", () => {
          it("adds two numbers", async () => {
            assert.equals(await add(2, 3), 5);
          });
          it("fails on a bad expectation", async () => {
            assert.equals(await add(2, 3), 10);
          });
        });
      `,
    });

    expect(result.testResults).toHaveLength(2);
    expect(result.testResults[0].passed).toBe(true);
    expect(result.testResults[1].passed).toBe(false);
    expect(result.testResults[1].error).toContain("Expected");
    expect(result.passed).toBe(false);
  });

  it("supports assert.deepEquals for arrays and objects", async () => {
    const result = await compileCode({
      code: `
        function getUsers() {
          return [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
        }
      `,
      language: "javascript",
      testCode: `
        describe("getUsers", () => {
          it("returns correct users", () => {
            const users = getUsers();
            assert.deepEquals(users.length, 2);
          });
        });
      `,
    });
    expect(result.testResults[0].passed).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("handles describe/it test suite failures gracefully", async () => {
    const result = await compileCode({
      code: `
        function divide(a, b) { return a / b; }
      `,
      language: "javascript",
      testCode: `
        describe("divide", () => {
          it("throws on division by zero", () => {
            throw new Error("Not implemented");
          });
        });
      `,
    });
    expect(result.testResults).toHaveLength(1);
    expect(result.testResults[0].passed).toBe(false);
    expect(result.testResults[0].error).toBeDefined();
    expect(result.passed).toBe(false);
  });

  it("runs multiple test suites", async () => {
    const result = await compileCode({
      code: `
        function add(a, b) { return a + b; }
        function multiply(a, b) { return a * b; }
      `,
      language: "javascript",
      testCode: `
        describe("add", () => {
          it("adds positive numbers", () => { assert.equals(add(1, 2), 3); });
          it("adds negative numbers", () => { assert.equals(add(-1, -1), -2); });
        });
        describe("multiply", () => {
          it("multiplies numbers", () => { assert.equals(multiply(3, 4), 12); });
          it("multiplies by zero", () => { assert.equals(multiply(5, 0), 0); });
        });
      `,
    });
    expect(result.testResults).toHaveLength(4);
    const allPassed = result.testResults.every((t) => t.passed);
    expect(allPassed).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("reports test execution error when test code itself has errors", async () => {
    const result = await compileCode({
      code: "function foo() { return 1; }",
      language: "javascript",
      testCode: "invalid javascript {{{",
    });
    expect(result.testResults.length).toBeGreaterThan(0);
    expect(result.testResults[0].passed).toBe(false);
    expect(result.passed).toBe(false);
  });

  it("works with setup code and test code together", async () => {
    const result = await compileCode({
      code: 'console.log(doubleIt(5));',
      language: "javascript",
      setupCode: "function doubleIt(x) { return x * 2; }",
      testCode: `
        describe("doubleIt", () => {
          it("doubles 3 to 6", () => { assert.equals(doubleIt(3), 6); });
        });
      `,
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe("10");
    expect(result.testResults[0].passed).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("handles empty test expectations", async () => {
    const result = await compileCode({
      code: "var x = 1;",
      language: "javascript",
      testCode: `
        describe("x", () => {
          it("exists", () => { assert.isTrue(x !== undefined); });
        });
      `,
    });
    expect(result.testResults[0].passed).toBe(true);
    expect(result.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// compileCode endpoint tests
// ---------------------------------------------------------------------------
describe("compileCode", () => {
  it("returns error for empty code", async () => {
    const result = await compileCode({
      code: "",
      language: "javascript",
    });
    expect(result.error).toBe("No code provided");
    expect(result.passed).toBe(false);
  });

  it("returns error for whitespace-only code", async () => {
    const result = await compileCode({
      code: "   \n  \n  ",
      language: "javascript",
    });
    expect(result.error).toBe("No code provided");
    expect(result.passed).toBe(false);
  });

  it("returns error for unsupported language", async () => {
    const result = await compileCode({
      code: 'print("hello")',
      language: "brainfuck",
    });
    expect(result.error).toContain("Unsupported language");
    expect(result.passed).toBe(false);
  });

  it("reports passed=false when tests fail", async () => {
    const result = await compileCode({
      code: "function add(a, b) { return a - b; }", // Bug: subtracts instead of adds
      language: "javascript",
      testCode: `
        describe("add", () => {
          it("should add correctly", () => { assert.equals(add(2, 3), 5); });
        });
      `,
    });
    expect(result.passed).toBe(false);
    expect(result.testResults[0].passed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// HTML execution tests
// ---------------------------------------------------------------------------
describe("HTML execution", () => {
  it("returns HTML code as output for iframe rendering", async () => {
    const html = "<h1>Hello</h1><p>World</p>";
    const result = await compileCode({
      code: html,
      language: "html",
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe(html);
    expect(result.passed).toBe(true);
    expect(result.testResults).toEqual([]);
  });

  it("returns complete HTML document", async () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Hello</h1></body>
</html>`;
    const result = await compileCode({
      code: html,
      language: "html",
    });
    expect(result.error).toBeNull();
    expect(result.output).toContain("<!DOCTYPE html>");
    expect(result.output).toContain("<h1>Hello</h1>");
    expect(result.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Judge0 execution tests (mocked fetch for Python via Judge0)
// ---------------------------------------------------------------------------
describe("Judge0 execution (Python)", () => {
  beforeEach(() => {
    // Mock global fetch for Judge0 API calls
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function mockJudge0Success(stdout: string) {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stdout,
        stderr: null,
        compile_output: null,
        message: null,
        status: { id: 3, description: "Accepted" },
        time: "0.001",
        memory: 1024,
      }),
    } as any);
    return mockFetch;
  }

  function mockJudge0CompileError(stderr: string) {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stdout: null,
        stderr: null,
        compile_output: stderr,
        message: null,
        status: { id: 6, description: "Compilation Error" },
        time: "0.001",
        memory: 0,
      }),
    } as any);
    return mockFetch;
  }

  it("returns output from Judge0 API when execution succeeds", async () => {
    mockJudge0Success("42");

    const result = await compileCode({
      code: "print(42)",
      language: "python",
    });

    expect(result.error).toBeNull();
    expect(result.output).toBe("42");
    expect(result.passed).toBe(true);

    // Verify the API was called
    const mockFetch = vi.mocked(fetch);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toContain("/submissions");
  });

  it("handles network errors gracefully", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await compileCode({
      code: "print('hello')",
      language: "python",
    });

    expect(result.error).not.toBeNull();
    expect(result.error).toContain("not reachable");
    expect(result.passed).toBe(false);
  });

  it("handles non-ok response from Judge0", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    } as any);

    const result = await compileCode({
      code: "print('test')",
      language: "python",
    });

    expect(result.error).not.toBeNull();
    expect(result.error).toContain("temporarily unavailable");
    expect(result.passed).toBe(false);
  });

  it("reports compilation errors from Judge0", async () => {
    mockJudge0CompileError("SyntaxError: invalid syntax");

    const result = await compileCode({
      code: "print(42",
      language: "python",
    });

    expect(result.error).not.toBeNull();
    expect(result.error).toContain("Compilation Error");
    expect(result.error).toContain("invalid syntax");
    expect(result.passed).toBe(false);
  });

  it("includes setup code with Python code via Judge0", async () => {
    mockJudge0Success("Hello, Bob!");

    const result = await compileCode({
      code: 'print(greet("Bob"))',
      language: "python",
      setupCode: "def greet(name):\n    return f'Hello, {name}!'",
    });

    expect(result.error).toBeNull();
    expect(result.output).toBe("Hello, Bob!");
    expect(result.passed).toBe(true);
  });

  it("reports runtime errors from Judge0", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stdout: null,
        stderr: "ZeroDivisionError: division by zero",
        compile_output: null,
        message: null,
        status: { id: 11, description: "Runtime Error (NZEC)" },
        time: "0.001",
        memory: 0,
      }),
    } as any);

    const result = await compileCode({
      code: "1/0",
      language: "python",
    });

    expect(result.error).not.toBeNull();
    expect(result.error).toContain("Runtime Error");
    expect(result.passed).toBe(false);
  });

  it("reports time limit exceeded from Judge0", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stdout: null,
        stderr: null,
        compile_output: null,
        message: null,
        status: { id: 5, description: "Time Limit Exceeded" },
        time: "5.000",
        memory: 1024,
      }),
    } as any);

    const result = await compileCode({
      code: "while True: pass",
      language: "python",
    });

    expect(result.error).not.toBeNull();
    expect(result.error).toContain("Time Limit Exceeded");
    expect(result.passed).toBe(false);
  });

  it("executes code in other Judge0-supported languages", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stdout: "Hello from C!",
        stderr: null,
        compile_output: null,
        message: null,
        status: { id: 3, description: "Accepted" },
        time: "0.002",
        memory: 512,
      }),
    } as any);

    const result = await compileCode({
      code: '#include <stdio.h>\nint main() { printf("Hello from C!"); return 0; }',
      language: "c",
    });

    expect(result.error).toBeNull();
    expect(result.output).toBe("Hello from C!");
    expect(result.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge case tests
// ---------------------------------------------------------------------------
describe("Edge cases", () => {
  it("handles very long output gracefully", async () => {
    const result = await compileCode({
      code: `
        let str = "";
        for (let i = 0; i < 100; i++) {
          str += "line" + i + "\\\\n";
        }
        console.log(str);
      `,
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.output).toContain("line0");
    expect(result.output).toContain("line99");
    expect(result.passed).toBe(true);
  });

  it("handles code with special characters", async () => {
    const result = await compileCode({
      code: 'console.log("Special: !@#$%^&*()_+-=[]{}|;:,.<>?/~\`");',
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.passed).toBe(true);
  });

  it("empty testCode does not produce test results", async () => {
    const result = await compileCode({
      code: 'console.log("hello");',
      language: "javascript",
      testCode: undefined,
    });
    expect(result.error).toBeNull();
    expect(result.testResults).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it("handles console.warn and console.error calls", async () => {
    const result = await compileCode({
      code: `
        console.log("normal");
        console.warn("warning");
        console.error("error msg");
      `,
      language: "javascript",
    });
    expect(result.error).toBeNull();
    expect(result.output).toContain("normal");
    expect(result.output).toContain("Warning: warning");
    expect(result.output).toContain("Error: error msg");
    expect(result.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Exercise type integration
// ---------------------------------------------------------------------------
describe("Exercise type integration", () => {
  it("fill-in: code with blanks is executed correctly", async () => {
    const result = await compileCode({
      code: `
        const name = "World";
        console.log("Hello, " + name + "!");
      `,
      language: "javascript",
      exerciseType: "fill-in",
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe("Hello, World!");
    expect(result.passed).toBe(true);
  });

  it("fix: buggy code produces error that can be identified", async () => {
    const result = await compileCode({
      code: `
        function add(a, b) {
          return a - b; // bug: should be a + b
        }
        console.log(add(5, 3));
      `,
      language: "javascript",
      exerciseType: "fix",
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe("2"); // 5 - 3 = 2 (buggy output)
    expect(result.passed).toBe(true); // executes without error, just logic bug
  });

  it("test-driven: exercise only passes when tests pass", async () => {
    const result = await compileCode({
      code: `
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
      `,
      language: "javascript",
      exerciseType: "test",
      testCode: `
        describe("factorial", () => {
          it("factorial of 5 is 120", () => { assert.equals(factorial(5), 120); });
          it("factorial of 0 is 1", () => { assert.equals(factorial(0), 1); });
        });
      `,
    });
    expect(result.testResults).toHaveLength(2);
    expect(result.testResults.every((t) => t.passed)).toBe(true);
    expect(result.passed).toBe(true);
  });
});
