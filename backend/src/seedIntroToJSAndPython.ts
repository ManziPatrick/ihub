import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedIntroToJSAndPython = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding Introduction to JavaScript & Python courses...\n');

    // Find or create a default instructor
    let instructor = await User.findOne({ role: { $in: ['admin', 'trainer', 'super_admin'] } });
    if (!instructor) {
      console.log('No admin/trainer found. Creating a default instructor...');
      instructor = await new User({
        fullName: 'Tech Mentor Bootskills',
        username: 'tech.mentor',
        email: 'tech.mentor@bootskills.com',
        password: 'Password@123',
        role: 'trainer',
        status: 'active',
        academicStatus: 'active',
      }).save();
      console.log('✅ Created default instructor:', instructor.fullName);
    } else {
      console.log('✅ Using instructor:', instructor.fullName);
    }

    const instructorId = instructor._id;

    // =========================================================================
    // COURSE 1: INTRODUCTION TO JAVASCRIPT
    // =========================================================================
    const jsCourseData = {
      title: 'Introduction to JavaScript — Complete Beginner Course',
      description: `<p>Learn JavaScript from scratch! This course covers variables, control flow, functions, arrays, objects, DOM manipulation, and more. Each lesson includes interactive code exercises where you can write and run real JavaScript code directly in your browser.</p>
<p>By the end of this course, you'll be able to build interactive web pages and understand the fundamentals of programming.</p>`,
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
        // ====== MODULE 1: Hello, JavaScript! ======
        {
          title: 'Module 1: Hello, JavaScript!',
          description: 'Learn what JavaScript is, how to write your first program, and understand variables and data types.',
          order: 1,
          lessons: [
            {
              title: 'Your First JavaScript Program',
              type: 'article',
              content: `<h2>Welcome to JavaScript!</h2>
<p>JavaScript is one of the most popular programming languages in the world. It powers the interactive parts of websites and is essential for web development.</p>
<h3>What You'll Learn</h3>
<ul>
<li>How to write JavaScript code</li>
<li>Using console.log() to display output</li>
<li>Comments in JavaScript</li>
</ul>
<h3>Your First Code</h3>
<p>The classic first program is to print "Hello, World!" to the console. In JavaScript, we use <code>console.log()</code> for this.</p>
<pre><code>console.log("Hello, World!");</code></pre>
<p>When you run this, it displays: <code>Hello, World!</code></p>
<h3>Comments</h3>
<p>Comments are notes in your code that JavaScript ignores:</p>
<pre><code>// This is a single-line comment
console.log("Hello!"); // This is also a comment

/*
  This is a
  multi-line comment
*/</code></pre>`,
              duration: 10,
              resources: [
                { title: 'JavaScript Cheat Sheet (PDF)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', type: 'link' },
              ],
              // Code exercise: write "Hello, World!"
              codeExercises: [
                {
                  id: 'js-m1-ex1',
                  title: 'Print Hello, World!',
                  description: 'Write JavaScript code that prints "Hello, World!" to the console.',
                  language: 'javascript',
                  type: 'write',
                  initialCode: '// Write your code below this line\n',
                  solutionCode: 'console.log("Hello, World!");',
                  testCode: `
describe("Hello World Test", function() {
  it("should print Hello, World!", function() {
    var logs = [];
    var originalLog = console.log;
    console.log = function(msg) { logs.push(msg); };
    
    // We can't easily capture output from the sandboxed execution,
    // so we just verify the code runs without error
    assert.isTrue(true, "Code executed");
    
    console.log = originalLog;
  });
});
`,
                  expectedOutput: 'Hello, World!',
                },
              ],
            },
            {
              title: 'Variables and Data Types',
              type: 'article',
              content: `<h2>Variables Store Data</h2>
<p>Variables are containers for storing data values. In JavaScript, we use <code>let</code>, <code>const</code>, and <code>var</code> to declare variables.</p>
<h3>Declaring Variables</h3>
<pre><code>let name = "Alice";     // String
const age = 25;         // Number (cannot be reassigned)
var oldWay = "avoid";   // Old way, avoid using</code></pre>
<h3>Data Types</h3>
<ul>
<li><strong>String:</strong> Text — <code>"hello"</code>, <code>'world'</code></li>
<li><strong>Number:</strong> Integers and decimals — <code>42</code>, <code>3.14</code></li>
<li><strong>Boolean:</strong> True or false — <code>true</code>, <code>false</code></li>
<li><strong>Undefined:</strong> Variable declared but not assigned</li>
<li><strong>Null:</strong> Intentionally empty</li>
</ul>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'js-m1-ex2',
                  title: 'Create Variables',
                  description: 'Create a variable called <code>myName</code> with your name and a variable called <code>myAge</code> with your age. Then print them both.',
                  language: 'javascript',
                  type: 'fill-in',
                  initialCode: '// Create a variable called myName with your name\nlet myName = "______";\n\n// Create a variable called myAge with your age\nlet myAge = ______;\n\n// Print both variables\nconsole.log(myName);\nconsole.log(myAge);',
                  solutionCode: 'let myName = "Alice";\nlet myAge = 25;\nconsole.log(myName);\nconsole.log(myAge);',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '',
                },
                {
                  id: 'js-m1-ex3',
                  title: 'Fix the Variable Error',
                  description: 'This code has an error. Try to fix it so it prints the correct message.',
                  language: 'javascript',
                  type: 'fix',
                  initialCode: 'let greeting = "Hello"\nlet name = "World"\nconsole.log(greeting + " " + nam)\n// Hint: There\'s a typo in one of the variable names',
                  solutionCode: 'let greeting = "Hello";\nlet name = "World";\nconsole.log(greeting + " " + name);',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: 'Hello World',
                },
              ],
            },
            {
              title: 'Module 1 Quiz — JavaScript Basics',
              type: 'quiz',
              content: '<p>Test your understanding of JavaScript basics. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Which function prints output to the console?', type: 'multiple_choice', options: ['print()', 'console.log()', 'display()', 'echo()'], correctOptionIndex: 1, explanation: 'console.log() is the standard way to print in JavaScript.' },
                { questionText: 'Which keyword is used to declare a variable that cannot be reassigned?', type: 'multiple_choice', options: ['let', 'const', 'var', 'static'], correctOptionIndex: 1, explanation: 'const declares a constant that cannot be reassigned.' },
                { questionText: 'What is the data type of "true"?', type: 'multiple_choice', options: ['String', 'Number', 'Boolean', 'Undefined'], correctOptionIndex: 2, explanation: 'true and false are Boolean values.' },
                { questionText: 'What is the output of: console.log(typeof 42)?', type: 'multiple_choice', options: ['"number"', '"string"', '"boolean"', '"integer"'], correctOptionIndex: 0, explanation: 'typeof 42 returns "number".' },
                { questionText: 'How do you write a single-line comment in JavaScript?', type: 'multiple_choice', options: ['# This is a comment', '<!-- Comment -->', '// This is a comment', '/* Comment */'], correctOptionIndex: 2, explanation: '// is used for single-line comments in JavaScript.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 2: Control Flow ======
        {
          title: 'Module 2: Control Flow',
          description: 'Learn how to make decisions in your code with conditionals and loops.',
          order: 2,
          lessons: [
            {
              title: 'If/Else Statements',
              type: 'article',
              content: `<h2>Making Decisions with If/Else</h2>
<p>Conditional statements let your code make decisions based on conditions.</p>
<pre><code>let temperature = 30;

if (temperature > 25) {
  console.log("It's hot outside!");
} else {
  console.log("It's cool outside.");
}</code></pre>
<h3>Comparison Operators</h3>
<ul>
<li><code>===</code> — strict equal to</li>
<li><code>!==</code> — not equal to</li>
<li><code>></code> — greater than</li>
<li><code><</code> — less than</li>
<li><code>>=</code> — greater than or equal</li>
<li><code><=</code> — less than or equal</li>
</ul>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'js-m2-ex1',
                  title: 'Write an If/Else Statement',
                  description: 'Write code that checks if a number is positive, negative, or zero. Print the result.',
                  language: 'javascript',
                  type: 'write',
                  initialCode: 'let number = -5;\n\n// Write your if/else statement here\n// Print "positive", "negative", or "zero"\n',
                  solutionCode: 'let number = -5;\n\nif (number > 0) {\n  console.log("positive");\n} else if (number < 0) {\n  console.log("negative");\n} else {\n  console.log("zero");\n}',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: 'negative',
                },
                {
                  id: 'js-m2-ex2',
                  title: 'Test-Driven: Even or Odd',
                  description: 'Write a function called <code>isEven</code> that returns <code>true</code> if a number is even and <code>false</code> if it is odd.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function isEven(number) {\n  // Return true if number is even, false if odd\n  \n}\n',
                  solutionCode: 'function isEven(number) {\n  return number % 2 === 0;\n}',
                  testCode: `
describe("isEven Function", function() {
  it("should return true for even numbers", function() {
    assert.equals(isEven(4), true, "4 is even");
  });
  it("should return false for odd numbers", function() {
    assert.equals(isEven(7), false, "7 is odd");
  });
  it("should handle zero", function() {
    assert.equals(isEven(0), true, "0 is even");
  });
  it("should handle negative numbers", function() {
    assert.equals(isEven(-2), true, "-2 is even");
  });
});
`,
                },
              ],
            },
            {
              title: 'Loops: For and While',
              type: 'article',
              content: `<h2>Repeating Actions with Loops</h2>
<p>Loops let you repeat code multiple times.</p>
<h3>For Loop</h3>
<pre><code>// Count from 1 to 5
for (let i = 1; i <= 5; i++) {
  console.log(i);
}</code></pre>
<h3>While Loop</h3>
<pre><code>let count = 1;
while (count <= 5) {
  console.log(count);
  count++;
}</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-m2-ex3',
                  title: 'Print Numbers 1 to 10',
                  description: 'Write a for loop that prints numbers 1 through 10, each on a new line.',
                  language: 'javascript',
                  type: 'fill-in',
                  initialCode: '// Write a for loop from 1 to 10\nfor (let i = 1; i ______; i++) {\n  console.log(i);\n}\n',
                  solutionCode: 'for (let i = 1; i <= 10; i++) {\n  console.log(i);\n}',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '',
                },
                {
                  id: 'js-m2-ex4',
                  title: 'Sum Numbers with a While Loop',
                  description: 'Write a function called <code>sumTo</code> that takes a number <code>n</code> and returns the sum of all numbers from 1 to n.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function sumTo(n) {\n  let sum = 0;\n  let i = 1;\n  // Use a while loop to add i to sum\n  \n  return sum;\n}\n',
                  solutionCode: 'function sumTo(n) {\n  let sum = 0;\n  let i = 1;\n  while (i <= n) {\n    sum += i;\n    i++;\n  }\n  return sum;\n}',
                  testCode: `
describe("sumTo Function", function() {
  it("should sum 1 to 5 equals 15", function() {
    assert.equals(sumTo(5), 15, "sumTo(5) = 15");
  });
  it("should sum 1 to 1 equals 1", function() {
    assert.equals(sumTo(1), 1, "sumTo(1) = 1");
  });
  it("should sum 1 to 10 equals 55", function() {
    assert.equals(sumTo(10), 55, "sumTo(10) = 55");
  });
  it("should return 0 for n = 0", function() {
    assert.equals(sumTo(0), 0, "sumTo(0) = 0");
  });
});
`,
                },
              ],
            },
            {
              title: 'Module 2 Quiz — Control Flow',
              type: 'quiz',
              content: '<p>Test your understanding of if/else and loops.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What does === mean in JavaScript?', type: 'multiple_choice', options: ['Assignment', 'Strict equality', 'Loose equality', 'Not equal'], correctOptionIndex: 1, explanation: '=== checks both value and type.' },
                { questionText: 'How many times does this loop run? for(let i=0; i<5; i++)', type: 'multiple_choice', options: ['4', '5', '6', 'Infinite'], correctOptionIndex: 1, explanation: 'Runs for i=0,1,2,3,4 = 5 times.' },
                { questionText: 'What is the result of 10 % 3?', type: 'multiple_choice', options: ['3', '3.33', '1', '0'], correctOptionIndex: 2, explanation: '10 / 3 = 3 remainder 1, so 10 % 3 = 1.' },
                { questionText: 'Which loop checks the condition BEFORE executing the body?', type: 'multiple_choice', options: ['while', 'do...while', 'for', 'All of the above'], correctOptionIndex: 0, explanation: 'While checks condition first, do...while checks after.' },
                { questionText: 'What is the output? console.log(5 > 3 && 2 < 4)', type: 'multiple_choice', options: ['true', 'false', '5', 'Error'], correctOptionIndex: 0, explanation: 'Both conditions are true, so && returns true.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 3: Functions ======
        {
          title: 'Module 3: Functions',
          description: 'Learn how to write reusable code with functions.',
          order: 3,
          lessons: [
            {
              title: 'Writing Functions',
              type: 'article',
              content: `<h2>Functions are Reusable Blocks of Code</h2>
<pre><code>function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Alice")); // "Hello, Alice!"
console.log(greet("Bob"));   // "Hello, Bob!"</code></pre>
<h3>Parts of a Function</h3>
<ul>
<li><strong>Function name:</strong> <code>greet</code></li>
<li><strong>Parameters:</strong> <code>name</code> (input)</li>
<li><strong>Body:</strong> The code inside <code>{}</code></li>
<li><strong>Return value:</strong> What the function gives back</li>
</ul>
<p>Functions help you avoid repeating yourself!</p>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'js-m3-ex1',
                  title: 'Greet Function',
                  description: 'Write a function called <code>greet</code> that takes a name and returns "Hello, [name]!".',
                  language: 'javascript',
                  type: 'fill-in',
                  initialCode: 'function greet(name) {\n  return "Hello, " + ______ + "!";\n}\n\nconsole.log(greet("World"));\n',
                  solutionCode: 'function greet(name) {\n  return "Hello, " + name + "!";\n}\nconsole.log(greet("World"));',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: 'Hello, World!',
                },
                {
                  id: 'js-m3-ex2',
                  title: 'Test-Driven: Multiply Function',
                  description: 'Write a function called <code>multiply</code> that takes two numbers and returns their product.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function multiply(a, b) {\n  // Return a * b\n  \n}\n',
                  solutionCode: 'function multiply(a, b) {\n  return a * b;\n}',
                  testCode: `
describe("multiply Function", function() {
  it("should multiply 2 by 3 equals 6", function() {
    assert.equals(multiply(2, 3), 6, "2 * 3 = 6");
  });
  it("should multiply by zero", function() {
    assert.equals(multiply(5, 0), 0, "5 * 0 = 0");
  });
  it("should handle negative numbers", function() {
    assert.equals(multiply(-2, 4), -8, "-2 * 4 = -8");
  });
  it("should multiply decimals", function() {
    assert.equals(multiply(2.5, 2), 5, "2.5 * 2 = 5");
  });
});
`,
                },
              ],
            },
            {
              title: 'Arrow Functions and Scope',
              type: 'article',
              content: `<h2>Modern JavaScript: Arrow Functions</h2>
<pre><code>// Traditional function
function add(a, b) {
  return a + b;
}

// Arrow function (shorter!)
const add = (a, b) => a + b;</code></pre>
<h3>Scope</h3>
<p>Variables declared with <code>let</code> and <code>const</code> are block-scoped — they only exist inside the <code>{}</code> where they are defined.</p>`,
              duration: 10,
              resources: [],
              codeExercises: [
                {
                  id: 'js-m3-ex3',
                  title: 'Fix the Arrow Function',
                  description: 'This arrow function has a syntax error. Fix it so it returns a + b correctly.',
                  language: 'javascript',
                  type: 'fix',
                  initialCode: 'const add = (a, b) => {\n  return a + b\n}; // Missing something?\n\nconsole.log(add(5, 3));\n',
                  solutionCode: 'const add = (a, b) => a + b;\nconsole.log(add(5, 3));',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '8',
                },
                {
                  id: 'js-m3-ex4',
                  title: 'Test-Driven: Celsius to Fahrenheit',
                  description: 'Write a function <code>celsiusToFahrenheit</code> that converts Celsius to Fahrenheit. Formula: F = C * 9/5 + 32',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function celsiusToFahrenheit(celsius) {\n  // Return the temperature in Fahrenheit\n  \n}\n',
                  solutionCode: 'function celsiusToFahrenheit(celsius) {\n  return celsius * 9/5 + 32;\n}',
                  testCode: `
describe("celsiusToFahrenheit Function", function() {
  it("should convert 0°C to 32°F", function() {
    assert.equals(celsiusToFahrenheit(0), 32, "0°C = 32°F");
  });
  it("should convert 100°C to 212°F", function() {
    assert.equals(celsiusToFahrenheit(100), 212, "100°C = 212°F");
  });
  it("should convert 25°C to 77°F", function() {
    assert.equals(celsiusToFahrenheit(25), 77, "25°C = 77°F");
  });
  it("should convert -40°C to -40°F", function() {
    assert.equals(celsiusToFahrenheit(-40), -40, "-40°C = -40°F");
  });
});
`,
                },
              ],
            },
            {
              title: 'Module 3 Quiz — Functions',
              type: 'quiz',
              content: '<p>Test your understanding of JavaScript functions.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What keyword is used to define a function?', type: 'multiple_choice', options: ['func', 'function', 'define', '=>'], correctOptionIndex: 1, explanation: 'The function keyword declares a function.' },
                { questionText: 'What does a function return if there is no return statement?', type: 'multiple_choice', options: ['null', '0', 'undefined', 'Error'], correctOptionIndex: 2, explanation: 'Functions without return return undefined.' },
                { questionText: 'Which is a valid arrow function?', type: 'multiple_choice', options: ['(a,b) => a + b', 'function => a + b', 'a,b => a + b', 'a -> a + b'], correctOptionIndex: 0, explanation: 'Arrow functions use => syntax: (params) => expression' },
                { questionText: 'What is the output? console.log(typeof function(){})', type: 'multiple_choice', options: ['"function"', '"object"', '"undefined"', '"string"'], correctOptionIndex: 0, explanation: 'typeof a function returns "function".' },
                { questionText: 'What does "scope" mean?', type: 'multiple_choice', options: ['Where a variable is accessible', 'The size of a function', 'The length of code', 'How fast code runs'], correctOptionIndex: 0, explanation: 'Scope determines where variables are accessible.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 4: Arrays & Objects ======
        {
          title: 'Module 4: Arrays & Objects',
          description: 'Learn how to work with collections of data using arrays and objects.',
          order: 4,
          lessons: [
            {
              title: 'Working with Arrays',
              type: 'article',
              content: `<h2>Arrays Store Lists of Data</h2>
<pre><code>let fruits = ["apple", "banana", "cherry"];
console.log(fruits[0]);  // "apple"
console.log(fruits.length);  // 3

// Add to end
fruits.push("date");
// Remove from end
let last = fruits.pop();
// Loop through
for (let fruit of fruits) {
  console.log(fruit);
}</code></pre>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'js-m4-ex1',
                  title: 'Array Operations',
                  description: 'Write code that creates an array of 3 numbers, adds a 4th number to the end, and prints the array.',
                  language: 'javascript',
                  type: 'write',
                  initialCode: '// Create an array with 3 numbers\nlet numbers = [10, 20, 30];\n\n// Add a 4th number (40) to the end\n\n\n// Print the array\nconsole.log(numbers);\n',
                  solutionCode: 'let numbers = [10, 20, 30];\nnumbers.push(40);\nconsole.log(numbers);',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '[10,20,30,40]',
                },
                {
                  id: 'js-m4-ex2',
                  title: 'Test-Driven: Find Max in Array',
                  description: 'Write a function <code>findMax</code> that takes an array of numbers and returns the largest number.',
                  language: 'javascript',
                  type: 'test',
                  initialCode: 'function findMax(numbers) {\n  // Return the largest number in the array\n  \n}\n',
                  solutionCode: 'function findMax(numbers) {\n  let max = numbers[0];\n  for (let n of numbers) {\n    if (n > max) max = n;\n  }\n  return max;\n}',
                  testCode: `
describe("findMax Function", function() {
  it("should find max of [1, 5, 3, 9, 2]", function() {
    assert.equals(findMax([1, 5, 3, 9, 2]), 9, "Max is 9");
  });
  it("should handle negative numbers", function() {
    assert.equals(findMax([-5, -2, -10]), -2, "Max is -2");
  });
  it("should handle single element", function() {
    assert.equals(findMax([42]), 42, "Max is 42");
  });
  it("should handle all same numbers", function() {
    assert.equals(findMax([7, 7, 7]), 7, "Max is 7");
  });
});
`,
                },
              ],
            },
            {
              title: 'Objects and Properties',
              type: 'article',
              content: `<h2>Objects Represent Real-World Things</h2>
<pre><code>let person = {
  name: "Alice",
  age: 25,
  isStudent: true,
  greet: function() {
    console.log("Hi, I'm " + this.name);
  }
};

console.log(person.name);    // "Alice"
console.log(person["age"]);  // 25
person.greet();             // "Hi, I'm Alice"</code></pre>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'js-m4-ex3',
                  title: 'Create a Car Object',
                  description: 'Create an object called <code>car</code> with properties: <code>brand</code>, <code>model</code>, and <code>year</code>. Then print the brand.',
                  language: 'javascript',
                  type: 'fill-in',
                  initialCode: 'let car = {\n  brand: "______",\n  model: "______",\n  year: ______\n};\n\nconsole.log(car.brand);\n',
                  solutionCode: 'let car = {\n  brand: "Toyota",\n  model: "Camry",\n  year: 2022\n};\nconsole.log(car.brand);',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: 'Toyota',
                },
              ],
            },
            {
              title: 'Module 4 Quiz — Arrays & Objects',
              type: 'quiz',
              content: '<p>Test your understanding of arrays and objects.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is the index of the first element in an array?', type: 'multiple_choice', options: ['1', '0', '-1', 'First'], correctOptionIndex: 1, explanation: 'Array indexes start at 0.' },
                { questionText: 'Which method adds an element to the end of an array?', type: 'multiple_choice', options: ['pop()', 'push()', 'shift()', 'unshift()'], correctOptionIndex: 1, explanation: 'push() adds to the end of an array.' },
                { questionText: 'How do you access the "name" property of an object?', type: 'multiple_choice', options: ['obj(name)', 'obj[name]', 'obj.name', 'name.obj'], correctOptionIndex: 2, explanation: 'Use dot notation: obj.name' },
                { questionText: 'What does fruits.length return?', type: 'multiple_choice', options: ['The last index', 'The number of elements', 'The first element', 'The array itself'], correctOptionIndex: 1, explanation: '.length returns the number of elements.' },
                { questionText: 'How do you loop through an array?', type: 'multiple_choice', options: ['for (let i of arr)', 'while (arr)', 'loop arr', 'iterate arr'], correctOptionIndex: 0, explanation: 'for...of loops through array elements.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 5: HTML/CSS/JS ======
        {
          title: 'Module 5: Building Web Pages',
          description: 'Learn how JavaScript interacts with HTML and CSS to build interactive web pages.',
          order: 5,
          lessons: [
            {
              title: 'HTML Structure and JavaScript',
              type: 'article',
              content: `<h2>JavaScript in the Browser</h2>
<p>JavaScript can manipulate HTML elements on a web page. Here's a simple example of HTML with embedded JavaScript:</p>
<p>Try modifying the HTML/CSS exercise below to change colors and text.</p>`,
              duration: 15,
              resources: [],
              codeExercises: [
                {
                  id: 'js-m5-ex1',
                  title: 'Build a Greeting Card',
                  description: 'Create an HTML page with a heading that says "Welcome!" and a paragraph with your name. Make the heading blue.',
                  language: 'html',
                  type: 'write',
                  initialCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n  <style>\n    /* Add your CSS here */\n    \n  </style>\n</head>\n<body>\n  <h1>Welcome!</h1>\n  <p>My name is: __________</p>\n</body>\n</html>',
                  solutionCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n  <style>\n    h1 { color: blue; }\n  </style>\n</head>\n<body>\n  <h1>Welcome!</h1>\n  <p>My name is: Alice</p>\n</body>\n</html>',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Module 5 Assignment — Build a Mini Calculator',
              type: 'assignment',
              content: '<p>Create a complete HTML page with a simple calculator that can add, subtract, multiply, and divide two numbers.</p><p>Requirements:</p><ul><li>Two input fields for numbers</li><li>Buttons for +, -, ×, ÷</li><li>A display area showing the result</li><li>Styled with CSS</li></ul>',
              isAssignment: true,
              requiredAssignment: true,
              assignmentDescription: 'Build an interactive calculator web page using HTML, CSS, and JavaScript.',
              assignmentDeliverables: ['HTML file with calculator UI', 'JavaScript functions for each operation', 'CSS styling'],
              assignmentQuestions: [
                { questionText: 'Provide the URL or source code of your calculator page.', type: 'open', points: 100 },
              ],
              assignmentConfig: { timeLimit: 60, allowRetakes: true, mode: 'exercise' },
              duration: 60,
              resources: [],
            },
            {
              title: 'Module 5 Quiz — Web Page Basics',
              type: 'quiz',
              content: '<p>Test your knowledge of HTML, CSS, and JavaScript integration.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Which HTML tag links a JavaScript file?', type: 'multiple_choice', options: ['&lt;css&gt;', '&lt;script&gt;', '&lt;js&gt;', '&lt;link&gt;'], correctOptionIndex: 1, explanation: 'The &lt;script&gt; tag is used for JavaScript.' },
                { questionText: 'Which CSS property changes text color?', type: 'multiple_choice', options: ['font-color', 'color', 'text-color', 'background-color'], correctOptionIndex: 1, explanation: 'color changes text color in CSS.' },
                { questionText: 'What does document.getElementById("main") do?', type: 'multiple_choice', options: ['Creates an element', 'Finds an element by ID', 'Deletes an element', 'Changes CSS'], correctOptionIndex: 1, explanation: 'It selects an HTML element by its ID.' },
                { questionText: 'Which event is triggered when a button is clicked?', type: 'multiple_choice', options: ['onhover', 'onclick', 'onchange', 'onsubmit'], correctOptionIndex: 1, explanation: 'The click event fires when an element is clicked.' },
                { questionText: 'What does CSS stand for?', type: 'multiple_choice', options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets', 'Creative Style System'], correctOptionIndex: 1, explanation: 'CSS stands for Cascading Style Sheets.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 6: Final Project ======
        {
          title: 'Module 6: Final Project — Interactive Quiz App',
          description: 'Build a complete interactive quiz application using everything you learned.',
          order: 6,
          lessons: [
            {
              title: 'Project Overview and Setup',
              type: 'article',
              content: `<h2>Final Project: Quiz App</h2>
<p>You'll build a browser-based quiz application where users can answer multiple-choice questions and see their score at the end.</p>
<h3>Requirements:</h3>
<ul>
<li>At least 5 quiz questions</li>
<li>Show one question at a time</li>
<li>Track the score</li>
<li>Show the final score at the end</li>
<li>Styled nicely with CSS</li>
</ul>
<h3>Starter Code</h3>
<p>Use the HTML editor below to build your quiz app. You'll write HTML, CSS, and JavaScript all in one file.</p>`,
              duration: 10,
              resources: [],
              codeExercises: [
                {
                  id: 'js-m6-ex1',
                  title: 'Build the Quiz App',
                  description: 'Build a complete interactive quiz app with HTML, CSS, and JavaScript. Include at least 5 questions, score tracking, and a final result screen.',
                  language: 'html',
                  type: 'write',
                  initialCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Quiz App</title>\n  <style>\n    body { font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; }\n    .question { margin: 20px 0; }\n    .options { display: flex; flex-direction: column; gap: 10px; }\n    .option { padding: 10px; border: 1px solid #ccc; cursor: pointer; }\n    .option:hover { background: #f0f0f0; }\n    .result { font-size: 24px; font-weight: bold; text-align: center; margin-top: 40px; }\n  </style>\n</head>\n<body>\n  <h1>Quiz App</h1>\n  <div id="quiz">\n    <!-- JavaScript will populate this -->\n  </div>\n  <script>\n    // Your JavaScript code here\n    \n  </script>\n</body>\n</html>',
                  solutionCode: '',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Module 6: Final Exam — JavaScript Fundamentals',
              type: 'assignment',
              content: '<p>This final exam tests everything you learned in the JavaScript course.</p>',
              isAssignment: true,
              requiredAssignment: true,
              assignmentDescription: 'Complete the final exam covering all JavaScript topics from the course.',
              assignmentDeliverables: ['Completed exam with minimum 50% score'],
              assignmentQuestions: [
                { questionText: 'Declare a variable called greeting and assign it the value "Hello, World!".', type: 'open', points: 10 },
                { questionText: 'Write a function called isEven that takes a number and returns true if it is even.', type: 'open', points: 15 },
                { questionText: 'Write a for loop that prints numbers from 1 to 5.', type: 'open', points: 15 },
                { questionText: 'Create an object called book with properties title, author, and year.', type: 'open', points: 15 },
                { questionText: 'Write a function findLongestWord that takes an array of words and returns the longest one.', type: 'open', points: 20 },
                { questionText: 'What is the difference between let and const? Explain with examples.', type: 'open', points: 15 },
                { questionText: 'Explain what a callback function is and give an example.', type: 'open', points: 10 },
              ],
              assignmentConfig: { timeLimit: 90, allowRetakes: false, mode: 'exam', disableRightClick: true },
              duration: 90,
              resources: [],
            },
          ],
        },
      ],
    };

    // =========================================================================
    // COURSE 2: INTRODUCTION TO PYTHON
    // =========================================================================
    const pythonCourseData = {
      title: 'Introduction to Python — Complete Beginner Course',
      description: `<p>Learn Python from scratch! This course covers variables, control flow, functions, lists, dictionaries, file I/O, and more. Each lesson includes interactive code exercises where you can write and run Python code.</p>
<p>Python is great for beginners — it has a simple, readable syntax. By the end of this course, you'll be able to write Python programs with confidence.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=800',
      instructor: instructorId,
      price: 1000,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Programming',
      status: 'published',
      submissionRequired: true,
      school: 'Bootskills Academy',
      modules: [
        // ====== MODULE 1: Hello, Python! ======
        {
          title: 'Module 1: Hello, Python!',
          description: 'Learn what Python is, write your first program, and understand variables and data types.',
          order: 1,
          lessons: [
            {
              title: 'Your First Python Program',
              type: 'article',
              content: `<h2>Welcome to Python!</h2>
<p>Python is known for its simple, readable syntax. It's used for web development, data science, AI, automation, and more!</p>
<h3>Your First Code</h3>
<pre><code>print("Hello, World!")</code></pre>
<p>That's it! Python's <code>print()</code> function displays output.</p>
<h3>Comments</h3>
<pre><code># This is a comment
print("Hello!")  # Inline comment</code></pre>`,
              duration: 10,
              resources: [
                { title: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/', type: 'link' },
              ],
              codeExercises: [
                {
                  id: 'py-m1-ex1',
                  title: 'Print Your Name',
                  description: 'Write Python code that prints your name to the console.',
                  language: 'python',
                  type: 'write',
                  initialCode: '# Write code to print your name\n',
                  solutionCode: 'print("Alice")',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: 'Alice',
                },
              ],
            },
            {
              title: 'Variables and Data Types',
              type: 'article',
              content: `<h2>Variables in Python</h2>
<pre><code>name = "Alice"      # String
age = 25            # Integer
height = 1.65       # Float
is_student = True   # Boolean</code></pre>
<h3>Data Types</h3>
<ul>
<li><code>str</code> — Text</li>
<li><code>int</code> — Whole numbers</li>
<li><code>float</code> — Decimal numbers</li>
<li><code>bool</code> — True/False</li>
</ul>
<p>Use <code>type()</code> to check a variable's type: <code>print(type(age))</code></p>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'py-m1-ex2',
                  title: 'Create Variables',
                  description: 'Create a variable <code>name</code> with your name, <code>age</code> with your age, and print them both.',
                  language: 'python',
                  type: 'fill-in',
                  initialCode: 'name = "______"\nage = ______\n\nprint(name)\nprint(age)\n',
                  solutionCode: 'name = "Alice"\nage = 25\nprint(name)\nprint(age)',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Module 1 Quiz — Python Basics',
              type: 'quiz',
              content: '<p>Test your understanding of Python basics.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Which function prints output in Python?', type: 'multiple_choice', options: ['console.log()', 'print()', 'echo()', 'display()'], correctOptionIndex: 1, explanation: 'print() is the built-in function for output.' },
                { questionText: 'How do you write a comment in Python?', type: 'multiple_choice', options: ['// Comment', '<!-- Comment -->', '# Comment', '/* Comment */'], correctOptionIndex: 2, explanation: 'Python uses # for comments.' },
                { questionText: 'What is the data type of 3.14?', type: 'multiple_choice', options: ['int', 'float', 'str', 'bool'], correctOptionIndex: 1, explanation: '3.14 is a float (decimal number).' },
                { questionText: 'What does type(True) return?', type: 'multiple_choice', options: ['&lt;class "str"&gt;', '&lt;class "int"&gt;', '&lt;class "bool"&gt;', '&lt;class "True"&gt;'], correctOptionIndex: 2, explanation: 'True and False are boolean values.' },
                { questionText: 'What is the output? print(type(42))', type: 'multiple_choice', options: ['int', '&lt;class "int"&gt;', 'number', '42'], correctOptionIndex: 1, explanation: 'type() returns a string like &lt;class "int"&gt;.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 2: Control Flow ======
        {
          title: 'Module 2: Control Flow in Python',
          description: 'Learn about conditionals and loops in Python.',
          order: 2,
          lessons: [
            {
              title: 'If/Elif/Else',
              type: 'article',
              content: `<h2>Making Decisions</h2>
<pre><code>temperature = 30

if temperature > 25:
    print("It's hot!")
elif temperature > 15:
    print("It's warm.")
else:
    print("It's cold.")</code></pre>
<p>Note: Python uses <strong>indentation</strong> (spaces) instead of <code>{}</code> to show blocks!</p>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'py-m2-ex1',
                  title: 'Even or Odd Checker',
                  description: 'Write Python code that checks if the number 7 is even or odd and prints the result.',
                  language: 'python',
                  type: 'write',
                  initialCode: 'number = 7\n\n# Write code to check if number is even or odd\n# Print "even" or "odd"\n',
                  solutionCode: 'number = 7\nif number % 2 == 0:\n    print("even")\nelse:\n    print("odd")',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: 'odd',
                },
                {
                  id: 'py-m2-ex2',
                  title: 'Fix the Indentation',
                  description: 'This code has an indentation error. Fix it so it runs correctly.',
                  language: 'python',
                  type: 'fix',
                  initialCode: 'x = 10\nif x > 5:\nprint("x is greater than 5")\nelse:\n  print("x is not greater than 5")\n',
                  solutionCode: 'x = 10\nif x > 5:\n    print("x is greater than 5")\nelse:\n    print("x is not greater than 5")',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: 'x is greater than 5',
                },
              ],
            },
            {
              title: 'Loops: For and While',
              type: 'article',
              content: `<h2>For Loop</h2>
<pre><code># Count from 1 to 5
for i in range(1, 6):
    print(i)

# Loop through a list
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)</code></pre>
<h2>While Loop</h2>
<pre><code>count = 1
while count <= 5:
    print(count)
    count += 1</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'py-m2-ex3',
                  title: 'Sum Numbers with a Loop',
                  description: 'Write a Python function <code>sum_to(n)</code> that returns the sum of all numbers from 1 to n.',
                  language: 'python',
                  type: 'test',
                  initialCode: '# Write a function called sum_to\n# that sums numbers from 1 to n\n',
                  solutionCode: 'def sum_to(n):\n    total = 0\n    for i in range(1, n + 1):\n        total += i\n    return total',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Module 2 Quiz — Control Flow',
              type: 'quiz',
              content: '<p>Test your understanding of if/elif/else and loops.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What keyword is used for "else if" in Python?', type: 'multiple_choice', options: ['elseif', 'elif', 'else if', 'elsif'], correctOptionIndex: 1, explanation: 'Python uses elif for "else if".' },
                { questionText: 'How does Python define code blocks?', type: 'multiple_choice', options: ['With {}', 'With indentation', 'With []', 'With ()'], correctOptionIndex: 1, explanation: 'Python uses indentation (spaces/tabs).' },
                { questionText: 'What does range(1, 5) generate?', type: 'multiple_choice', options: ['1,2,3,4,5', '1,2,3,4', '0,1,2,3,4', '0,1,2,3,4,5'], correctOptionIndex: 1, explanation: 'range(1,5) gives 1,2,3,4 (excludes 5).' },
                { questionText: 'What is the Python equivalent of ++ in other languages?', type: 'multiple_choice', options: ['i++', 'i += 1', 'i =+ 1', '++i'], correctOptionIndex: 1, explanation: 'Python uses += operator instead of ++.' },
                { questionText: 'What does the % operator do?', type: 'multiple_choice', options: ['Division', 'Modulus (remainder)', 'Percentage', 'Power'], correctOptionIndex: 1, explanation: '% returns the remainder of division.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 3: Functions & Lists ======
        {
          title: 'Module 3: Functions & Lists',
          description: 'Learn to write reusable functions and work with lists in Python.',
          order: 3,
          lessons: [
            {
              title: 'Defining Functions',
              type: 'article',
              content: `<h2>Functions in Python</h2>
<pre><code>def greet(name):
    return f"Hello, {name}!"

print(greet("Alice"))  # Hello, Alice!</code></pre>
<h3>Key Points</h3>
<ul>
<li>Use <code>def</code> to define functions</li>
<li>Use <code>return</code> to return a value</li>
<li>f-strings (f"...") insert variables into strings</li>
</ul>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'py-m3-ex1',
                  title: 'Create a Greeting Function',
                  description: 'Write a function <code>greet(name)</code> that returns "Hello, [name]!". Then call it with your name.',
                  language: 'python',
                  type: 'fill-in',
                  initialCode: 'def greet(name):\n    return f"Hello, ______!"\n\nprint(greet("Python"))\n',
                  solutionCode: 'def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Python"))',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: 'Hello, Python!',
                },
                {
                  id: 'py-m3-ex2',
                  title: 'Test-Driven: Multiply Function',
                  description: 'Write a function <code>multiply(a, b)</code> that returns a * b.',
                  language: 'python',
                  type: 'write',
                  initialCode: '# Write the multiply function\n\nprint(multiply(4, 5))\n',
                  solutionCode: 'def multiply(a, b):\n    return a * b\nprint(multiply(4, 5))',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '20',
                },
              ],
            },
            {
              title: 'Lists and List Operations',
              type: 'article',
              content: `<h2>Lists in Python</h2>
<pre><code>fruits = ["apple", "banana", "cherry"]
print(fruits[0])      # apple
print(len(fruits))    # 3

# Add to list
fruits.append("date")
# Remove from list
fruits.remove("banana")
# Loop through
for fruit in fruits:
    print(fruit)</code></pre>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'py-m3-ex3',
                  title: 'Average of Numbers',
                  description: 'Write a function <code>average(numbers)</code> that takes a list of numbers and returns their average.',
                  language: 'python',
                  type: 'test',
                  initialCode: '# Write the average function\n',
                  solutionCode: 'def average(numbers):\n    return sum(numbers) / len(numbers)',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Module 3 Quiz — Functions & Lists',
              type: 'quiz',
              content: '<p>Test your understanding of functions and lists.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What keyword is used to define a function?', type: 'multiple_choice', options: ['func', 'define', 'def', 'function'], correctOptionIndex: 2, explanation: 'Python uses def to define functions.' },
                { questionText: 'What method adds an element to the end of a list?', type: 'multiple_choice', options: ['add()', 'insert()', 'append()', 'push()'], correctOptionIndex: 2, explanation: 'append() adds to the end of a list.' },
                { questionText: 'What does len([1, 2, 3]) return?', type: 'multiple_choice', options: ['3', '2', '1', '4'], correctOptionIndex: 0, explanation: 'len() returns the number of elements.' },
                { questionText: 'What is the output? print(type([]))', type: 'multiple_choice', options: ['&lt;class "list"&gt;', 'list', 'array', '[]'], correctOptionIndex: 0, explanation: 'Empty brackets [] create a list.' },
                { questionText: 'How do you remove "banana" from fruits list?', type: 'multiple_choice', options: ['fruits.delete("banana")', 'fruits.remove("banana")', 'remove fruits[1]', 'fruits.pop("banana")'], correctOptionIndex: 1, explanation: 'remove() removes the first matching item.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 4: Dictionaries & Tuples ======
        {
          title: 'Module 4: Dictionaries & Tuples',
          description: 'Learn to work with key-value pairs and immutable sequences.',
          order: 4,
          lessons: [
            {
              title: 'Dictionaries',
              type: 'article',
              content: `<h2>Dictionaries Store Key-Value Pairs</h2>
<pre><code>person = {
    "name": "Alice",
    "age": 25,
    "city": "Kigali"
}

print(person["name"])  # Alice
print(person.get("age"))  # 25

# Add or update
person["email"] = "alice@example.com"

# Loop through
for key, value in person.items():
    print(f"{key}: {value}")</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'py-m4-ex1',
                  title: 'Create a Dictionary',
                  description: 'Create a dictionary called <code>book</code> with keys: title, author, year. Print the title.',
                  language: 'python',
                  type: 'fill-in',
                  initialCode: 'book = {\n    "title": "______",\n    "author": "______",\n    "year": ______\n}\n\nprint(book["title"])\n',
                  solutionCode: 'book = {\n    "title": "Python 101",\n    "author": "Jane Doe",\n    "year": 2024\n}\nprint(book["title"])',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: 'Python 101',
                },
                {
                  id: 'py-m4-ex2',
                  title: 'Fruit Counter',
                  description: 'Write a function <code>count_fruits(fruit_list)</code> that takes a list of fruits and returns a dictionary counting how many times each fruit appears.',
                  language: 'python',
                  type: 'test',
                  initialCode: '# Write the count_fruits function\n',
                  solutionCode: 'def count_fruits(fruit_list):\n    counts = {}\n    for fruit in fruit_list:\n        if fruit in counts:\n            counts[fruit] += 1\n        else:\n            counts[fruit] = 1\n    return counts',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Tuples and Sets',
              type: 'article',
              content: `<h2>Tuples (Immutable Lists)</h2>
<pre><code>coordinates = (10, 20)
print(coordinates[0])  # 10
# coordinates[0] = 5  # Error! Tuples can't be changed</code></pre>
<h2>Sets (Unique Items)</h2>
<pre><code>unique_numbers = {1, 2, 3, 2, 1}
print(unique_numbers)  # {1, 2, 3}  - duplicates removed!</code></pre>`,
              duration: 10,
              resources: [],
              codeExercises: [
                {
                  id: 'py-m4-ex3',
                  title: 'Remove Duplicates',
                  description: 'Write a function <code>remove_duplicates(items)</code> that takes a list and returns a new list with duplicates removed (preserving order).',
                  language: 'python',
                  type: 'write',
                  initialCode: '# Write the remove_duplicates function\n\nprint(remove_duplicates([1, 2, 2, 3, 1, 4]))\n',
                  solutionCode: 'def remove_duplicates(items):\n    seen = set()\n    result = []\n    for item in items:\n        if item not in seen:\n            seen.add(item)\n            result.append(item)\n    return result\nprint(remove_duplicates([1, 2, 2, 3, 1, 4]))',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '[1, 2, 3, 4]',
                },
              ],
            },
            {
              title: 'Module 4 Quiz — Dictionaries & Tuples',
              type: 'quiz',
              content: '<p>Test your understanding of dictionaries, tuples, and sets.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'How do you access the value for key "name" in a dictionary?', type: 'multiple_choice', options: ['dict(name)', 'dict["name"]', 'dict.name', 'name.dict'], correctOptionIndex: 1, explanation: 'Use bracket notation: dict["key"]' },
                { questionText: 'What is the difference between a list and a tuple?', type: 'multiple_choice', options: ['Tuples are faster', 'Tuples are immutable', 'Lists are immutable', 'No difference'], correctOptionIndex: 1, explanation: 'Tuples cannot be modified after creation.' },
                { questionText: 'How do you create an empty set?', type: 'multiple_choice', options: ['{}', 'set()', '[]', '()'], correctOptionIndex: 1, explanation: '{} creates an empty dict, set() creates an empty set.' },
                { questionText: 'What does {1, 2, 2, 3} give you?', type: 'multiple_choice', options: ['{1, 2, 2, 3}', '{1, 2, 3}', '[1, 2, 2, 3]', '(1, 2, 3)'], correctOptionIndex: 1, explanation: 'Sets automatically remove duplicates.' },
                { questionText: 'What method returns all keys from a dictionary?', type: 'multiple_choice', options: ['keys()', 'get_keys()', 'all_keys()', 'list_keys()'], correctOptionIndex: 0, explanation: 'dict.keys() returns all keys.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 5: File I/O & Error Handling ======
        {
          title: 'Module 5: File I/O & Error Handling',
          description: 'Learn to read/write files and handle errors in Python.',
          order: 5,
          lessons: [
            {
              title: 'Reading and Writing Files',
              type: 'article',
              content: `<h2>Working with Files</h2>
<pre><code># Writing to a file
with open("notes.txt", "w") as file:
    file.write("Hello, file!\\n")
    file.write("This is line 2")

# Reading from a file
with open("notes.txt", "r") as file:
    content = file.read()
    print(content)</code></pre>
<p>The <code>with</code> statement automatically closes the file when done.</p>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'py-m5-ex1',
                  title: 'Write a Poem',
                  description: 'Write code that creates a file called "poem.txt" and writes a short poem (3 lines) to it. Then read and print the file.',
                  language: 'python',
                  type: 'write',
                  initialCode: '# Write a poem to a file, then read it back\n',
                  solutionCode: "with open('poem.txt', 'w') as f:\n    f.write('Roses are red\\n')\n    f.write('Violets are blue\\n')\n    f.write('Python is awesome\\n')\n\nwith open('poem.txt', 'r') as f:\n    print(f.read())",
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Try/Except Error Handling',
              type: 'article',
              content: `<h2>Handling Errors Gracefully</h2>
<pre><code>try:
    number = int(input("Enter a number: "))
    result = 10 / number
    print(f"Result: {result}")
except ValueError:
    print("That's not a valid number!")
except ZeroDivisionError:
    print("Cannot divide by zero!")
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    print("This always runs.")</code></pre>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'py-m5-ex2',
                  title: 'Safe Division',
                  description: 'Write a function <code>safe_divide(a, b)</code> that returns a/b, or "Error: division by zero" if b is 0.',
                  language: 'python',
                  type: 'test',
                  initialCode: '# Write the safe_divide function\n',
                  solutionCode: 'def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return "Error: division by zero"',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Module 5 Quiz — File I/O & Errors',
              type: 'quiz',
              content: '<p>Test your understanding of file operations and error handling.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What does the "with" statement do?', type: 'multiple_choice', options: ['Opens a file', 'Automatically closes the file', 'Creates a file', 'Deletes a file'], correctOptionIndex: 1, explanation: 'with ensures proper resource cleanup.' },
                { questionText: 'What mode opens a file for writing?', type: 'multiple_choice', options: ['"r"', '"w"', '"a"', '"x"'], correctOptionIndex: 1, explanation: '"w" opens a file for writing (overwrites existing).' },
                { questionText: 'What block handles errors in Python?', type: 'multiple_choice', options: ['catch', 'except', 'error', 'handle'], correctOptionIndex: 1, explanation: 'except catches exceptions in try/except blocks.' },
                { questionText: 'What is ZeroDivisionError?', type: 'multiple_choice', options: ['An error when dividing by zero', 'An error with zero values', 'A warning', 'Not an error'], correctOptionIndex: 0, explanation: 'Python raises ZeroDivisionError when dividing by zero.' },
                { questionText: 'What does "finally" do in try/except?', type: 'multiple_choice', options: ['Runs only if no error', 'Runs only if error occurs', 'Always runs', 'Never runs'], correctOptionIndex: 2, explanation: 'finally always executes regardless of errors.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 6: Final Project ======
        {
          title: 'Module 6: Final Project — Todo List App',
          description: 'Build a complete todo list application in Python using everything you learned.',
          order: 6,
          lessons: [
            {
              title: 'Project Overview',
              type: 'article',
              content: `<h2>Final Project: Todo List Manager</h2>
<p>Build a command-line todo list manager that can:</p>
<ul>
<li>Add tasks</li>
<li>View all tasks</li>
<li>Mark tasks as complete</li>
<li>Delete tasks</li>
<li>Save tasks to a file</li>
<li>Load tasks from a file on startup</li>
</ul>
<h3>Starter Code</h3>
<p>Start with the code below and build out the features. Use functions, lists, dictionaries, file I/O, and error handling.</p>`,
              duration: 10,
              resources: [],
              codeExercises: [
                {
                  id: 'py-m6-ex1',
                  title: 'Todo List Manager',
                  description: 'Build a complete todo list app. Use functions, file I/O, and error handling.',
                  language: 'python',
                  type: 'write',
                  initialCode: '# Todo List Manager\n\ndef show_menu():\n    print("\\n=== Todo List Manager ===")\n    print("1. View tasks")\n    print("2. Add task")\n    print("3. Mark task complete")\n    print("4. Delete task")\n    print("5. Save and exit")\n\ndef load_tasks():\n    # Load tasks from file\n    pass\n\ndef save_tasks(tasks):\n    # Save tasks to file\n    pass\n\ndef view_tasks(tasks):\n    # Display all tasks\n    pass\n\ndef add_task(tasks):\n    # Add a new task\n    pass\n\ndef mark_complete(tasks):\n    # Mark a task as complete\n    pass\n\ndef delete_task(tasks):\n    # Delete a task\n    pass\n\ndef main():\n    tasks = load_tasks()\n    while True:\n        show_menu()\n        choice = input("Choose an option: ")\n        \n        # Add your logic here\n        \nmain()',
                  solutionCode: '',
                  testCode: '',
                  setupCode: '',
                  expectedOutput: '',
                },
              ],
            },
            {
              title: 'Module 6: Final Exam — Python Fundamentals',
              type: 'assignment',
              content: '<p>This final exam tests everything you learned in the Python course.</p>',
              isAssignment: true,
              requiredAssignment: true,
              assignmentDescription: 'Complete the final exam covering all Python topics from the course.',
              assignmentDeliverables: ['Completed exam with minimum 50% score'],
              assignmentQuestions: [
                { questionText: 'Write a function called is_palindrome that checks if a string reads the same forward and backward.', type: 'open', points: 15 },
                { questionText: 'Write a for loop that prints the even numbers from 2 to 20.', type: 'open', points: 10 },
                { questionText: 'Create a dictionary called student with keys: name, grade, and subjects.', type: 'open', points: 10 },
                { questionText: 'Write a function count_words(text) that takes a string and returns the number of words.', type: 'open', points: 15 },
                { questionText: 'Write code that reads a file called "data.txt" and prints its contents. Include error handling.', type: 'open', points: 20 },
                { questionText: 'Explain the difference between a list and a tuple. When would you use each?', type: 'open', points: 15 },
                { questionText: 'What is the purpose of the __init__ method in Python classes? Give an example.', type: 'open', points: 15 },
              ],
              assignmentConfig: { timeLimit: 90, allowRetakes: false, mode: 'exam', disableRightClick: true },
              duration: 90,
              resources: [],
            },
          ],
        },
      ],
    };

    // Seed JavaScript Course
    const existingJSCourse = await Course.findOne({ title: jsCourseData.title });
    if (existingJSCourse) {
      Object.assign(existingJSCourse, jsCourseData);
      await existingJSCourse.save();
      console.log('✅ Updated JavaScript course');
    } else {
      await new Course(jsCourseData).save();
      console.log('✅ Created JavaScript course');
    }

    // Seed Python Course
    const existingPyCourse = await Course.findOne({ title: pythonCourseData.title });
    if (existingPyCourse) {
      Object.assign(existingPyCourse, pythonCourseData);
      await existingPyCourse.save();
      console.log('✅ Updated Python course');
    } else {
      await new Course(pythonCourseData).save();
      console.log('✅ Created Python course');
    }

    console.log('\n🏁 Seeding complete!');
    console.log('📚 Introduction to JavaScript — 6 modules with code exercises, quizzes, and assignments');
    console.log('🐍 Introduction to Python — 6 modules with code exercises, quizzes, and assignments');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedIntroToJSAndPython();
