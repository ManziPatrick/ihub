import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

/**
 * Seeds advanced JavaScript course modules.
 * - Each module contains practical exercises (codeExercises)
 * - Mixes different exercise types (write, fill-in, fix, test, assignment)
 * - Includes "expectedOutput" and "solutionCode" so the UI can show answers/output
 */
const seedAdvancedJsModules = async () => {
  await connectDB();

  // instructor
  let instructor = await User.findOne({ role: { $in: ['admin', 'trainer', 'super_admin'] } });
  if (!instructor) {
    instructor = await new User({
      fullName: 'JS Mentor Bootskills',
      username: 'js.mentor',
      email: 'js.mentor@bootskills.com',
      password: 'Password@123',
      role: 'trainer',
      status: 'active',
      academicStatus: 'active'
    }).save();
  }

  const instructorId = instructor._id;

  const advancedCourseTitle = 'Advanced JavaScript — Practical Exercises & Tests';

  const coursePayload: any = {
    title: advancedCourseTitle,
    description: `<p>This advanced JavaScript course is built around <strong>practical exercises</strong>.</p>
<p>Each module includes exercises you can run, plus tests and expected outputs so learners can immediately see the correct answer and what the code should produce.</p>`,
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800',
    instructor: instructorId,
    price: 1000,
    discountPrice: 0,
    level: 'Advanced',
    category: 'Programming',
    status: 'published',
    submissionRequired: true,
    school: instructor.school || 'Bootskills Academy',
    modules: [
      {
        title: 'Module 1: Closures, Scope & Pure Functions',
        description: 'Use closures for state, avoid side effects, and build predictable functions.',
        order: 1,
        lessons: [
          {
            title: 'Closures — make a stateful counter',
            type: 'article',
            content: `<h2>Closures</h2>
<p>A closure is a function that remembers variables from its outer scope.</p>
<p>You will build a counter using closures.</p>`,
            duration: 25,
            resources: [],
            codeExercises: [
              {
                id: 'advjs-m1-ex1',
                title: 'Write: closure counter',
                description: 'Create a function <code>makeCounter</code> that returns a function. Each call should return the next integer starting from 1.',
                language: 'javascript',
                type: 'write',
                initialCode: 'function makeCounter() {\n  // TODO: implement with a closure\n}\n\nconst counter = makeCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n',
                solutionCode: 'function makeCounter() {\n  let count = 1;\n  return function() {\n    const current = count;\n    count += 1;\n    return current;\n  };\n}\n\nconst counter = makeCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n',
                expectedOutput: '1\n2',
                testCode: ''
              },
              {
                id: 'advjs-m1-ex2',
                title: 'Fill-in: pure function mapper',
                description: 'Complete <code>mapSquare</code> to return a new array of squared numbers (no mutation).',
                language: 'javascript',
                type: 'fill-in',
                initialCode: 'function mapSquare(arr) {\n  // Return a new array where each item is squared\n  return arr.________(x => x * x);\n}\n\nconst out = mapSquare([1,2,3]);\nconsole.log(out);\n',
                solutionCode: 'function mapSquare(arr) {\n  return arr.map(x => x * x);\n}\n\nconst out = mapSquare([1,2,3]);\nconsole.log(out);\n',
                expectedOutput: '1,4,9',
                testCode: ''
              },
              {
                id: 'advjs-m1-ex3',
                title: 'Test: deepEqual basics',
                description: 'Implement <code>shallowEqual</code> for objects (compare keys + values).',
                language: 'javascript',
                type: 'test',
                initialCode: 'function shallowEqual(a, b) {\n  // TODO: compare shallow object equality\n}\n\n// Tests will call shallowEqual\n',
                solutionCode: 'function shallowEqual(a, b) {\n  if (a === b) return true;\n  if (!a || !b) return false;\n  if (typeof a !== "object" || typeof b !== "object") return false;\n  const aKeys = Object.keys(a);\n  const bKeys = Object.keys(b);\n  if (aKeys.length !== bKeys.length) return false;\n  for (const k of aKeys) {\n    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;\n    if (a[k] !== b[k]) return false;\n  }\n  return true;\n}\n',
                expectedOutput: 'true / false',
                testCode: `\ndescribe('shallowEqual', function() {\n  it('returns true for equal objects', function() {\n    assert.equals(shallowEqual({a:1,b:2},{a:1,b:2}), true);\n  });\n  it('returns false for different values', function() {\n    assert.equals(shallowEqual({a:1,b:2},{a:1,b:3}), false);\n  });\n  it('returns false for different keys', function() {\n    assert.equals(shallowEqual({a:1},{a:1,b:2}), false);\n  });\n});\n`
              }
            ]
          },
          {
            title: 'Module 1 Quiz — Scope & Pure Functions',
            type: 'quiz',
            content: '<p>Check your understanding of closures and pure functions.</p>',
            duration: 15,
            quizQuestions: [
              {
                questionText: 'A closure is best described as:',
                type: 'multiple_choice',
                options: [
                  'A function that has no access to outer variables',
                  'A function that remembers variables from its outer scope',
                  'A function that always returns promises',
                  'A function declared inside a class'
                ],
                correctOptionIndex: 1,
                explanation: 'Closures retain references to outer-scope variables.'
              },
              {
                questionText: 'A pure function must:',
                type: 'multiple_choice',
                options: [
                  'Mutate its inputs',
                  'Always return the same output for the same input and have no side effects',
                  'Use global variables',
                  'Never use return'
                ],
                correctOptionIndex: 1,
                explanation: 'Pure functions are deterministic and side-effect free.'
              },
              {
                questionText: 'Which array method is non-mutating?',
                type: 'multiple_choice',
                options: ['push()', 'pop()', 'map()', 'sort()'],
                correctOptionIndex: 2,
                explanation: 'map() returns a new array; push/pop mutate.'
              }
            ],
            quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 3 }
          }
        ]
      },
      {
        title: 'Module 2: Async JavaScript — Promises & Async/Await',
        description: 'Build robust async workflows with retries and correct error handling.',
        order: 2,
        lessons: [
          {
            title: 'Retry a failing operation',
            type: 'article',
            content: `<h2>Async control flow</h2>
<p>You will implement a retry mechanism for an async function.</p>`,
            duration: 30,
            resources: [],
            codeExercises: [
              {
                id: 'advjs-m2-ex1',
                title: 'Write: retryAsync',
                description: 'Implement <code>retryAsync(fn, retries)</code> that calls <code>fn</code> (async) and retries on failure up to <code>retries</code> times.',
                language: 'javascript',
                type: 'write',
                initialCode: 'async function retryAsync(fn, retries) {\n  // TODO\n}\n\n// Example usage\n// retryAsync(() => Promise.reject(new Error("fail")), 2)\n',
                solutionCode: 'async function retryAsync(fn, retries) {\n  let lastErr;\n  for (let attempt = 0; attempt <= retries; attempt++) {\n    try {\n      return await fn();\n    } catch (err) {\n      lastErr = err;\n    }\n  }\n  throw lastErr;\n}\n',
                expectedOutput: 'Promise rejection after retries',
                testCode: `\ndescribe('retryAsync', function() {\n  it('returns success before exhausting retries', async function() {\n    let calls = 0;\n    const fn = async () => {\n      calls += 1;\n      if (calls < 3) throw new Error('nope');\n      return 'ok';\n    };\n    const result = await retryAsync(fn, 5);\n    assert.equals(result, 'ok');\n  });\n\n  it('throws after retries exhausted', async function() {\n    let calls = 0;\n    const fn = async () => {\n      calls += 1;\n      throw new Error('fail');\n    };\n    try {\n      await retryAsync(fn, 2);\n      assert.fail('should throw');\n    } catch (e) {\n      assert.equals(calls, 3);\n    }\n  });\n});\n`
              },
              {
                id: 'advjs-m2-ex2',
                title: 'Fix: broken await',
                description: 'Fix this code so it properly waits for the promise before returning.',
                language: 'javascript',
                type: 'fix',
                initialCode: 'async function getValue() {\n  const p = Promise.resolve(42);\n  return p;\n}\n\n(async () => {\n  const result = await getValue();\n  console.log(result);\n})();\n',
                solutionCode: 'async function getValue() {\n  const p = Promise.resolve(42);\n  return await p;\n}\n\n(async () => {\n  const result = await getValue();\n  console.log(result);\n})();\n',
                expectedOutput: '42',
                testCode: ''
              }
            ]
          },
          {
            title: 'Module 2 Quiz — Promises & async/await',
            type: 'quiz',
            content: '<p>How well do you understand async behaviors?</p>',
            duration: 15,
            quizQuestions: [
              {
                questionText: 'In async functions, await can be used to:',
                type: 'multiple_choice',
                options: ['Wait for a promise to resolve/reject', 'Declare a variable', 'Start a loop', 'Catch errors automatically'],
                correctOptionIndex: 0,
                explanation: 'await pauses execution until the promise settles.'
              },
              {
                questionText: 'A rejected promise is:',
                type: 'multiple_choice',
                options: ['A successful result', 'An error state', 'A pending state', 'Always converted to resolve'],
                correctOptionIndex: 1,
                explanation: 'rejected indicates failure (error).' 
              }
            ],
            quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 2 }
          }
        ]
      },
      {
        title: 'Module 3: JavaScript Data Structures — Map/Set & Immutability',
        description: 'Use Map/Set and implement algorithms with clean complexity.',
        order: 3,
        lessons: [
          {
            title: 'Count occurrences using Map',
            type: 'article',
            content: '<p>Use <code>Map</code> to count occurrences in an array.</p>',
            duration: 28,
            resources: [],
            codeExercises: [
              {
                id: 'advjs-m3-ex1',
                title: 'Write: countOccurrences',
                description: 'Implement <code>countOccurrences(arr)</code> returning a plain object {value: count}.',
                language: 'javascript',
                type: 'write',
                initialCode: 'function countOccurrences(arr) {\n  // TODO using Map\n}\n\nconsole.log(countOccurrences(["a","b","a"]));\n',
                solutionCode: 'function countOccurrences(arr) {\n  const map = new Map();\n  for (const item of arr) {\n    map.set(item, (map.get(item) || 0) + 1);\n  }\n  return Object.fromEntries(map.entries());\n}\n\nconsole.log(countOccurrences(["a","b","a"]));\n',
                expectedOutput: '{"a":2,"b":1}',
                testCode: `\ndescribe('countOccurrences', function() {\n  it('counts correctly', function() {\n    const out = countOccurrences(['a','b','a']);\n    assert.equals(out.a, 2);\n    assert.equals(out.b, 1);\n  });\n});\n`
              },
              {
                id: 'advjs-m3-ex2',
                title: 'Test: union of sets',
                description: 'Implement <code>union(a, b)</code> where inputs are arrays; output is an array with unique elements.',
                language: 'javascript',
                type: 'test',
                initialCode: 'function union(a, b) {\n  // TODO\n}\n',
                solutionCode: 'function union(a, b) {\n  return Array.from(new Set([...a, ...b]));\n}\n',
                expectedOutput: '[unique...]',
                testCode: `\ndescribe('union', function() {\n  it('returns unique elements', function() {\n    const out = union([1,2,2],[2,3]);\n    assert.equals(out.sort().join(','), '1,2,3');\n  });\n});\n`
              }
            ]
          },
          {
            title: 'Module 3 Assignment — Immutable transformations',
            type: 'assignment',
            content: '<p>Write code that transforms an array without mutating the original.</p>',
            isAssignment: true,
            requiredAssignment: true,
            assignmentDescription: 'Implement an immutable transform: given an array of people, return a new array where each person gets a computed "fullName". Do not mutate the input objects.',
            assignmentDeliverables: ['A working function with explanation', 'No mutation demonstrated'],
            assignmentQuestions: [
              { questionText: 'Provide your solution code (function + example usage).', type: 'open', points: 100 },
              { questionText: 'Explain how you ensured immutability.', type: 'open', points: 50 }
            ],
            assignmentConfig: { timeLimit: 60, allowRetakes: true, mode: 'exercise' },
            duration: 60,
            resources: []
          }
        ]
      },
    ],
  };

  const existing = await Course.findOne({ title: advancedCourseTitle });
  if (existing) {
    // update only fields we define
    Object.assign(existing, coursePayload);
    await existing.save();
  } else {
    await new Course(coursePayload).save();
  }

  console.log('✅ Seeded advanced JavaScript course with practical exercises.');
  process.exit(0);
};

seedAdvancedJsModules();

