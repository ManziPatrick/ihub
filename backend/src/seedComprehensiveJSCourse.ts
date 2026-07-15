import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedComprehensiveJSCourse = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding Comprehensive JavaScript Course...\n');

    let instructor = await User.findOne({ role: { $in: ['admin', 'trainer', 'super_admin'] } });
    if (!instructor) {
      instructor = await new User({
        fullName: 'JS Master Bootskills',
        username: 'js.master',
        email: 'js.master@bootskills.com',
        password: 'Password@123',
        role: 'trainer',
        status: 'active',
        academicStatus: 'active',
      }).save();
    }
    const instructorId = instructor._id;

    const coursePayload: any = {
      title: 'Complete JavaScript Mastery — From Variables to Advanced',
      description: `<p>A <strong>comprehensive JavaScript course</strong> covering everything from declaring variables to advanced topics like closures, promises, and async/await.</p>
<p>🚀 <strong>16 modules</strong> with <strong>30+ code exercises</strong>, quizzes, and a final project.</p>
<p>⚠️ <strong>Each code exercise must be completed and all tests passed before you can proceed to the next lesson.</strong></p>
<p>Topics: variables, data types, operators, control flow, loops, functions, arrays, objects, ES6+, scope, closures, callbacks, promises, async/await, error handling, DOM manipulation.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=800',
      instructor: instructorId,
      price: 1000,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Programming',
      status: 'published',
      submissionRequired: true,
      school: 'Bootskills Academy',
      modules: [
        // =====================================================================
        // MODULE 1: Variables & Data Types
        // =====================================================================
        {
          title: 'Module 1: Variables & Data Types',
          description: 'Learn how to store data using let, const, and var. Understand strings, numbers, booleans, null, and undefined.',
          order: 1,
          lessons: [
            {
              title: 'Declaring Variables with let and const',
              type: 'article',
              content: `<h2>Variables in JavaScript</h2>
<p>Variables store data. Use <code>let</code> for values that change and <code>const</code> for values that stay the same.</p>
<pre><code>let age = 25;       // can be reassigned
const name = "Alice"; // cannot be reassigned
var oldWay = "avoid"; // old, avoid using</code></pre>
<h3>Rules</h3>
<ul>
<li>Variable names can contain letters, digits, $, and _</li>
<li>Names cannot start with a digit</li>
<li>Use camelCase convention: <code>myVariableName</code></li>
</ul>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m1-ex1',
                  title: 'Create and Log Variables',
                  description: 'Create two variables — one with <code>let</code> and one with <code>const</code> — and log them to the console.',
                  language: 'javascript',
                  type: 'write',
                  initialCode: '// Declare a let variable called "city" with your city name\n// Declare a const variable called "country" with your country\n// Log both to the console\n',
                  solutionCode: 'let city = "Kigali";\nconst country = "Rwanda";\nconsole.log(city);\nconsole.log(country);',
                  testCode: '',
                  expectedOutput: '',
                },
                {
                  id: 'js-adv-m1-ex2',
                  title: 'Fix: const Reassignment Error',
                  description: 'This code has an error. Fix it so the program runs without throwing an error.',
                  language: 'javascript',
                  type: 'fix',
                  initialCode: 'const birthYear = 1995;\nbirthYear = 1996; // This will cause an error!\nconsole.log(birthYear);',
                  solutionCode: 'let birthYear = 1995;\nbirthYear = 1996;\nconsole.log(birthYear);',
                  testCode: '',
                  expectedOutput: '1996',
                },
                {
                  id: 'js-adv-m1-ex3',
                  title: 'Test: Type Checker',
                  description: 'Write a function <code>getType</code> that takes a value and returns its type as a string (e.g., "string", "number", "boolean").',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function getType(value) {\n  // Return the type of the value as a string\n  \n}',
                  solutionCode: 'function getType(value) {\n  return typeof value;\n}',
                  testCode: `
describe("getType Function", function() {
  it("should return 'string' for strings", function() {
    assert.equals(getType("hello"), "string", "typeof 'hello' is string");
  });
  it("should return 'number' for numbers", function() {
    assert.equals(getType(42), "number", "typeof 42 is number");
  });
  it("should return 'boolean' for booleans", function() {
    assert.equals(getType(true), "boolean", "typeof true is boolean");
  });
  it("should return 'undefined' for undefined", function() {
    assert.equals(getType(undefined), "undefined", "typeof undefined is undefined");
  });
  it("should return 'object' for null", function() {
    assert.equals(getType(null), "object", "typeof null is object");
  });
});`,
                },
              ],
            },
            {
              title: 'Data Types Deep Dive',
              type: 'article',
              content: `<h2>JavaScript Data Types</h2>
<h3>Primitive Types</h3>
<ul>
<li><strong>String</strong>: text — <code>"hello"</code>, <code>'world'</code>, <code>\`template\`</code></li>
<li><strong>Number</strong>: integers & decimals — <code>42</code>, <code>3.14</code>, <code>NaN</code>, <code>Infinity</code></li>
<li><strong>Boolean</strong>: <code>true</code> or <code>false</code></li>
<li><strong>Undefined</strong>: declared but not assigned</li>
<li><strong>Null</strong>: intentional emptiness</li>
<li><strong>Symbol</strong>: unique identifier</li>
<li><strong>BigInt</strong>: very large numbers</li>
</ul>
<h3>Checking Types</h3>
<pre><code>typeof "hello"  // "string"
typeof 42       // "number"
typeof true     // "boolean"
typeof undefined // "undefined"
typeof null     // "object" (historical quirk!)</code></pre>`,
              duration: 10,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m1-ex4',
                  title: 'Fill-in: Type Conversion',
                  description: 'Complete the function <code>stringToNumber</code> to convert a string to a number.',
                  language: 'javascript',
                  type: 'fill-in',
                  initialCode: 'function stringToNumber(str) {\n  // Use Number() or parseInt() to convert\n  return Number(____);\n}\n\nconsole.log(stringToNumber("42"));',
                  solutionCode: 'function stringToNumber(str) {\n  return Number(str);\n}\nconsole.log(stringToNumber("42"));',
                  testCode: '',
                  expectedOutput: '42',
                },
              ],
            },
            {
              title: 'Module 1 Quiz — Variables & Data Types',
              type: 'quiz',
              content: '<p>Test your understanding of variables and data types.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Which keyword declares a variable that cannot be reassigned?', type: 'multiple_choice', options: ['let', 'const', 'var', 'static'], correctOptionIndex: 1, explanation: 'const prevents reassignment.' },
                { questionText: 'What is the typeof "hello world"?', type: 'multiple_choice', options: ['"string"', '"text"', '"char"', '"word"'], correctOptionIndex: 0, explanation: 'typeof a string returns "string".' },
                { questionText: 'What is the typeof undefined?', type: 'multiple_choice', options: ['"null"', '"undefined"', '"object"', '"none"'], correctOptionIndex: 1, explanation: 'typeof undefined returns "undefined".' },
                { questionText: 'What is typeof null?', type: 'multiple_choice', options: ['"null"', '"undefined"', '"object"', '"none"'], correctOptionIndex: 2, explanation: 'typeof null returns "object" (a known JS quirk).' },
                { questionText: 'Can a const variable be reassigned?', type: 'multiple_choice', options: ['Yes', 'No', 'Only in strict mode', 'Only with var'], correctOptionIndex: 1, explanation: 'const variables cannot be reassigned.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 2: Operators & Expressions
        // =====================================================================
        {
          title: 'Module 2: Operators & Expressions',
          description: 'Master arithmetic, comparison, logical, and assignment operators.',
          order: 2,
          lessons: [
            {
              title: 'Arithmetic & Assignment Operators',
              type: 'article',
              content: `<h2>Operators</h2>
<h3>Arithmetic</h3>
<pre><code>+   addition
-   subtraction
*   multiplication
/   division
%   modulus (remainder)
**  exponentiation</code></pre>
<h3>Assignment</h3>
<pre><code>=   assignment
+=  add and assign
-=  subtract and assign
*=  multiply and assign
/=  divide and assign
%=  modulus and assign</code></pre>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m2-ex1',
                  title: 'Calculate Area of a Rectangle',
                  description: 'Write code that calculates the area of a rectangle (width × height) and prints it.',
                  language: 'javascript',
                  type: 'write',
                  initialCode: 'let width = 10;\nlet height = 5;\n// Calculate area and print it\n',
                  solutionCode: 'let width = 10;\nlet height = 5;\nlet area = width * height;\nconsole.log(area);',
                  testCode: '',
                  expectedOutput: '50',
                },
                {
                  id: 'js-adv-m2-ex2',
                  title: 'Test: Even Number Checker',
                  description: 'Write a function <code>isEven</code> that returns true if a number is even.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function isEven(num) {\n  // Use the % operator\n  \n}',
                  solutionCode: 'function isEven(num) {\n  return num % 2 === 0;\n}',
                  testCode: `
describe("isEven", function() {
  it("returns true for even numbers", function() {
    assert.equals(isEven(4), true);
  });
  it("returns false for odd numbers", function() {
    assert.equals(isEven(7), false);
  });
  it("handles zero", function() {
    assert.equals(isEven(0), true);
  });
  it("handles negative even", function() {
    assert.equals(isEven(-2), true);
  });
});`,
                },
              ],
            },
            {
              title: 'Comparison & Logical Operators',
              type: 'article',
              content: `<h2>Comparison Operators</h2>
<pre><code>===  strict equal (value + type)
!==  strict not equal
>    greater than
<    less than
>=   greater than or equal
<=   less than or equal</code></pre>
<h2>Logical Operators</h2>
<pre><code>&&   AND (both true)
||   OR (at least one true)
!    NOT (inverts boolean)</code></pre>
<h3>Short-circuit Evaluation</h3>
<pre><code>// Logical OR returns first truthy value
let name = userInput || "Guest";

// Logical AND returns first falsy value
let result = isAdmin && canEdit;</code></pre>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m2-ex3',
                  title: 'Can Vote Checker',
                  description: 'Write a function <code>canVote</code> that takes an age and returns true if the person is 18 or older.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function canVote(age) {\n  // Return true if age >= 18\n  \n}',
                  solutionCode: 'function canVote(age) {\n  return age >= 18;\n}',
                  testCode: `
describe("canVote", function() {
  it("returns true for 18", function() {
    assert.equals(canVote(18), true);
  });
  it("returns true for 25", function() {
    assert.equals(canVote(25), true);
  });
  it("returns false for 17", function() {
    assert.equals(canVote(17), false);
  });
  it("returns false for 0", function() {
    assert.equals(canVote(0), false);
  });
});`,
                },
                {
                  id: 'js-adv-m2-ex4',
                  title: 'Logical AND/OR Practice',
                  description: 'Write a function <code>isTeenager</code> that returns true if age is between 13 and 19 (inclusive).',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function isTeenager(age) {\n  // Use && to check both conditions\n  \n}',
                  solutionCode: 'function isTeenager(age) {\n  return age >= 13 && age <= 19;\n}',
                  testCode: `
describe("isTeenager", function() {
  it("returns true for 13", function() { assert.equals(isTeenager(13), true); });
  it("returns true for 19", function() { assert.equals(isTeenager(19), true); });
  it("returns false for 12", function() { assert.equals(isTeenager(12), false); });
  it("returns false for 20", function() { assert.equals(isTeenager(20), false); });
});`,
                },
              ],
            },
            {
              title: 'Module 2 Quiz — Operators',
              type: 'quiz',
              content: '<p>Test your understanding of JavaScript operators.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What does 10 % 3 return?', type: 'multiple_choice', options: ['3', '1', '0', '3.33'], correctOptionIndex: 1, explanation: '10 / 3 = 3 remainder 1.' },
                { questionText: 'What is the result of 5 > 3 && 2 < 1?', type: 'multiple_choice', options: ['true', 'false', 'undefined', 'Error'], correctOptionIndex: 1, explanation: '5>3 is true but 2<1 is false, so AND is false.' },
                { questionText: 'What does 2 ** 3 return?', type: 'multiple_choice', options: ['6', '8', '5', '9'], correctOptionIndex: 1, explanation: '2 ** 3 = 2 × 2 × 2 = 8.' },
                { questionText: 'What operator checks strict equality?', type: 'multiple_choice', options: ['==', '===', '=', '!='], correctOptionIndex: 1, explanation: '=== checks both value and type.' },
                { questionText: 'What does !true evaluate to?', type: 'multiple_choice', options: ['true', 'false', 'undefined', 'null'], correctOptionIndex: 1, explanation: '! (NOT) inverts the boolean value.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 3: String Methods & Template Literals
        // =====================================================================
        {
          title: 'Module 3: String Methods & Template Literals',
          description: 'Learn powerful string manipulation techniques.',
          order: 3,
          lessons: [
            {
              title: 'String Methods',
              type: 'article',
              content: `<h2>String Methods</h2>
<pre><code>let str = "Hello, World!";

str.length;         // 13
str.toUpperCase();  // "HELLO, WORLD!"
str.toLowerCase();  // "hello, world!"
str.includes("lo"); // true
str.indexOf("W");   // 7
str.slice(0, 5);    // "Hello"
str.replace("Hello", "Hi"); // "Hi, World!"
str.split(", ");    // ["Hello", "World!"]
str.trim();         // removes whitespace</code></pre>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m3-ex1',
                  title: 'Test: Count Vowels',
                  description: 'Write a function <code>countVowels</code> that counts vowels (a, e, i, o, u) in a string.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function countVowels(str) {\n  // Use toLowerCase() and includes()\n  let count = 0;\n  \n  return count;\n}',
                  solutionCode: 'function countVowels(str) {\n  let count = 0;\n  const vowels = "aeiou";\n  for (let char of str.toLowerCase()) {\n    if (vowels.includes(char)) count++;\n  }\n  return count;\n}',
                  testCode: `
describe("countVowels", function() {
  it("counts vowels in 'hello'", function() { assert.equals(countVowels("hello"), 2); });
  it("counts vowels in 'sky'", function() { assert.equals(countVowels("sky"), 0); });
  it("handles uppercase", function() { assert.equals(countVowels("AEIOU"), 5); });
  it("counts in 'JavaScript'", function() { assert.equals(countVowels("JavaScript"), 3); });
});`,
                },
              ],
            },
            {
              title: 'Template Literals',
              type: 'article',
              content: `<h2>Template Literals</h2>
<p>Template literals use backticks (<code>\`\`</code>) and allow variables inside <code>\${}</code>:</p>
<pre><code>let name = "Alice";
let age = 25;
let message = \`Hi, I'm \${name} and I'm \${age} years old.\`;
console.log(message); // "Hi, I'm Alice and I'm 25 years old."</code></pre>
<p>They also support multi-line strings:</p>
<pre><code>let poem = \`Roses are red
Violets are blue
JavaScript is awesome
And so are you!\`;</code></pre>`,
              duration: 8,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m3-ex2',
                  title: 'Create a Greeting with Template Literals',
                  description: 'Write a function <code>greet</code> that takes a name and returns \`Hello, [name]! Welcome to JavaScript.\` using a template literal.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function greet(name) {\n  // Use a template literal\n  return \`\n}\n\nconsole.log(greet("Student"));',
                  solutionCode: 'function greet(name) {\n  return \`Hello, \${name}! Welcome to JavaScript.\`;\n}\nconsole.log(greet("Student"));',
                  testCode: `
describe("greet", function() {
  it("greets correctly", function() { assert.equals(greet("Alice"), "Hello, Alice! Welcome to JavaScript."); });
  it("greets another name", function() { assert.equals(greet("Bob"), "Hello, Bob! Welcome to JavaScript."); });
});`,
                  expectedOutput: 'Hello, Student! Welcome to JavaScript.',
                },
              ],
            },
            {
              title: 'Module 3 Quiz — Strings',
              type: 'quiz',
              content: '<p>Test your string knowledge.</p>',
              duration: 10,
              quizQuestions: [
                { questionText: 'What does "hello".toUpperCase() return?', type: 'multiple_choice', options: ['"hello"', '"HELLO"', '"Hello"', '"hELLO"'], correctOptionIndex: 1, explanation: 'toUpperCase() converts to uppercase.' },
                { questionText: 'What symbol starts a template literal?', type: 'multiple_choice', options: ['"', "'", '\`', '~'], correctOptionIndex: 2, explanation: 'Backticks (\`) are used for template literals.' },
                { questionText: 'What does "JavaScript".includes("Script") return?', type: 'multiple_choice', options: ['true', 'false', '0', '"Script"'], correctOptionIndex: 0, explanation: 'includes() returns true if substring is found.' },
                { questionText: 'What is the index of the first character in a string?', type: 'multiple_choice', options: ['-1', '0', '1', 'First'], correctOptionIndex: 1, explanation: 'String indices start at 0.' },
                { questionText: 'What does "a,b,c".split(",") return?', type: 'multiple_choice', options: ['"a b c"', '["a","b","c"]', '"abc"', '"a,b,c"'], correctOptionIndex: 1, explanation: 'split() returns an array of substrings.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 4: Control Flow
        // =====================================================================
        {
          title: 'Module 4: Control Flow — If/Else, Switch, Ternary',
          description: 'Master decision-making in JavaScript.',
          order: 4,
          lessons: [
            {
              title: 'If/Else If/Else',
              type: 'article',
              content: `<h2>Conditional Statements</h2>
<pre><code>let score = 85;
let grade;

if (score >= 90) {
  grade = "A";
} else if (score >= 80) {
  grade = "B";
} else if (score >= 70) {
  grade = "C";
} else {
  grade = "F";
}

console.log(grade); // "B"</code></pre>
<h3>Ternary Operator (short)</h3>
<pre><code>let status = age >= 18 ? "adult" : "minor";</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m4-ex1',
                  title: 'Grade Calculator',
                  description: 'Write a function <code>getGrade</code> that returns "A" for 90+, "B" for 80-89, "C" for 70-79, "F" for below 70.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function getGrade(score) {\n  // Return "A", "B", "C", or "F"\n  \n}',
                  solutionCode: 'function getGrade(score) {\n  if (score >= 90) return "A";\n  if (score >= 80) return "B";\n  if (score >= 70) return "C";\n  return "F";\n}',
                  testCode: `
describe("getGrade", function() {
  it("A for 95", function() { assert.equals(getGrade(95), "A"); });
  it("B for 85", function() { assert.equals(getGrade(85), "B"); });
  it("C for 75", function() { assert.equals(getGrade(75), "C"); });
  it("F for 65", function() { assert.equals(getGrade(65), "F"); });
  it("F for 50", function() { assert.equals(getGrade(50), "F"); });
});`,
                },
                {
                  id: 'js-adv-m4-ex2',
                  title: 'Ternary: Even or Odd Message',
                  description: 'Complete the ternary expression to return "even" if the number is even, "odd" if not.',
                  language: 'javascript',
                  type: 'fill-in',
                  initialCode: 'function evenOrOdd(num) {\n  return num % 2 === 0 ? "______" : "______";\n}\n\nconsole.log(evenOrOdd(5));\nconsole.log(evenOrOdd(8));',
                  solutionCode: 'function evenOrOdd(num) {\n  return num % 2 === 0 ? "even" : "odd";\n}\nconsole.log(evenOrOdd(5));\nconsole.log(evenOrOdd(8));',
                  testCode: '',
                  expectedOutput: 'odd\neven',
                },
              ],
            },
            {
              title: 'Switch Statements',
              type: 'article',
              content: `<h2>Switch Statement</h2>
<p>Use switch when you have many exact conditions:</p>
<pre><code>let day = 3;
let dayName;

switch (day) {
  case 1: dayName = "Monday"; break;
  case 2: dayName = "Tuesday"; break;
  case 3: dayName = "Wednesday"; break;
  case 4: dayName = "Thursday"; break;
  case 5: dayName = "Friday"; break;
  default: dayName = "Weekend";
}

console.log(dayName); // "Wednesday"</code></pre>
<p>Don't forget <code>break</code> — otherwise code "falls through"!</p>`,
              duration: 10,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m4-ex3',
                  title: 'Fix: Missing Break Statements',
                  description: 'Fix this switch statement — it has missing break statements causing fall-through!',
                  language: 'javascript',
                  type: 'fix',
                  initialCode: 'function getSeason(month) {\n  let season;\n  switch (month) {\n    case 12:\n    case 1:\n    case 2:\n      season = "Winter";\n    case 3:\n    case 4:\n    case 5:\n      season = "Spring";\n    case 6:\n    case 7:\n    case 8:\n      season = "Summer";\n    case 9:\n    case 10:\n    case 11:\n      season = "Fall";\n  }\n  return season;\n}\n\nconsole.log(getSeason(1)); // Should be "Winter", but what is it?',
                  solutionCode: 'function getSeason(month) {\n  let season;\n  switch (month) {\n    case 12:\n    case 1:\n    case 2:\n      season = "Winter";\n      break;\n    case 3:\n    case 4:\n    case 5:\n      season = "Spring";\n      break;\n    case 6:\n    case 7:\n    case 8:\n      season = "Summer";\n      break;\n    case 9:\n    case 10:\n    case 11:\n      season = "Fall";\n      break;\n  }\n  return season;\n}\nconsole.log(getSeason(1));',
                  testCode: '',
                  expectedOutput: 'Winter',
                },
              ],
            },
            {
              title: 'Module 4 Quiz — Control Flow',
              type: 'quiz',
              content: '<p>Test your control flow knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What does the ternary operator do?', type: 'multiple_choice', options: ['Loops through arrays', 'Short if/else expression', 'Declares variables', 'Creates functions'], correctOptionIndex: 1, explanation: 'The ternary (?:) is a short if/else.' },
                { questionText: 'What keyword prevents fall-through in switch?', type: 'multiple_choice', options: ['stop', 'end', 'break', 'exit'], correctOptionIndex: 2, explanation: 'break exits the switch case.' },
                { questionText: 'What is the else if syntax in JavaScript?', type: 'multiple_choice', options: ['elif', 'else if', 'elseif', 'elsif'], correctOptionIndex: 1, explanation: 'JavaScript uses "else if" (two words).' },
                { questionText: 'What is the result? console.log(true ? "yes" : "no")', type: 'multiple_choice', options: ['"yes"', '"no"', 'true', 'false'], correctOptionIndex: 0, explanation: 'true ? "yes" : "no" returns "yes".' },
                { questionText: 'What does the default case in switch do?', type: 'multiple_choice', options: ['Always runs first', 'Runs when no case matches', 'Breaks the loop', 'Ends the program'], correctOptionIndex: 1, explanation: 'default handles values not matched by any case.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 5: Loops
        // =====================================================================
        {
          title: 'Module 5: Loops — For, While, Do-While',
          description: 'Master iteration in JavaScript.',
          order: 5,
          lessons: [
            {
              title: 'For Loops',
              type: 'article',
              content: `<h2>The For Loop</h2>
<pre><code>// Syntax: for (initialization; condition; increment)
for (let i = 0; i < 5; i++) {
  console.log(i); // 0, 1, 2, 3, 4
}

// Loop through an array
let fruits = ["apple", "banana", "cherry"];
for (let i = 0; i < fruits.length; i++) {
  console.log(fruits[i]);
}

// For...of (simpler for arrays)
for (let fruit of fruits) {
  console.log(fruit);
}</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m5-ex1',
                  title: 'Test: Sum from 1 to N',
                  description: 'Write a function <code>sumTo</code> that sums all numbers from 1 to n using a for loop.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function sumTo(n) {\n  let sum = 0;\n  // Use a for loop\n  \n  return sum;\n}',
                  solutionCode: 'function sumTo(n) {\n  let sum = 0;\n  for (let i = 1; i <= n; i++) {\n    sum += i;\n  }\n  return sum;\n}',
                  testCode: `
describe("sumTo", function() {
  it("sums 1 to 5 equals 15", function() { assert.equals(sumTo(5), 15); });
  it("sums 1 to 1 equals 1", function() { assert.equals(sumTo(1), 1); });
  it("sums 1 to 10 equals 55", function() { assert.equals(sumTo(10), 55); });
  it("returns 0 for n=0", function() { assert.equals(sumTo(0), 0); });
});`,
                },
                {
                  id: 'js-adv-m5-ex2',
                  title: 'Print a Triangle',
                  description: 'Write a function <code>printTriangle</code> that prints a triangle of asterisks with n rows using nested loops. Each row i has i asterisks.',
                  language: 'javascript',
                  type: 'write',
                  initialCode: 'function printTriangle(n) {\n  // Use nested loops\n  for (let i = 1; i <= n; i++) {\n    let row = "";\n    // Inner loop\n    \n  }\n}\n\nprintTriangle(4);',
                  solutionCode: 'function printTriangle(n) {\n  for (let i = 1; i <= n; i++) {\n    let row = "";\n    for (let j = 1; j <= i; j++) {\n      row += "*";\n    }\n    console.log(row);\n  }\n}\nprintTriangle(4);',
                  testCode: '',
                  expectedOutput: '*\n**\n***\n****',
                },
              ],
            },
            {
              title: 'While and Do-While Loops',
              type: 'article',
              content: `<h2>While Loop</h2>
<pre><code>let i = 1;
while (i <= 5) {
  console.log(i);
  i++;
}</code></pre>
<h2>Do-While Loop</h2>
<pre><code>let j = 1;
do {
  console.log(j);
  j++;
} while (j <= 5);</code></pre>
<p>Difference: <code>do-while</code> always runs at least once.</p>`,
              duration: 10,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m5-ex3',
                  title: 'Write: Factorial with While',
                  description: 'Write a function <code>factorial(n)</code> that calculates n! (n × (n-1) × ... × 1) using a while loop.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function factorial(n) {\n  let result = 1;\n  // Use a while loop\n  \n  return result;\n}',
                  solutionCode: 'function factorial(n) {\n  let result = 1;\n  while (n > 1) {\n    result *= n;\n    n--;\n  }\n  return result;\n}',
                  testCode: `
describe("factorial", function() {
  it("5! = 120", function() { assert.equals(factorial(5), 120); });
  it("3! = 6", function() { assert.equals(factorial(3), 6); });
  it("1! = 1", function() { assert.equals(factorial(1), 1); });
  it("0! = 1", function() { assert.equals(factorial(0), 1); });
});`,
                },
              ],
            },
            {
              title: 'Module 5 Quiz — Loops',
              type: 'quiz',
              content: '<p>Test your loop knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'How many times does this run? for(let i=0; i<5; i++)', type: 'multiple_choice', options: ['4', '5', '6', 'Infinite'], correctOptionIndex: 1, explanation: 'Runs for i=0,1,2,3,4 = 5 times.' },
                { questionText: 'What is the difference between while and do-while?', type: 'multiple_choice', options: ['No difference', 'do-while always runs at least once', 'while is only for arrays', 'do-while is faster'], correctOptionIndex: 1, explanation: 'do-while executes the body before checking the condition.' },
                { questionText: 'What keyword exits a loop immediately?', type: 'multiple_choice', options: ['exit', 'break', 'stop', 'end'], correctOptionIndex: 1, explanation: 'break exits the loop immediately.' },
                { questionText: 'What does for...of loop over?', type: 'multiple_choice', options: ['Object keys', 'Array values', 'Indices', 'Function parameters'], correctOptionIndex: 1, explanation: 'for...of iterates over values of an iterable (like an array).' },
                { questionText: 'What does continue do in a loop?', type: 'multiple_choice', options: ['Exits the loop', 'Skips to next iteration', 'Restarts the loop', 'Pauses the loop'], correctOptionIndex: 1, explanation: 'continue skips the rest of the current iteration.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 6: Functions
        // =====================================================================
        {
          title: 'Module 6: Functions — Declarations, Expressions, Arrow',
          description: 'Learn to write reusable code with functions.',
          order: 6,
          lessons: [
            {
              title: 'Function Declarations & Arrow Functions',
              type: 'article',
              content: `<h2>Three Ways to Write Functions</h2>
<pre><code>// 1. Declaration (hoisted)
function add(a, b) {
  return a + b;
}

// 2. Expression (not hoisted)
const subtract = function(a, b) {
  return a - b;
};

// 3. Arrow function (modern)
const multiply = (a, b) => a * b;

// Arrow with multiple lines needs {}
const divide = (a, b) => {
  if (b === 0) return "Cannot divide by zero";
  return a / b;
};</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m6-ex1',
                  title: 'Test: Max of Two Numbers',
                  description: 'Write an arrow function called <code>max</code> that takes two numbers and returns the larger one.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'const max = (a, b) => {\n  // Return the larger of a and b\n  \n};',
                  solutionCode: 'const max = (a, b) => a > b ? a : b;',
                  testCode: `
describe("max", function() {
  it("max(5, 3) = 5", function() { assert.equals(max(5, 3), 5); });
  it("max(2, 10) = 10", function() { assert.equals(max(2, 10), 10); });
  it("max(7, 7) = 7", function() { assert.equals(max(7, 7), 7); });
});`,
                },
                {
                  id: 'js-adv-m6-ex2',
                  title: 'Fix: Arrow Function Syntax',
                  description: 'Fix this arrow function that should return the square of a number.',
                  language: 'javascript',
                  type: 'fix',
                  initialCode: 'const square = (n) => {\n  n * n; // Missing return!\n}\n\nconsole.log(square(5)); // Should be 25 but is undefined',
                  solutionCode: 'const square = (n) => n * n;\nconsole.log(square(5));',
                  testCode: '',
                  expectedOutput: '25',
                },
                {
                  id: 'js-adv-m6-ex3',
                  title: 'Test: Reverse a String',
                  description: 'Write a function <code>reverseString</code> that reverses a string.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function reverseString(str) {\n  // Use split(), reverse(), join()\n  \n}',
                  solutionCode: 'function reverseString(str) {\n  return str.split("").reverse().join("");\n}',
                  testCode: `
describe("reverseString", function() {
  it('reverses "hello"', function() { assert.equals(reverseString("hello"), "olleh"); });
  it('reverses "JavaScript"', function() { assert.equals(reverseString("JavaScript"), "tpircSavaJ"); });
  it("handles empty string", function() { assert.equals(reverseString(""), ""); });
});`,
                },
              ],
            },
            {
              title: 'Parameters & Return Values',
              type: 'article',
              content: `<h2>Advanced Parameters</h2>
<pre><code>// Default parameters
function greet(name = "Guest") {
  return \`Hello, \${name}!\`;
}

// Rest parameters
function sumAll(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}

// Multiple return values (via array/object)
function getMinMax(arr) {
  return { min: Math.min(...arr), max: Math.max(...arr) };
}</code></pre>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m6-ex4',
                  title: 'Test: Default Parameter Greeting',
                  description: 'Write a function <code>greet</code> with a default parameter. If no name is given, use "World".',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function greet(name = "______") {\n  return \`Hello, \${name}!\`;\n}',
                  solutionCode: 'function greet(name = "World") {\n  return \`Hello, \${name}!\`;\n}',
                  testCode: `
describe("greet", function() {
  it('greets by name', function() { assert.equals(greet("Alice"), "Hello, Alice!"); });
  it('greets World by default', function() { assert.equals(greet(), "Hello, World!"); });
});`,
                },
              ],
            },
            {
              title: 'Module 6 Quiz — Functions',
              type: 'quiz',
              content: '<p>Test your function knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What keyword declares a function?', type: 'multiple_choice', options: ['func', 'function', 'fn', '=>'], correctOptionIndex: 1, explanation: 'The function keyword declares a function.' },
                { questionText: 'What do arrow functions use instead of the function keyword?', type: 'multiple_choice', options: ['->', '=>', '::', '-->'], correctOptionIndex: 1, explanation: 'Arrow functions use => syntax.' },
                { questionText: 'What does a function return if there is no return statement?', type: 'multiple_choice', options: ['null', '0', 'undefined', 'false'], correctOptionIndex: 2, explanation: 'Functions without return return undefined.' },
                { questionText: 'What are rest parameters?', type: 'multiple_choice', options: ['Fixed parameters', 'Collect remaining arguments into an array', 'Default values', 'Optional parameters'], correctOptionIndex: 1, explanation: 'Rest parameters (...args) collect remaining arguments.' },
                { questionText: 'Can functions be assigned to variables?', type: 'multiple_choice', options: ['Yes', 'No'], correctOptionIndex: 0, explanation: 'Functions are first-class citizens and can be assigned to variables.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 7: Arrays
        // =====================================================================
        {
          title: 'Module 7: Arrays — Creation & Methods',
          description: 'Master JavaScript arrays and their methods.',
          order: 7,
          lessons: [
            {
              title: 'Creating and Manipulating Arrays',
              type: 'article',
              content: `<h2>Array Basics</h2>
<pre><code>let numbers = [1, 2, 3, 4, 5];
console.log(numbers[0]); // 1
console.log(numbers.length); // 5
numbers[5] = 6; // add at index</code></pre>
<h3>Key Methods</h3>
<pre><code>push(item)    // add to end
pop()         // remove from end
shift()       // remove from start
unshift(item) // add to start
indexOf(item) // find index
includes(item) // check exists
join(sep)     // combine into string
slice(start, end) // copy portion
splice(start, count) // remove/replace</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m7-ex1',
                  title: 'Test: Array Average',
                  description: 'Write a function <code>average</code> that computes the average of an array of numbers.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function average(arr) {\n  // Use a loop or reduce\n  \n}',
                  solutionCode: 'function average(arr) {\n  const sum = arr.reduce((a, b) => a + b, 0);\n  return sum / arr.length;\n}',
                  testCode: `
describe("average", function() {
  it("average of [1,2,3] is 2", function() { assert.equals(average([1,2,3]), 2); });
  it("average of [5,5,5,5] is 5", function() { assert.equals(average([5,5,5,5]), 5); });
  it("average of single [10] is 10", function() { assert.equals(average([10]), 10); });
});`,
                },
                {
                  id: 'js-adv-m7-ex2',
                  title: 'Combine Two Arrays',
                  description: 'Write a function <code>combine</code> that takes two arrays and returns a new array with all elements from both. Do NOT mutate the originals.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function combine(arr1, arr2) {\n  // Use concat or spread operator\n  \n}',
                  solutionCode: 'function combine(arr1, arr2) {\n  return [...arr1, ...arr2];\n}',
                  testCode: `
describe("combine", function() {
  it("combines [1,2] and [3,4]", function() { assert.equals(combine([1,2],[3,4]).join(","), "1,2,3,4"); });
  it("does not mutate originals", function() {
    const a = [1], b = [2];
    const c = combine(a, b);
    assert.equals(a.length, 1);
    assert.equals(b.length, 1);
  });
});`,
                },
              ],
            },
            {
              title: 'Array Iteration & Searching',
              type: 'article',
              content: `<h2>Iterating Arrays</h2>
<pre><code>// forEach: do something with each
fruits.forEach(fruit => console.log(fruit));

// find: get first match
let found = numbers.find(n => n > 10);

// filter: get all matches
let big = numbers.filter(n => n > 10);

// some: any match?
let hasBig = numbers.some(n => n > 100);

// every: all match?
let allPositive = numbers.every(n => n > 0);</code></pre>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m7-ex3',
                  title: 'Test: Find First Even',
                  description: 'Write a function <code>findFirstEven</code> that returns the first even number in an array. If none, return undefined.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function findFirstEven(arr) {\n  // Use find()\n  \n}',
                  solutionCode: 'function findFirstEven(arr) {\n  return arr.find(n => n % 2 === 0);\n}',
                  testCode: `
describe("findFirstEven", function() {
  it("finds 4 in [1,3,4,5]", function() { assert.equals(findFirstEven([1,3,4,5]), 4); });
  it("returns undefined if none", function() { assert.equals(findFirstEven([1,3,5]), undefined); });
});`,
                },
              ],
            },
            {
              title: 'Module 7 Quiz — Arrays',
              type: 'quiz',
              content: '<p>Test your array knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Which method adds to the end of an array?', type: 'multiple_choice', options: ['push()', 'pop()', 'shift()', 'unshift()'], correctOptionIndex: 0, explanation: 'push() appends to the end.' },
                { questionText: 'What is the index of the first element?', type: 'multiple_choice', options: ['1', '0', '-1', 'First'], correctOptionIndex: 1, explanation: 'Array indices start at 0.' },
                { questionText: 'Which method finds the first element matching a condition?', type: 'multiple_choice', options: ['filter()', 'find()', 'some()', 'indexOf()'], correctOptionIndex: 1, explanation: 'find() returns the first matching element.' },
                { questionText: 'What does [1, 2, 3].length return?', type: 'multiple_choice', options: ['2', '3', '4', 'undefined'], correctOptionIndex: 1, explanation: 'length returns the number of elements.' },
                { questionText: 'Which method creates a new array with elements that pass a test?', type: 'multiple_choice', options: ['map()', 'filter()', 'reduce()', 'forEach()'], correctOptionIndex: 1, explanation: 'filter() creates a new array with elements that pass the test.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 8: Objects
        // =====================================================================
        {
          title: 'Module 8: Objects & Object Methods',
          description: 'Learn how to structure data with objects.',
          order: 8,
          lessons: [
            {
              title: 'Creating and Accessing Objects',
              type: 'article',
              content: `<h2>Objects in JavaScript</h2>
<pre><code>let person = {
  firstName: "Alice",
  lastName: "Smith",
  age: 25,
  isStudent: true,
  hobbies: ["reading", "coding"],
  address: {
    city: "Kigali",
    country: "Rwanda"
  }
};

// Access properties
console.log(person.firstName);   // "Alice" (dot notation)
console.log(person["age"]);      // 25 (bracket notation)

// Add properties
person.email = "alice@example.com";

// Delete properties
delete person.isStudent;

// Check if property exists
console.log("firstName" in person); // true</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m8-ex1',
                  title: 'Build a Book Object',
                  description: 'Create an object <code>book</code> with properties: title, author, year, and genres (array). Log each property.',
                  language: 'javascript',
                  type: 'write',
                  initialCode: '// Create a book object\nlet book = {\n  title: "______",\n  author: "______",\n  year: ______,\n  genres: []\n};\n\n// Log each property\n',
                  solutionCode: 'let book = {\n  title: "JavaScript Mastery",\n  author: "Jane Dev",\n  year: 2024,\n  genres: ["programming", "web development"]\n};\nconsole.log(book.title);\nconsole.log(book.author);\nconsole.log(book.year);\nconsole.log(book.genres);',
                  testCode: '',
                  expectedOutput: 'JavaScript Mastery\nJane Dev\n2024\n["programming","web development"]',
                },
                {
                  id: 'js-adv-m8-ex2',
                  title: 'Test: Count Object Keys',
                  description: 'Write a function <code>countKeys</code> that returns the number of keys in an object.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function countKeys(obj) {\n  // Use Object.keys() or a loop\n  \n}',
                  solutionCode: 'function countKeys(obj) {\n  return Object.keys(obj).length;\n}',
                  testCode: `
describe("countKeys", function() {
  it("counts keys in {a:1,b:2,c:3}", function() { assert.equals(countKeys({a:1,b:2,c:3}), 3); });
  it("returns 0 for empty object", function() { assert.equals(countKeys({}), 0); });
});`,
                },
              ],
            },
            {
              title: 'Object Methods and this',
              type: 'article',
              content: `<h2>Methods in Objects</h2>
<pre><code>let calculator = {
  value: 0,
  add(n) {
    this.value += n;
    return this;
  },
  subtract(n) {
    this.value -= n;
    return this;
  },
  getResult() {
    return this.value;
  }
};

calculator.add(5).subtract(2);
console.log(calculator.getResult()); // 3</code></pre>
<p><code>this</code> refers to the object the method is called on.</p>`,
              duration: 10,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m8-ex3',
                  title: 'Fix: this Context in Object',
                  description: 'Fix the code so greet() correctly uses this.name.',
                  language: 'javascript',
                  type: 'fix',
                  initialCode: 'let user = {\n  name: "Alice",\n  greet: () => {\n    return "Hello, " + this.name; // What will this be?\n  }\n};\n\nconsole.log(user.greet());',
                  solutionCode: 'let user = {\n  name: "Alice",\n  greet() {\n    return "Hello, " + this.name;\n  }\n};\n\nconsole.log(user.greet());',
                  testCode: '',
                  expectedOutput: 'Hello, Alice',
                },
              ],
            },
            {
              title: 'Module 8 Quiz — Objects',
              type: 'quiz',
              content: '<p>Test your object knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'How do you access the "name" property of obj?', type: 'multiple_choice', options: ['obj(name)', 'obj["name"]', 'obj->name', 'name.obj'], correctOptionIndex: 1, explanation: 'obj["name"] or obj.name accesses the property.' },
                { questionText: 'What keyword inside a method refers to the object?', type: 'multiple_choice', options: ['self', 'this', 'that', 'me'], correctOptionIndex: 1, explanation: 'this refers to the object the method belongs to.' },
                { questionText: 'How do you add a property to an existing object?', type: 'multiple_choice', options: ['obj.add("key", "val")', 'obj.key = "val"', 'obj["key"] = "val"', 'Both B and C'], correctOptionIndex: 3, explanation: 'Both dot and bracket notation work for assignment.' },
                { questionText: 'What does Object.keys(obj) return?', type: 'multiple_choice', options: ['Array of values', 'Array of keys', 'Number of keys', 'String of keys'], correctOptionIndex: 1, explanation: 'Object.keys() returns an array of keys.' },
                { questionText: 'What does delete obj.prop do?', type: 'multiple_choice', options: ['Sets to null', 'Removes the property', 'Sets to undefined', 'Throws error'], correctOptionIndex: 1, explanation: 'delete removes the property from the object.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 9: Array Methods Deep Dive
        // =====================================================================
        {
          title: 'Module 9: Array Methods Deep Dive — Map, Filter, Reduce',
          description: 'Master the most powerful array methods.',
          order: 9,
          lessons: [
            {
              title: 'Map & Filter',
              type: 'article',
              content: `<h2>Transforming Arrays</h2>
<h3>Map — transform every element</h3>
<pre><code>let numbers = [1, 2, 3, 4, 5];
let doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10]

let names = ["alice", "bob", "charlie"];
let upper = names.map(n => n.toUpperCase());
// ["ALICE", "BOB", "CHARLIE"]</code></pre>

<h3>Filter — keep matching elements</h3>
<pre><code>let evens = numbers.filter(n => n % 2 === 0);
// [2, 4]

let longNames = names.filter(n => n.length > 3);
// ["alice", "charlie"]</code></pre>

<p><strong>Key:</strong> Both return NEW arrays, originals are unchanged.</p>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m9-ex1',
                  title: 'Test: Square Each Number with Map',
                  description: 'Write a function <code>squareAll</code> that takes an array and returns a new array with each number squared.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function squareAll(numbers) {\n  // Use map()\n  \n}',
                  solutionCode: 'function squareAll(numbers) {\n  return numbers.map(n => n * n);\n}',
                  testCode: `
describe("squareAll", function() {
  it("squares [1,2,3]", function() { assert.equals(squareAll([1,2,3]).join(","), "1,4,9"); });
  it("handles empty array", function() { assert.equals(squareAll([]).length, 0); });
});`,
                },
                {
                  id: 'js-adv-m9-ex2',
                  title: 'Test: Filter Out Short Words',
                  description: 'Write a function <code>filterLongWords</code> that returns words with length >= 4.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function filterLongWords(words) {\n  // Use filter()\n  \n}',
                  solutionCode: 'function filterLongWords(words) {\n  return words.filter(w => w.length >= 4);\n}',
                  testCode: `
describe("filterLongWords", function() {
  it("filters short words", function() { assert.equals(filterLongWords(["hi","hello","hey","greetings"]).join(","), "hello,greetings"); });
  it("empty array", function() { assert.equals(filterLongWords([]).length, 0); });
});`,
                },
              ],
            },
            {
              title: 'Reduce — The Swiss Army Knife',
              type: 'article',
              content: `<h2>Reduce</h2>
<p>Reduce transforms an array into any single value:</p>
<pre><code>let numbers = [1, 2, 3, 4, 5];

// Sum
let sum = numbers.reduce((acc, n) => acc + n, 0);
// 15

// Product
let product = numbers.reduce((acc, n) => acc * n, 1);
// 120

// Max
let max = numbers.reduce((acc, n) => n > acc ? n : acc, -Infinity);
// 5

// Count occurrences
let fruits = ["apple", "banana", "apple", "cherry"];
let count = fruits.reduce((acc, f) => {
  acc[f] = (acc[f] || 0) + 1;
  return acc;
}, {});
// { apple: 2, banana: 1, cherry: 1 }</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m9-ex3',
                  title: 'Test: Sum with Reduce',
                  description: 'Write a function <code>sumWithReduce</code> that sums an array using reduce.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function sumWithReduce(numbers) {\n  // Use reduce()\n  \n}',
                  solutionCode: 'function sumWithReduce(numbers) {\n  return numbers.reduce((acc, n) => acc + n, 0);\n}',
                  testCode: `
describe("sumWithReduce", function() {
  it("sums [1,2,3,4,5]", function() { assert.equals(sumWithReduce([1,2,3,4,5]), 15); });
  it("sums empty array", function() { assert.equals(sumWithReduce([]), 0); });
  it("sums negatives", function() { assert.equals(sumWithReduce([-1, 1]), 0); });
});`,
                },
              ],
            },
            {
              title: 'Module 9 Quiz — Map/Filter/Reduce',
              type: 'quiz',
              content: '<p>Test your advanced array method knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What does map() return?', type: 'multiple_choice', options: ['Original array mutated', 'A new array of same length', 'A single value', 'A filtered array'], correctOptionIndex: 1, explanation: 'map() returns a new array with transformed elements.' },
                { questionText: 'What does filter() return?', type: 'multiple_choice', options: ['All elements', 'First matching element', 'New array with matching elements', 'Boolean'], correctOptionIndex: 2, explanation: 'filter() returns a new array with elements that pass the test.' },
                { questionText: 'What does reduce() return?', type: 'multiple_choice', options: ['An array', 'Any single value', 'A number', 'A boolean'], correctOptionIndex: 1, explanation: 'reduce() can return any type — number, string, object, array, etc.' },
                { questionText: 'Do map and filter mutate the original array?', type: 'multiple_choice', options: ['Yes', 'No', 'Only map', 'Only filter'], correctOptionIndex: 1, explanation: 'Both return new arrays without mutating the original.' },
                { questionText: 'What is the initial value parameter in reduce?', type: 'multiple_choice', options: ['Optional default value', 'Required starting value', 'The first element', 'The index'], correctOptionIndex: 0, explanation: 'The initial value is optional but recommended.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 10: ES6+ Features
        // =====================================================================
        {
          title: 'Module 10: ES6+ Features',
          description: 'Destructuring, spread/rest, default params, and modern syntax.',
          order: 10,
          lessons: [
            {
              title: 'Destructuring Arrays & Objects',
              type: 'article',
              content: `<h2>Destructuring</h2>
<p>Extract values from arrays/objects into variables:</p>
<pre><code>// Array destructuring
let [first, second, ...rest] = [1, 2, 3, 4, 5];
console.log(first);  // 1
console.log(second); // 2
console.log(rest);   // [3, 4, 5]

// Object destructuring
let person = { name: "Alice", age: 25, city: "Kigali" };
let { name, age } = person;
console.log(name); // "Alice"

// Rename while destructuring
let { name: fullName, city: location } = person;
console.log(fullName); // "Alice"</code></pre>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m10-ex1',
                  title: 'Test: Swap Variables with Destructuring',
                  description: 'Write a function <code>swap</code> that takes [a, b] and returns [b, a] using destructuring.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function swap(arr) {\n  // Use destructuring to swap\n  \n}',
                  solutionCode: 'function swap(arr) {\n  const [a, b] = arr;\n  return [b, a];\n}',
                  testCode: `
describe("swap", function() {
  it("swaps [1,2]", function() { assert.equals(swap([1,2]).join(","), "2,1"); });
  it("swaps [3,4]", function() { assert.equals(swap([3,4]).join(","), "4,3"); });
});`,
                },
                {
                  id: 'js-adv-m10-ex2',
                  title: 'Extract Name from Object',
                  description: 'Write a function <code>getName</code> that uses destructuring to extract the "name" property from an object.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function getName(obj) {\n  // Use destructuring in the parameter\n  \n}',
                  solutionCode: 'function getName({ name }) {\n  return name;\n}',
                  testCode: `
describe("getName", function() {
  it('gets name from {name:"Alice"}', function() { assert.equals(getName({name:"Alice"}), "Alice"); });
  it('gets name from {name:"Bob"}', function() { assert.equals(getName({name:"Bob"}), "Bob"); });
});`,
                },
              ],
            },
            {
              title: 'Spread & Rest Operators',
              type: 'article',
              content: `<h2>Spread (...) — Expand</h2>
<pre><code>// Copy arrays
let arr1 = [1, 2, 3];
let arr2 = [...arr1]; // [1, 2, 3]

// Combine arrays
let combined = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]

// Copy objects
let obj1 = { a: 1, b: 2 };
let obj2 = { ...obj1, c: 3 }; // { a: 1, b: 2, c: 3 }

// Override properties
let obj3 = { ...obj1, b: 99 }; // { a: 1, b: 99 }</code></pre>

<h2>Rest (...) — Collect</h2>
<pre><code>function logAll(first, ...rest) {
  console.log(first); // First argument
  console.log(rest);  // Array of remaining arguments
}</code></pre>`,
              duration: 10,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m10-ex3',
                  title: 'Test: Merge Objects with Spread',
                  description: 'Write a function <code>merge</code> that merges two objects. If same key exists, second object wins.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function merge(obj1, obj2) {\n  // Use spread\n  \n}',
                  solutionCode: 'function merge(obj1, obj2) {\n  return { ...obj1, ...obj2 };\n}',
                  testCode: `
describe("merge", function() {
  it("merges {a:1} and {b:2}", function() {
    const r = merge({a:1}, {b:2});
    assert.equals(r.a, 1);
    assert.equals(r.b, 2);
  });
  it("second wins on conflict", function() {
    const r = merge({a:1}, {a:99});
    assert.equals(r.a, 99);
  });
});`,
                },
              ],
            },
            {
              title: 'Module 10 Quiz — ES6+',
              type: 'quiz',
              content: '<p>Test your ES6+ knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What does the spread operator (...) do?', type: 'multiple_choice', options: ['Iterates', 'Expands elements', 'Collects elements', 'Both B and D'], correctOptionIndex: 2, explanation: 'Spread expands iterables into individual elements.' },
                { questionText: 'How do you copy an array using spread?', type: 'multiple_choice', options: ['copy(arr)', '[...arr]', 'arr.copy()', '[arr]'], correctOptionIndex: 1, explanation: '[...arr] creates a shallow copy.' },
                { questionText: 'What does const [a, b] = [1, 2, 3] assign to a?', type: 'multiple_choice', options: ['[1, 2, 3]', '1', '2', 'undefined'], correctOptionIndex: 1, explanation: 'a gets the first element (1).' },
                { questionText: 'What is rest vs spread?', type: 'multiple_choice', options: ['Same thing', 'Rest collects, spread expands', 'Rest expands, spread collects', 'Both collect'], correctOptionIndex: 1, explanation: 'Rest collects into an array, spread expands from an array.' },
                { questionText: 'Can you destructure nested objects?', type: 'multiple_choice', options: ['Yes', 'No'], correctOptionIndex: 0, explanation: 'Nested destructuring works: const {a: {b}} = obj.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 11: Scope & Closures
        // =====================================================================
        {
          title: 'Module 11: Scope & Closures',
          description: 'Understand JavaScript scope, hoisting, and closures.',
          order: 11,
          lessons: [
            {
              title: 'Global, Function, and Block Scope',
              type: 'article',
              content: `<h2>Scope in JavaScript</h2>
<h3>Global Scope</h3>
<pre><code>let globalVar = "I'm everywhere";
function test() {
  console.log(globalVar); // Accessible
}</code></pre>

<h3>Function Scope (var)</h3>
<pre><code>function test() {
  var x = 1;
}
console.log(x); // Error! x is not defined</code></pre>

<h3>Block Scope (let, const)</h3>
<pre><code>if (true) {
  let y = 2;
  const z = 3;
}
console.log(y); // Error! y is not defined</code></pre>

<p><strong>Hoisting:</strong> var declarations are moved to the top of their scope. let and const are hoisted but not initialized (Temporal Dead Zone).</p>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m11-ex1',
                  title: 'Fix: Block Scope Bug',
                  description: 'Fix this code so it logs 0, 1, 2 correctly. The bug is a scoping issue with var.',
                  language: 'javascript',
                  type: 'fix',
                  initialCode: 'for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100);\n}\n// This logs 3, 3, 3 instead of 0, 1, 2',
                  solutionCode: 'for (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100);\n}',
                  testCode: '',
                  expectedOutput: '',
                },
                {
                  id: 'js-adv-m11-ex2',
                  title: 'Test: Counter with Closure',
                  description: 'Write a function <code>createCounter</code> that returns an object with <code>increment()</code> and <code>getValue()</code> methods. The counter value should be private (in closure).',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function createCounter() {\n  let count = 0;\n  return {\n    increment() { count++; },\n    getValue() { return count; }\n  };\n}',
                  solutionCode: 'function createCounter() {\n  let count = 0;\n  return {\n    increment() { count++; },\n    getValue() { return count; }\n  };\n}\n\nconst c = createCounter();\nc.increment();\nc.increment();\nconsole.log(c.getValue());',
                  testCode: `
describe("createCounter", function() {
  it("starts at 0", function() {
    const c = createCounter();
    assert.equals(c.getValue(), 0);
  });
  it("increments correctly", function() {
    const c = createCounter();
    c.increment();
    assert.equals(c.getValue(), 1);
    c.increment();
    c.increment();
    assert.equals(c.getValue(), 3);
  });
  it("isolated instances", function() {
    const a = createCounter();
    const b = createCounter();
    a.increment();
    a.increment();
    b.increment();
    assert.equals(a.getValue(), 2);
    assert.equals(b.getValue(), 1);
  });
});`,
                },
              ],
            },
            {
              title: 'Module 11 Quiz — Scope & Closures',
              type: 'quiz',
              content: '<p>Test your scope and closures knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is a closure?', type: 'multiple_choice', options: ['A type of loop', 'A function with access to outer scope', 'An error type', 'A data structure'], correctOptionIndex: 1, explanation: 'A closure is a function that remembers its outer scope variables.' },
                { questionText: 'Which keywords are block-scoped?', type: 'multiple_choice', options: ['var only', 'let and const', 'let, const, and var', 'Only let'], correctOptionIndex: 1, explanation: 'let and const are block-scoped; var is function-scoped.' },
                { questionText: 'What is the Temporal Dead Zone?', type: 'multiple_choice', options: ['Where let/const exist but cannot be accessed', 'A bug in older JS', 'A memory management feature', 'A type of error'], correctOptionIndex: 0, explanation: 'TDZ is the period between entering scope and variable declaration.' },
                { questionText: 'Can closures be used for data privacy?', type: 'multiple_choice', options: ['Yes', 'No'], correctOptionIndex: 0, explanation: 'Closures create private variables that cannot be accessed from outside.' },
                { questionText: 'What does hoisting mean?', type: 'multiple_choice', options: ['Moving code to the top', 'Declarations moved to top', 'Values moved to top', 'Code runs faster'], correctOptionIndex: 1, explanation: 'Hoisting moves declarations (not assignments) to the top of scope.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 12: Callbacks & Higher-Order Functions
        // =====================================================================
        {
          title: 'Module 12: Callbacks & Higher-Order Functions',
          description: 'Master passing functions as arguments.',
          order: 12,
          lessons: [
            {
              title: 'Callbacks and Higher-Order Functions',
              type: 'article',
              content: `<h2>Higher-Order Functions</h2>
<p>A higher-order function is a function that takes another function as an argument, or returns a function.</p>
<h3>Callbacks</h3>
<pre><code>function processUserData(user, callback) {
  const processed = { ...user, processed: true };
  callback(processed);
}

processUserData({ name: "Alice" }, (user) => {
  console.log(user.processed); // true
});</code></pre>

<h3>Function Factory (returns a function)</h3>
<pre><code>function createMultiplier(factor) {
  return function(number) {
    return number * factor;
  };
}

const double = createMultiplier(2);
console.log(double(5)); // 10
const triple = createMultiplier(3);
console.log(triple(5)); // 15</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m12-ex1',
                  title: 'Test: Create Multiplier Factory',
                  description: 'Write a function <code>createMultiplier</code> that takes a factor and returns a function that multiplies any number by that factor.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function createMultiplier(factor) {\n  // Return a function that multiplies its input by factor\n  \n}',
                  solutionCode: 'function createMultiplier(factor) {\n  return function(n) {\n    return n * factor;\n  };\n}',
                  testCode: `
describe("createMultiplier", function() {
  it("double multiplies by 2", function() {
    const double = createMultiplier(2);
    assert.equals(double(5), 10);
    assert.equals(double(3), 6);
  });
  it("triple multiplies by 3", function() {
    const triple = createMultiplier(3);
    assert.equals(triple(5), 15);
  });
});`,
                },
                {
                  id: 'js-adv-m12-ex2',
                  title: 'Write: Timing Decorator',
                  description: 'Write a higher-order function <code>timed</code> that takes a function and returns a new function. The returned function logs "Execution time: Xms" and returns the original result. (Use Date.now())',
                  language: 'javascript',
                  type: 'write',
                  initialCode: 'function timed(fn) {\n  // Return a function that times execution\n  \n}\n\n// Example:\nconst slowAdd = timed((a, b) => {\n  for(let i = 0; i < 1000000; i++) {} // simulate delay\n  return a + b;\n});\nconsole.log(slowAdd(3, 4));',
                  solutionCode: 'function timed(fn) {\n  return function(...args) {\n    const start = Date.now();\n    const result = fn(...args);\n    const end = Date.now();\n    console.log("Execution time: " + (end - start) + "ms");\n    return result;\n  };\n}',
                  testCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Module 12 Quiz — Callbacks & HOFs',
              type: 'quiz',
              content: '<p>Test your higher-order function knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is a higher-order function?', type: 'multiple_choice', options: ['A function that returns a number', 'A function that takes or returns another function', 'A fast function', 'A function with many parameters'], correctOptionIndex: 1, explanation: 'HOFs operate on other functions.' },
                { questionText: 'What is a callback?', type: 'multiple_choice', options: ['A function passed to another function', 'A delayed function', 'A recursive function', 'A return value'], correctOptionIndex: 0, explanation: 'A callback is a function passed as an argument.' },
                { questionText: 'What does a function factory do?', type: 'multiple_choice', options: ['Calls functions', 'Returns new functions', 'Destroys functions', 'Counts functions'], correctOptionIndex: 1, explanation: 'A factory function creates and returns new functions.' },
                { questionText: 'Is setTimeout a higher-order function?', type: 'multiple_choice', options: ['Yes', 'No'], correctOptionIndex: 0, explanation: 'setTimeout takes a callback function, making it a HOF.' },
                { questionText: 'Can array methods like map be considered HOFs?', type: 'multiple_choice', options: ['Yes', 'No'], correctOptionIndex: 0, explanation: 'map takes a callback function, so yes, it is a HOF.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 13: Promises & Async/Await
        // =====================================================================
        {
          title: 'Module 13: Promises & Async/Await',
          description: 'Master asynchronous JavaScript.',
          order: 13,
          lessons: [
            {
              title: 'Understanding Promises',
              type: 'article',
              content: `<h2>Promises</h2>
<p>A Promise represents a value that might be available now, later, or never.</p>
<pre><code>// Creating a Promise
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Using .then()
wait(1000).then(() => console.log("1 second passed"));

// Chaining
fetchUser(id)
  .then(user => fetchPosts(user.id))
  .then(posts => console.log(posts))
  .catch(error => console.error(error))
  .finally(() => console.log("Done"));

// Promise.all — wait for all
Promise.all([fetchUser(1), fetchUser(2)])
  .then(([user1, user2]) => console.log(user1, user2));</code></pre>`,
              duration: 16,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m13-ex1',
                  title: 'Test: Delay Function',
                  description: 'Write a function <code>delay(ms, value)</code> that returns a Promise which resolves after ms milliseconds with the given value.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function delay(ms, value) {\n  // Return a Promise that resolves with value after ms\n  \n}',
                  solutionCode: 'function delay(ms, value) {\n  return new Promise(resolve => setTimeout(() => resolve(value), ms));\n}',
                  testCode: `
describe("delay", function() {
  it("resolves with correct value", async function() {
    const result = await delay(10, "hello");
    assert.equals(result, "hello");
  });
  it("respects timing", async function() {
    const start = Date.now();
    await delay(50, "ok");
    const elapsed = Date.now() - start;
    assert.isTrue(elapsed >= 40, "took at least 40ms");
  });
});`,
                },
              ],
            },
            {
              title: 'Async/Await — Modern Asynchronous Code',
              type: 'article',
              content: `<h2>Async/Await</h2>
<p><code>async/await</code> is syntactic sugar over Promises, making async code read like synchronous code.</p>
<pre><code>// async function always returns a Promise
async function getUser(id) {
  const response = await fetch(\`/api/users/\${id}\`);
  const user = await response.json();
  return user;
}

// Error handling with try/catch
async function loadData() {
  try {
    const user = await getUser(1);
    const posts = await getPosts(user.id);
    return { user, posts };
  } catch (error) {
    console.error("Failed to load:", error);
    return null;
  }
}</code></pre>
<h3>Parallel Execution</h3>
<pre><code>// Sequential (slower)
const a = await fetchA();
const b = await fetchB();

// Parallel (faster)
const [a, b] = await Promise.all([fetchA(), fetchB()]);</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m13-ex2',
                  title: 'Test: Fetch User Data (Async)',
                  description: 'Write an async function <code>getUserData</code> that uses <code>delay</code> to simulate fetching: first get user (takes 10ms), then get their posts (takes 10ms). Return { user, posts }.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: '// delay is already available\nfunction delay(ms, value) {\n  return new Promise(resolve => setTimeout(() => resolve(value), ms));\n}\n\nasync function getUserData(userId) {\n  // Use await for both calls\n  const user = await delay(10, { id: userId, name: "User " + userId });\n  const posts = await delay(10, [{ id: 1, title: "Post 1" }]);\n  return { user, posts };\n}',
                  solutionCode: 'async function getUserData(userId) {\n  const user = await delay(10, { id: userId, name: "User " + userId });\n  const posts = await delay(10, [{ id: 1, title: "Post 1" }]);\n  return { user, posts };\n}',
                  testCode: `
describe("getUserData", function() {
  it("returns user and posts", async function() {
    const result = await getUserData(5);
    assert.equals(result.user.id, 5);
    assert.equals(result.posts.length, 1);
  });
  it("takes at least 20ms total", async function() {
    const start = Date.now();
    await getUserData(1);
    const elapsed = Date.now() - start;
    assert.isTrue(elapsed >= 15, "took at least 15ms for two delays");
  });
});`,
                },
              ],
            },
            {
              title: 'Module 13 Quiz — Promises & Async',
              type: 'quiz',
              content: '<p>Test your async knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What does the await keyword do?', type: 'multiple_choice', options: ['Creates a promise', 'Pauses until promise resolves', 'Rejects a promise', 'Returns a promise'], correctOptionIndex: 1, explanation: 'await pauses execution until the promise settles.' },
                { questionText: 'What keyword makes a function return a Promise?', type: 'multiple_choice', options: ['promise', 'await', 'async', 'yield'], correctOptionIndex: 2, explanation: 'async functions always return a Promise.' },
                { questionText: 'How do you handle errors in async/await?', type: 'multiple_choice', options: ['.catch()', 'try/catch', 'error()', 'handle()'], correctOptionIndex: 1, explanation: 'Use try/catch blocks with async/await.' },
                { questionText: 'What does Promise.all do?', type: 'multiple_choice', options: ['Runs sequentially', 'Runs in parallel and waits for all', 'Runs fastest only', 'Runs one at a time'], correctOptionIndex: 1, explanation: 'Promise.all runs all promises in parallel.' },
                { questionText: 'Can you use await outside an async function?', type: 'multiple_choice', options: ['Yes', 'No', 'Only in Node.js', 'Only in browsers'], correctOptionIndex: 1, explanation: 'await must be inside an async function (or top-level in modules).' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 14: Error Handling
        // =====================================================================
        {
          title: 'Module 14: Error Handling',
          description: 'Learn to handle errors gracefully.',
          order: 14,
          lessons: [
            {
              title: 'Try/Catch/Finally',
              type: 'article',
              content: `<h2>Error Handling</h2>
<pre><code>try {
  // Code that might throw
  let result = riskyOperation();
  console.log(result);
} catch (error) {
  // Handle the error
  console.error("Something went wrong:", error.message);
} finally {
  // Always runs
  console.log("Cleanup complete");
}

// Throwing custom errors
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero is not allowed");
  }
  return a / b;
}</code></pre>
<h3>Error Types</h3>
<ul>
<li><code>Error</code> — generic</li>
<li><code>TypeError</code> — wrong type</li>
<li><code>ReferenceError</code> — undefined variable</li>
<li><code>SyntaxError</code> — syntax error</li>
<li><code>RangeError</code> — out of range</li>
</ul>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m14-ex1',
                  title: 'Test: Safe Divide',
                  description: 'Write a function <code>safeDivide</code> that takes a and b. If b is 0, throw a new Error with message "Division by zero". Otherwise return a/b.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function safeDivide(a, b) {\n  // Throw error if b is 0, otherwise return a/b\n  \n}',
                  solutionCode: 'function safeDivide(a, b) {\n  if (b === 0) {\n    throw new Error("Division by zero");\n  }\n  return a / b;\n}',
                  testCode: `
describe("safeDivide", function() {
  it("divides normally", function() { assert.equals(safeDivide(10, 2), 5); });
  it("throws on division by zero", function() {
    try { safeDivide(5, 0); assert.fail("should throw"); }
    catch (e) { assert.equals(e.message, "Division by zero"); }
  });
});`,
                },
                {
                  id: 'js-adv-m14-ex2',
                  title: 'Write: Parse JSON Safely',
                  description: 'Write a function <code>safeParseJSON</code> that takes a string and tries to parse it as JSON. If parsing fails, return null instead of throwing.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function safeParseJSON(str) {\n  // Use try/catch with JSON.parse\n  \n}',
                  solutionCode: 'function safeParseJSON(str) {\n  try {\n    return JSON.parse(str);\n  } catch {\n    return null;\n  }\n}',
                  testCode: `
describe("safeParseJSON", function() {
  it('parses valid JSON', function() { assert.equals(safeParseJSON('{"a":1}').a, 1); });
  it('returns null for invalid JSON', function() { assert.equals(safeParseJSON("not json"), null); });
});`,
                },
              ],
            },
            {
              title: 'Module 14 Quiz — Error Handling',
              type: 'quiz',
              content: '<p>Test your error handling knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What block handles exceptions?', type: 'multiple_choice', options: ['catch', 'finally', 'throw', 'error'], correctOptionIndex: 0, explanation: 'catch handles exceptions in try/catch.' },
                { questionText: 'What block always runs regardless of errors?', type: 'multiple_choice', options: ['try', 'catch', 'finally', 'all'], correctOptionIndex: 2, explanation: 'finally always executes.' },
                { questionText: 'How do you create a custom error?', type: 'multiple_choice', options: ['throw "error"', 'throw new Error("msg")', 'create Error("msg")', 'new throw Error()'], correctOptionIndex: 1, explanation: 'Use throw new Error("message").' },
                { questionText: 'What error type is thrown when a variable is undefined?', type: 'multiple_choice', options: ['TypeError', 'SyntaxError', 'ReferenceError', 'RangeError'], correctOptionIndex: 2, explanation: 'ReferenceError for undefined variable access.' },
                { questionText: 'Can you have multiple catch blocks?', type: 'multiple_choice', options: ['Yes', 'No', 'Only in async', 'Only in strict mode'], correctOptionIndex: 1, explanation: 'JavaScript has one catch block per try.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 15: DOM Manipulation (HTML)
        // =====================================================================
        {
          title: 'Module 15: DOM Manipulation & Events',
          description: 'Learn to interact with HTML pages using JavaScript.',
          order: 15,
          lessons: [
            {
              title: 'Selecting and Modifying Elements',
              type: 'article',
              content: `<h2>DOM Basics</h2>
<pre><code>// Selecting elements
document.getElementById("main")
document.querySelector(".class")
document.querySelectorAll("div")
  
// Modifying content
element.textContent = "New text"
element.innerHTML = "<b>Bold text</b>"
  
// Modifying styles
element.style.color = "red"
element.classList.add("active")
element.classList.remove("hidden")
  
// Creating elements
const div = document.createElement("div")
div.textContent = "Hello"
document.body.appendChild(div)</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m15-ex1',
                  title: 'Build a Color Changer',
                  description: 'Create an HTML page with a button and a colored box. Clicking the button changes the box color to a random color.',
                  language: 'html',
                  type: 'write',
                  initialCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Color Changer</title>\n  <style>\n    body { font-family: Arial; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 40px; }\n    #box { width: 200px; height: 200px; background: #3498db; border-radius: 12px; transition: background 0.3s; }\n    button { padding: 12px 24px; font-size: 16px; cursor: pointer; border: none; background: #2ecc71; color: white; border-radius: 8px; }\n    button:hover { background: #27ae60; }\n  </style>\n</head>\n<body>\n  <div id="box"></div>\n  <button onclick="changeColor()">Change Color</button>\n  <script>\n    function changeColor() {\n      const box = document.getElementById("box");\n      const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"];\n      const randomColor = colors[Math.floor(Math.random() * colors.length)];\n      box.style.background = randomColor;\n    }\n  </script>\n</body>\n</html>',
                  solutionCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Color Changer</title>\n  <style>\n    body { font-family: Arial; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 40px; }\n    #box { width: 200px; height: 200px; background: #3498db; border-radius: 12px; transition: background 0.3s; }\n    button { padding: 12px 24px; font-size: 16px; cursor: pointer; border: none; background: #2ecc71; color: white; border-radius: 8px; }\n    button:hover { background: #27ae60; }\n  </style>\n</head>\n<body>\n  <div id="box"></div>\n  <button onclick="changeColor()">Change Color</button>\n  <script>\n    function changeColor() {\n      const box = document.getElementById("box");\n      const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"];\n      const randomColor = colors[Math.floor(Math.random() * colors.length)];\n      box.style.background = randomColor;\n    }\n  </script>\n</body>\n</html>',
                  testCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Module 15 Quiz — DOM',
              type: 'quiz',
              content: '<p>Test your DOM knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'How do you select an element by ID?', type: 'multiple_choice', options: ['getElementById()', 'querySelector()', 'Both work with #', 'All the above'], correctOptionIndex: 3, explanation: 'Both getElementById and querySelector("#id") work.' },
                { questionText: 'What property changes the HTML content of an element?', type: 'multiple_choice', options: ['textContent', 'innerHTML', 'value', 'Both A and B'], correctOptionIndex: 3, explanation: 'textContent for text, innerHTML for HTML.' },
                { questionText: 'How do you add a CSS class to an element?', type: 'multiple_choice', options: ['element.className = "x"', 'element.classList.add("x")', 'element.addClass("x")', 'element.style.class = "x"'], correctOptionIndex: 1, explanation: 'classList.add() is the modern way.' },
                { questionText: 'What method creates a new HTML element?', type: 'multiple_choice', options: ['createElement()', 'newElement()', 'makeElement()', 'buildElement()'], correctOptionIndex: 0, explanation: 'document.createElement() creates new elements.' },
                { questionText: 'What event fires when a user clicks an element?', type: 'multiple_choice', options: ['hover', 'click', 'press', 'tap'], correctOptionIndex: 1, explanation: 'The click event fires on mouse click.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 16: Final Project
        // =====================================================================
        {
          title: 'Module 16: Final Project — Task Manager App',
          description: 'Build a complete task manager combining all your JavaScript skills.',
          order: 16,
          lessons: [
            {
              title: 'Final Project: Build a Task Manager',
              type: 'article',
              content: `<h2>Final Project: Task Manager</h2>
<p>Build a complete task manager using HTML, CSS, and JavaScript.</p>
<h3>Requirements:</h3>
<ul>
<li>Add tasks with a title and description</li>
<li>Mark tasks as complete</li>
<li>Delete tasks</li>
<li>Filter tasks (All / Active / Completed)</li>
<li>Save tasks to localStorage</li>
<li>Load tasks from localStorage on startup</li>
</ul>
<h3>What You'll Practice:</h3>
<ul>
<li>DOM manipulation</li>
<li>Event handling</li>
<li>Array methods (map, filter)</li>
<li>Arrow functions</li>
<li>Template literals</li>
<li>localStorage API</li>
<li>Object manipulation</li>
</ul>`,
              duration: 20,
              resources: [],
              codeExercises: [
                {
                  id: 'js-adv-m16-ex1',
                  title: 'Build the Task Manager',
                  description: 'Build a complete task manager with add, complete, delete, filter, and localStorage persistence.',
                  language: 'html',
                  type: 'write',
                  initialCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Task Manager</title>\n  <style>\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n    body { font-family: -apple-system, Arial; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }\n    h1 { text-align: center; color: #333; margin-bottom: 20px; }\n    .add-task { display: flex; gap: 8px; margin-bottom: 20px; }\n    .add-task input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }\n    .add-task button { padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }\n    .add-task button:hover { background: #2980b9; }\n    .filters { display: flex; gap: 8px; margin-bottom: 15px; }\n    .filters button { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; }\n    .filters button.active { background: #3498db; color: white; border-color: #3498db; }\n    .task { display: flex; align-items: center; gap: 10px; padding: 12px; background: white; border-radius: 8px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n    .task.completed { opacity: 0.6; }\n    .task.completed .task-title { text-decoration: line-through; }\n    .task-title { flex: 1; font-size: 14px; }\n    .task-actions { display: flex; gap: 4px; }\n    .task-actions button { padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }\n    .btn-complete { background: #2ecc71; color: white; }\n    .btn-delete { background: #e74c3c; color: white; }\n    .stats { text-align: center; color: #888; font-size: 13px; margin-top: 15px; }\n  </style>\n</head>\n<body>\n  <h1>📋 Task Manager</h1>\n  <div class="add-task">\n    <input id="taskInput" placeholder="Enter a new task..." />\n    <button onclick="addTask()">Add</button>\n  </div>\n  <div class="filters">\n    <button class="active" onclick="setFilter(\'all\', this)">All</button>\n    <button onclick="setFilter(\'active\', this)">Active</button>\n    <button onclick="setFilter(\'completed\', this)">Completed</button>\n  </div>\n  <div id="taskList"></div>\n  <div class="stats" id="stats"></div>\n\n  <script>\n    let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");\n    let currentFilter = "all";\n\n    function saveTasks() {\n      localStorage.setItem("tasks", JSON.stringify(tasks));\n    }\n\n    function renderTasks() {\n      const filtered = tasks.filter(t => {\n        if (currentFilter === "active") return !t.completed;\n        if (currentFilter === "completed") return t.completed;\n        return true;\n      });\n      \n      const list = document.getElementById("taskList");\n      list.innerHTML = filtered.map((t, i) => \`\n        <div class="task \${t.completed ? "completed" : ""}">\n          <span class="task-title">\${t.title}</span>\n          <div class="task-actions">\n            <button class="btn-complete" onclick="toggleTask(\${t.id})">\n              \${t.completed ? "↩" : "✓"}\n            </button>\n            <button class="btn-delete" onclick="deleteTask(\${t.id})">✕</button>\n          </div>\n        </div>\n      \`).join("");\n      \n      document.getElementById("stats").textContent = \`\${tasks.filter(t => !t.completed).length} remaining of \${tasks.length} tasks\`;\n    }\n\n    function addTask() {\n      const input = document.getElementById("taskInput");\n      const title = input.value.trim();\n      if (!title) return;\n      tasks.push({ id: Date.now(), title, completed: false });\n      input.value = "";\n      saveTasks();\n      renderTasks();\n    }\n\n    function toggleTask(id) {\n      const task = tasks.find(t => t.id === id);\n      if (task) { task.completed = !task.completed; saveTasks(); renderTasks(); }\n    }\n\n    function deleteTask(id) {\n      tasks = tasks.filter(t => t.id !== id);\n      saveTasks();\n      renderTasks();\n    }\n\n    function setFilter(filter, btn) {\n      currentFilter = filter;\n      document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));\n      btn.classList.add("active");\n      renderTasks();\n    }\n\n    renderTasks();\n  </script>\n</body>\n</html>',
                  solutionCode: '',
                  testCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Final Exam — JavaScript Mastery',
              type: 'assignment',
              content: '<p>This final exam tests everything you learned in the Complete JavaScript Mastery course.</p>',
              isAssignment: true,
              requiredAssignment: true,
              assignmentDescription: 'Complete the final exam covering all JavaScript topics from variables to advanced.',
              assignmentDeliverables: ['Completed exam with minimum 60% score'],
              assignmentQuestions: [
                { questionText: 'Write a function called findMissingNumber that takes an array of consecutive numbers from 1 to n with one number missing, and returns the missing number.', type: 'open', points: 15 },
                { questionText: 'Write a function called isPalindrome that checks if a string reads the same forward and backward.', type: 'open', points: 15 },
                { questionText: 'Use reduce() to write a function called groupBy that takes an array and a key function, and returns an object grouping items by the key.', type: 'open', points: 15 },
                { questionText: 'Write an async function fetchUserAndPosts that simulates fetching a user (10ms) and their posts (10ms) in parallel using Promise.all.', type: 'open', points: 15 },
                { questionText: 'Explain closures with an example. Write a function createCounter that has private state and exposes increment() and getValue().', type: 'open', points: 15 },
                { questionText: 'Write a function deepClone that creates a deep copy of an object (handles nested objects and arrays).', type: 'open', points: 15 },
                { questionText: 'Write a function debounce that takes a function and a delay, and returns a debounced version that only calls the original after the delay since the last call.', type: 'open', points: 10 },
              ],
              assignmentConfig: { timeLimit: 120, allowRetakes: false, mode: 'exam', disableRightClick: true },
              duration: 120,
              resources: [],
            },
          ],
        },
      ],
    };

    const existing = await Course.findOne({ title: coursePayload.title });
    if (existing) {
      Object.assign(existing, coursePayload);
      await existing.save();
      console.log('✅ Updated Comprehensive JavaScript course');
    } else {
      await new Course(coursePayload).save();
      console.log('✅ Created Comprehensive JavaScript course');
    }

    // Count exercises
    const saved = await Course.findOne({ title: coursePayload.title }).lean() as any;
    if (!saved) throw new Error('Course not found after saving');
    let totalExercises = 0;
    let totalLessons = 0;
    for (const mod of saved.modules) {
      for (const les of mod.lessons) {
        totalLessons++;
        if (les.codeExercises) totalExercises += les.codeExercises.length;
      }
    }

    console.log(`\n📊 Course Stats:`);
    console.log(`   📚 Modules: ${saved.modules.length}`);
    console.log(`   📖 Lessons: ${totalLessons}`);
    console.log(`   💻 Code Exercises: ${totalExercises}`);
    console.log(`   📝 Quizzes: ${saved.modules.reduce((sum: number, m: any) => sum + m.lessons.filter((l: any) => l.type === 'quiz').length, 0)}`);
    console.log(`   📋 Assignments: ${saved.modules.reduce((sum: number, m: any) => sum + m.lessons.filter((l: any) => l.isAssignment).length, 0)}`);
    console.log('\n🏁 Course seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedComprehensiveJSCourse();
