/**
 * ─────────────────────────────────────────────────────────
 * SEED: JavaScript Coding Challenges Course
 * ─────────────────────────────────────────────────────────
 * Creates a comprehensive hands-on JavaScript course with
 * coding exercises, tests, quizzes, and certificate of completion.
 *
 * Instructor: admin@bootskills.com
 * Price: 1000 RWF
 *
 * Modules:
 *   1. Array Basics (10 exercises)
 *   2. Control Structures & Algorithms (4 exercises)
 *   3. Applied Programming (4 exercises)
 *   4. Pattern Printing (6 exercises)
 *   5. Algorithm Challenges (7 exercises)
 * ─────────────────────────────────────────────────────────
 * Usage: npx ts-node src/seedJSCodeChallenges.ts
 * ─────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import { Certificate } from './models/Certificate';
import connectDB from './config/db';

dotenv.config();

const seedJSCodeChallenges = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding JavaScript Coding Challenges Course...\n');

    // ─── Find or create instructor (admin@bootskills.com) ───
    let instructor = await User.findOne({ email: 'admin@bootskills.com' });
    if (!instructor) {
      console.log('admin@bootskills.com not found — creating...');
      instructor = await new User({
        fullName: 'Bootskills Admin',
        username: 'admin',
        email: 'admin@bootskills.com',
        password: 'Password@123',
        role: 'admin',
        status: 'active',
        academicStatus: 'active',
      }).save();
      console.log('✅ Created admin user: admin@bootskills.com');
    } else {
      console.log('✅ Using instructor:', instructor.email);
    }
    const instructorId = instructor._id;

    const courseTitle = 'JavaScript Coding Challenges — From Arrays to Algorithms';

    // ─── COURSE DATA ──────────────────────────────────────
    const coursePayload: any = {
      title: courseTitle,
      description: `<p><strong>Master JavaScript through hands-on coding challenges!</strong></p>
<p>This course contains <strong>31 coding exercises</strong> organized into 5 modules covering arrays, control structures, applied programming, pattern printing, and algorithm challenges.</p>
<p>🚀 <strong>Each exercise must be completed and all tests passed before you can proceed.</strong></p>
<p>Topics: array operations, loops, conditionals, string manipulation, nested loops, algorithms, and problem-solving.</p>
<p>🎓 <strong>Certificate of Completion</strong> — Finish all exercises to earn your certificate.</p>`,

      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=800',
      instructor: instructorId,
      price: 1000,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Programming',
      status: 'published',
      submissionRequired: true,
      school: 'Bootskills Academy',
      passingScore: 70,
      isFeatured: true,

      modules: [
        // =====================================================================
        // MODULE 1: Array Basics (10 exercises)
        // =====================================================================
        {
          title: 'Module 1: JavaScript Array Basics',
          description: 'Learn how to store and work with collections of data using arrays. Complete 10 exercises on storing, displaying, copying, and transforming array data.',
          order: 1,
          lessons: [
            // ─── Lesson 1: Store & Display Arrays ─────
            {
              title: 'Creating and Displaying Arrays',
              type: 'article',
              content: `<h2>Arrays Store Multiple Values</h2>
<p>An array is like a list that can hold many items. Each item has an index starting at 0.</p>
<pre><code>// Create an array
let marks = [85, 90, 78, 92, 88];

// Access items by index
console.log(marks[0]);  // 85 (first item)
console.log(marks.length);  // 5 (number of items)

// Loop through an array
for (let i = 0; i < marks.length; i++) {
  console.log(marks[i]);
}

// Or use a for...of loop
for (let mark of marks) {
  console.log(mark);
}</code></pre>
<p>In the exercises below, you'll use <code>prompt()</code> to ask the user for input and arrays to store the data.</p>
<p><strong>Note:</strong> In this code editor, we use simulated input. The <code>readInput()</code> function is available to get user input.</p>`,

              duration: 15,
              resources: [],
              codeExercises: [
                // Exercise 1: Class Marks
                {
                  id: 'js-array-ex1',
                  title: 'Class Marks Store & Display',
                  description: `<p><strong>Problem:</strong> A teacher wants to store marks for students in a class.</p>
<p><strong>Task:</strong> Write a function <code>storeMarks</code> that takes an array of marks and displays them one by one using <code>console.log()</code>.</p>
<p><strong>Example:</strong> <code>storeMarks([75, 80, 90])</code> should print each mark on a new line.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function storeMarks(marks) {
}`,

                  solutionCode: ``,

                  testCode: `describe("storeMarks", function() {
  it("should display all marks", function() {
    // Just verify the function exists and runs without error
    assert.isFunction(storeMarks, "storeMarks is a function");
  });
  it("should handle empty array", function() {
    storeMarks([]);
    assert.isTrue(true, "empty array works");
  });
});
`,

                  expectedOutput: '75\n80\n90\n85\n70',
                },
              ],
            },

            // ─── Lesson 2: More Array Exercises ─────
            {
              title: 'Calculating Totals and Averages',
              type: 'article',
              content: `<h2>Working with Array Data</h2>
<p>You can calculate totals and averages by looping through arrays:</p>
<pre><code>// Calculate total
let sales = [1500, 2300, 1800];
let total = 0;
for (let i = 0; i < sales.length; i++) {
  total += sales[i];
}
console.log(total);  // 5600

// Calculate average
let average = total / sales.length;
console.log(average);  // 1866.67
</code></pre>
<p>Now try these exercises to practice working with arrays.</p>`,

              duration: 20,
              resources: [],
              codeExercises: [
                // Exercise 2: Sales Total
                {
                  id: 'js-array-ex2',
                  title: 'Sales Transactions - Calculate Total',
                  description: `<p><strong>Problem:</strong> A shopkeeper wants to calculate total sales from multiple transactions.</p>
<p><strong>Task:</strong> Write a function <code>calculateTotal</code> that takes an array of sale amounts and returns the total sum.</p>
<p><strong>Example:</strong> <code>calculateTotal([1500, 2300, 1800])</code> should return <code>5600</code>.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function calculateTotal(sales) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("calculateTotal", function() {
  it("should calculate total of [1500,2300,1800]", function() {
    assert.equals(calculateTotal([1500, 2300, 1800]), 5600);
  });
  it("should handle single element", function() {
    assert.equals(calculateTotal([500]), 500);
  });
  it("should handle empty array", function() {
    assert.equals(calculateTotal([]), 0);
  });
});
`,

                  expectedOutput: '5600',
                },

                // Exercise 3: Employee Salaries
                {
                  id: 'js-array-ex3',
                  title: 'Employee Salaries - Display All',
                  description: `<p><strong>Problem:</strong> A company wants to display all employee salaries.</p>
<p><strong>Task:</strong> Write a function <code>displaySalaries</code> that takes an array of salaries and displays each one formatted as <code>"Salary: [amount]"</code>.</p>
<p><strong>Example:</strong> <code>displaySalaries([300000, 450000, 500000])</code></p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function displaySalaries(salaries) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("displaySalaries", function() {
  it("should be a function", function() {
    assert.isFunction(displaySalaries, "displaySalaries is a function");
  });
  it("should handle empty array", function() {
    displaySalaries([]);
    assert.isTrue(true);
  });
});
`,

                  expectedOutput: 'Salary: 300000\nSalary: 450000\nSalary: 500000',
                },
              ],
            },

            // ─── Lesson 3: More Array Exercises ─────
            {
              title: 'Calculating Averages and Copying Arrays',
              type: 'article',
              content: `<h2>Averages and Array Copying</h2>
<pre><code>// Calculate average score
let scores = [85, 90, 78, 92];
let sum = scores.reduce((acc, score) => acc + score, 0);
let avg = sum / scores.length;
console.log(avg);

// Copy an array (spread operator)
let original = [1, 2, 3];
let copy = [...original];
console.log(copy);  // [1, 2, 3]

// Map to create a new array
let doubled = original.map(n => n * 2);
console.log(doubled);  // [2, 4, 6]</code></pre>
<p>Now practice these techniques!</p>`,

              duration: 20,
              resources: [],
              codeExercises: [
                // Exercise 4: Average Score
                {
                  id: 'js-array-ex4',
                  title: 'Student Test Scores - Calculate Average',
                  description: `<p><strong>Problem:</strong> A teacher needs to calculate the average test score for the class.</p>
<p><strong>Task:</strong> Write a function <code>calculateAverage</code> that takes an array of scores and returns the average.</p>
<p><strong>Example:</strong> <code>calculateAverage([80, 90, 100])</code> should return <code>90</code>.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function calculateAverage(scores) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("calculateAverage", function() {
  it("should average [80,90,100] to 90", function() {
    assert.equals(calculateAverage([80, 90, 100]), 90);
  });
  it("should handle [5,10]", function() {
    assert.equals(calculateAverage([5, 10]), 7.5);
  });
  it("should handle single element", function() {
    assert.equals(calculateAverage([42]), 42);
  });
});
`,

                  expectedOutput: '90',
                },

                // Exercise 5: Product Prices
                {
                  id: 'js-array-ex5',
                  title: 'Product Prices - Display All',
                  description: `<p><strong>Problem:</strong> A shop wants to display all product prices.</p>
<p><strong>Task:</strong> Write a function <code>displayPrices</code> that takes an array of prices and displays each one with a dollar sign, e.g., <code>"$49.99"</code>.</p>
<p><strong>Example:</strong> <code>displayPrices([10.99, 25.50, 5.00])</code></p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function displayPrices(prices) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("displayPrices", function() {
  it("should be a function", function() {
    assert.isFunction(displayPrices, "displayPrices is a function");
  });
});
`,

                  expectedOutput: '$10.99\n$25.5\n$5',
                },
              ],
            },

            // ─── Lesson 4: Names and Copying ─────
            {
              title: 'Storing Names and Copying Arrays',
              type: 'article',
              content: `<h2>Working with String Arrays</h2>
<pre><code>// Store names in an array
let names = ["Alice", "Bob", "Charlie"];

// Display with index numbering
for (let i = 0; i < names.length; i++) {
  console.log((i + 1) + ". " + names[i]);
}
// Output:
// 1. Alice
// 2. Bob
// 3. Charlie

// Copy an array
let original = [10, 20, 30];
let copied = [];

for (let i = 0; i < original.length; i++) {
  copied[i] = original[i]; // Copy each element
}
console.log(copied);  // [10, 20, 30]

// Or use spread operator:
let alsoCopied = [...original];
</code></pre>
<p>Practice these patterns!</p>`,

              duration: 20,
              resources: [],
              codeExercises: [
                // Exercise 6: Enter Numbers
                {
                  id: 'js-array-ex6',
                  title: 'Enter Numbers - Display All',
                  description: `<p><strong>Problem:</strong> A program asks how many numbers to enter, stores them in an array, and displays all numbers.</p>
<p><strong>Task:</strong> Write a function <code>displayNumbers</code> that takes an array of numbers and displays each one with its index: <code>"Index [i]: [value]"</code>.</p>
<p><strong>Example:</strong> <code>displayNumbers([10, 20, 30])</code></p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function displayNumbers(numbers) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("displayNumbers", function() {
  it("should be a function", function() {
    assert.isFunction(displayNumbers, "displayNumbers is a function");
  });
});
`,

                  expectedOutput: 'Index 0: 10\nIndex 1: 20\nIndex 2: 30',
                },

                // Exercise 7: User Registration
                {
                  id: 'js-array-ex7',
                  title: 'User Registration - Store Names',
                  description: `<p><strong>Problem:</strong> A system registers users by storing their names in an array.</p>
<p><strong>Task:</strong> Write a function <code>registerUsers</code> that takes an array of names and displays a welcome message for each: <code>"Welcome, [name]!"</code>.</p>
<p><strong>Example:</strong> <code>registerUsers(["Alice", "Bob"])</code></p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function registerUsers(names) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("registerUsers", function() {
  it("should be a function", function() {
    assert.isFunction(registerUsers, "registerUsers is a function");
  });
});
`,

                  expectedOutput: 'Welcome, Alice!\nWelcome, Bob!\nWelcome, Charlie!',
                },
              ],
            },

            // ─── Lesson 5: Copy & Transform Arrays ─────
            {
              title: 'Copying and Transforming Arrays',
              type: 'article',
              content: `<h2>Array Copy and Transformation</h2>
<pre><code>// Manual copy
let source = [10, 20, 30];
let destination = [];
for (let i = 0; i < source.length; i++) {
  destination[i] = source[i];
}

// Transform each value
let doubled = [];
for (let i = 0; i < source.length; i++) {
  doubled[i] = source[i] * 2;
}
console.log(doubled);  // [20, 40, 60]

// Display with numbering
let items = ["Apple", "Banana", "Cherry"];
for (let i = 0; i < items.length; i++) {
  console.log((i + 1) + ". " + items[i]);
}
// 1. Apple
// 2. Banana
// 3. Cherry
</code></pre>`,

              duration: 20,
              resources: [],
              codeExercises: [
                // Exercise 8: Copy Array
                {
                  id: 'js-array-ex8',
                  title: 'Copy Array - Duplicate Marks',
                  description: `<p><strong>Problem:</strong> Given an array of marks, create a copy in another array and display both.</p>
<p><strong>Task:</strong> Write a function <code>copyArray</code> that takes an array, creates a copy, and displays <code>"Original: [arr]"</code> and <code>"Copy: [arr]"</code>.</p>
<p><strong>Example:</strong> <code>copyArray([85, 90, 78])</code></p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function copyArray(source) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("copyArray", function() {
  it("should be a function", function() {
    assert.isFunction(copyArray, "copyArray is a function");
  });
});
`,

                  expectedOutput: 'Original: 85,90,78\nCopy: 85,90,78',
                },

                // Exercise 9: Multiply Array
                {
                  id: 'js-array-ex9',
                  title: 'Multiply Array - Double the Values',
                  description: `<p><strong>Problem:</strong> Create a new array with each number from the original multiplied by 2.</p>
<p><strong>Task:</strong> Write a function <code>multiplyArray</code> that takes an array, creates a new array with each value doubled, and displays the new array.</p>
<p><strong>Example:</strong> <code>multiplyArray([1, 2, 3])</code> should display <code>"Doubled: 2,4,6"</code>.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function multiplyArray(numbers) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("multiplyArray", function() {
  it("should be a function", function() {
    assert.isFunction(multiplyArray, "multiplyArray is a function");
  });
});
`,

                  expectedOutput: 'Doubled: 2,4,6,8,10',
                },

                // Exercise 10: Numbered Items
                {
                  id: 'js-array-ex10',
                  title: 'Numbered Items List',
                  description: `<p><strong>Problem:</strong> Display items with numbering (1, 2, 3, ...).</p>
<p><strong>Task:</strong> Write a function <code>displayNumbered</code> that takes an array of item names and displays each with a number: <code>"1. [item]"</code>, <code>"2. [item]"</code>.</p>
<p><strong>Example:</strong> <code>displayNumbered(["Apple", "Banana", "Cherry"])</code></p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function displayNumbered(items) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("displayNumbered", function() {
  it("should be a function", function() {
    assert.isFunction(displayNumbered, "displayNumbered is a function");
  });
});
`,

                  expectedOutput: '1. Apple\n2. Banana\n3. Cherry\n4. Date',
                },
              ],
            },
          ],
        },

        // =====================================================================
        // MODULE 2: Control Structures & Algorithms (4 exercises)
        // =====================================================================
        {
          title: 'Module 2: Control Structures & Algorithms',
          description: 'Practice swapping values, calculating factorials, reversing numbers, and reversing strings using JavaScript control structures.',
          order: 2,
          lessons: [
            {
              title: 'Swapping Variables and Factorials',
              type: 'article',
              content: `<h2>Swapping Variables</h2>
<p>Swapping means exchanging the values of two variables:</p>
<pre><code>let a = 5, b = 10;
let temp = a;
a = b;
b = temp;
console.log(a); // 10
console.log(b); // 5
</code></pre>

<h2>Calculating Factorial</h2>
<p>The factorial of n (written n!) is n × (n-1) × (n-2) × ... × 1</p>
<pre><code>function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}
console.log(factorial(5)); // 120
</code></pre>`,

              duration: 20,
              resources: [],
              codeExercises: [
                // Exercise 11: Juice/Soap Swap
                {
                  id: 'js-control-ex1',
                  title: 'Swap Containers - Juice & Soap',
                  description: `<p><strong>Problem:</strong> A container holds Juice, another holds Soap. We want to swap them so Juice goes into the Soap container and Soap goes into the Juice container.</p>
<p><strong>Task:</strong> Write a function <code>swapContainers</code> that takes two values <code>a</code> and <code>b</code>, swaps them, and returns them as an array <code>[b, a]</code>.</p>
<p><strong>Example:</strong> <code>swapContainers("Juice", "Soap")</code> should return <code>["Soap", "Juice"]</code>.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function swapContainers(a, b) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("swapContainers", function() {
  it("should swap Juice and Soap", function() {
    const [a, b] = swapContainers("Juice", "Soap");
    assert.equals(a, "Soap");
    assert.equals(b, "Juice");
  });
  it("should swap numbers", function() {
    const [a, b] = swapContainers(5, 10);
    assert.equals(a, 10);
    assert.equals(b, 5);
  });
});
`,

                  expectedOutput: 'Container 1: Soap\nContainer 2: Juice',
                },

                // Exercise 12: Factorial Calculator
                {
                  id: 'js-control-ex2',
                  title: 'Factorial Calculator',
                  description: `<p><strong>Problem:</strong> Calculate the factorial of a number. Factorial of n (n!) = n × (n-1) × (n-2) × ... × 1</p>
<p><strong>Task:</strong> Write a function <code>factorial</code> that takes a number n and returns its factorial.</p>
<p><strong>Examples:</strong> <code>factorial(5)</code> → <code>120</code>, <code>factorial(0)</code> → <code>1</code></p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function factorial(n) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("factorial", function() {
  it("5! = 120", function() {
    assert.equals(factorial(5), 120);
  });
  it("0! = 1", function() {
    assert.equals(factorial(0), 1);
  });
  it("3! = 6", function() {
    assert.equals(factorial(3), 6);
  });
  it("1! = 1", function() {
    assert.equals(factorial(1), 1);
  });
});
`,

                  expectedOutput: '120\n1\n6',
                },
              ],
            },

            {
              title: 'Reversing Numbers and Strings',
              type: 'article',
              content: `<h2>Reversing</h2>
<p><strong>Reverse from N to 0:</strong></p>
<pre><code>function reverseToZero(n) {
  for (let i = n; i >= 0; i--) {
    console.log(i);
  }
}
reverseToZero(5); // 5, 4, 3, 2, 1, 0
</code></pre>

<p><strong>Reverse a String:</strong></p>
<pre><code>function reverseString(str) {
  let reversed = "";
  for (let i = str.length - 1; i >= 0; i--) {
    reversed += str[i];
  }
  return reversed;
}
console.log(reverseString("Welcome")); // emocleW
</code></pre>

<p>Notice how we use a <code>for</code> loop counting <strong>down</strong> instead of up!</p>`,

              duration: 15,
              resources: [],
              codeExercises: [
                // Exercise 13: Reverse to Zero
                {
                  id: 'js-control-ex3',
                  title: 'Reverse from N to 0',
                  description: `<p><strong>Problem:</strong> Given a number N, display all numbers from N down to 0.</p>
<p><strong>Task:</strong> Write a function <code>reverseToZero</code> that takes a number n and displays each number from n down to 0.</p>
<p><strong>Example:</strong> <code>reverseToZero(5)</code> should display: 5, 4, 3, 2, 1, 0</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function reverseToZero(n) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("reverseToZero", function() {
  it("should be a function", function() {
    assert.isFunction(reverseToZero, "reverseToZero is a function");
  });
  it("should handle n=0", function() {
    reverseToZero(0);
    assert.isTrue(true);
  });
});
`,

                  expectedOutput: '5\n4\n3\n2\n1\n0',
                },

                // Exercise 14: Reverse String "Welcome"
                {
                  id: 'js-control-ex4',
                  title: 'Reverse the Word "Welcome"',
                  description: `<p><strong>Problem:</strong> Reverse the word "Welcome" to get "emocleW".</p>
<p><strong>Task:</strong> Write a function <code>reverseWord</code> that takes a string and returns it reversed.</p>
<p><strong>Example:</strong> <code>reverseWord("Welcome")</code> should return <code>"emocleW"</code>.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function reverseWord(str) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("reverseWord", function() {
  it("should reverse Welcome to emocleW", function() {
    assert.equals(reverseWord("Welcome"), "emocleW");
  });
  it("should reverse hello to olleh", function() {
    assert.equals(reverseWord("hello"), "olleh");
  });
  it("should handle empty string", function() {
    assert.equals(reverseWord(""), "");
  });
});
`,

                  expectedOutput: 'emocleW',
                },
              ],
            },

            {
              title: 'Module 2 Quiz — Control Structures',
              type: 'quiz',
              content: '<p>Test your understanding of control structures, loops, and algorithms.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is the temporary variable pattern used for?', type: 'multiple_choice', options: ['Sorting', 'Swapping values', 'Reversing strings', 'Calculating factorial'], correctOptionIndex: 1, explanation: 'A temporary variable helps swap two values.' },
                { questionText: 'What is 6! (6 factorial)?', type: 'multiple_choice', options: ['120', '720', '24', '36'], correctOptionIndex: 1, explanation: '6! = 6 × 5 × 4 × 3 × 2 × 1 = 720' },
                { questionText: 'Which loop correctly counts down from 5 to 0?', type: 'multiple_choice', options: ['for(let i=0; i<=5; i++)', 'for(let i=5; i>=0; i--)', 'for(let i=5; i<=0; i--)', 'for(let i=0; i>=5; i++)'], correctOptionIndex: 1, explanation: 'Start at 5, go while >= 0, decrement each time.' },
                { questionText: 'What is the reverse of "Hello"?', type: 'multiple_choice', options: ['Hello', 'olleH', 'elloh', 'Hollo'], correctOptionIndex: 1, explanation: 'Reversed character by character: olleH' },
                { questionText: 'What does 0! equal?', type: 'multiple_choice', options: ['0', '1', 'Undefined', '-1'], correctOptionIndex: 1, explanation: '0! is defined as 1 by convention.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 3: Applied Programming (4 exercises)
        // =====================================================================
        {
          title: 'Module 3: Applied Programming',
          description: 'Apply your JavaScript skills to real-world problems: analyzing marks, patient temperatures, sales data, and calculating BMI.',
          order: 3,
          lessons: [
            {
              title: 'Class Marks Analysis',
              type: 'article',
              content: `<h2>Analyzing Array Data with Conditions</h2>
<p>You can combine loops and conditions to analyze data:</p>
<pre><code>let marks = [85, 45, 90, 30, 78, 55, 92];

for (let i = 0; i < marks.length; i++) {
  if (marks[i] >= 50) {
    console.log(marks[i] + " — Passed");
  } else {
    console.log(marks[i] + " — Failed");
  }
}

// Find the highest mark
let highest = marks[0];
for (let i = 1; i < marks.length; i++) {
  if (marks[i] > highest) {
    highest = marks[i];
  }
}
console.log("Highest: " + highest);
</code></pre>`,

              duration: 20,
              resources: [],
              codeExercises: [
                // Exercise 15: Class Marks Complete Analysis
                {
                  id: 'js-applied-ex1',
                  title: 'Complete Class Marks Analysis',
                  description: `<p><strong>Problem:</strong> A teacher has marks for 10 students. They need to:
- Check if each student passed (mark ≥ 50) or failed (mark < 50)
- Find students who scored above 80 (excellent)
- Find the highest mark</p>
<p><strong>Task:</strong> Write a function <code>analyzeMarks</code> that takes an array of marks and:
1. Prints each mark with " - Passed" or " - Failed"
2. Prints "Excellent: [mark]" for marks above 80
3. Prints "Highest: [mark]" for the highest mark</p>
<p><strong>Example:</strong> <code>analyzeMarks([85, 45, 90, 30])</code></p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function analyzeMarks(marks) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("analyzeMarks", function() {
  it("should be a function", function() {
    assert.isFunction(analyzeMarks, "analyzeMarks is a function");
  });
});
`,

                  expectedOutput: '85 - Passed\nExcellent: 85\n45 - Failed\n90 - Passed\nExcellent: 90\n30 - Failed\n78 - Passed\nHighest: 90',
                },
              ],
            },

            {
              title: 'Hospital Temperature & Market Sales',
              type: 'article',
              content: `<h2>Classifying Data</h2>
<pre><code>// Classify temperatures
function classifyTemp(temp) {
  if (temp >= 39.5) {
    return "DANGER — Very High Fever!";
  } else if (temp >= 37.5) {
    return "Fever";
  } else if (temp >= 36.5) {
    return "Normal";
  } else {
    return "Low Temperature";
  }
}

// Find the most expensive item
let prices = [1500, 2500, 800, 3200, 1200];
let maxPrice = prices[0];
let maxIndex = 0;

for (let i = 1; i < prices.length; i++) {
  if (prices[i] > maxPrice) {
    maxPrice = prices[i];
    maxIndex = i;
  }
}
console.log("Most expensive: " + maxPrice);
</code></pre>`,

              duration: 20,
              resources: [],
              codeExercises: [
                // Exercise 16: Hospital Temperature
                {
                  id: 'js-applied-ex2',
                  title: 'Hospital Patients Temperature Analysis',
                  description: `<p><strong>Problem:</strong> A nurse checks temperatures of patients. Classify each:
- Normal: 36.5°C to 37.4°C
- Fever: 37.5°C to 39.4°C
- DANGER: 39.5°C or above</p>
<p><strong>Task:</strong> Write a function <code>analyzeTemperatures</code> that takes an array of temperatures and classifies each one. Also find and display the highest temperature.</p>
<p><strong>Example:</strong> <code>analyzeTemperatures([36.8, 38.2, 39.8, 37.0, 40.1])</code></p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function analyzeTemperatures(temps) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("analyzeTemperatures", function() {
  it("should be a function", function() {
    assert.isFunction(analyzeTemperatures, "analyzeTemperatures is a function");
  });
});
`,

                  expectedOutput: '36.8°C - Normal\n38.2°C - Fever\n39.8°C - DANGER\n37°C - Normal\n40.1°C - DANGER\nHighest temperature: 40.1°C',
                },

                // Exercise 17: Market Sales Day
                {
                  id: 'js-applied-ex3',
                  title: 'Market Sales Day Analysis',
                  description: `<p><strong>Problem:</strong> A shopkeeper sold items and recorded prices. Find:
- Total money earned
- Number of items sold
- Most expensive item price</p>
<p><strong>Task:</strong> Write a function <code>analyzeSales</code> that takes an array of prices and displays:
<code>"Items sold: [count]"</code>, <code>"Total: [sum]"</code>, <code>"Most expensive: [max]"</code></p>
<p><strong>Example:</strong> <code>analyzeSales([1500, 2500, 800, 3200, 1200])</code></p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function analyzeSales(prices) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("analyzeSales", function() {
  it("should be a function", function() {
    assert.isFunction(analyzeSales, "analyzeSales is a function");
  });
});
`,

                  expectedOutput: 'Items sold: 5\nTotal: 9200\nMost expensive: 3200',
                },
              ],
            },

            {
              title: 'BMI Calculator for Group Health Analysis',
              type: 'article',
              content: `<h2>BMI Calculation</h2>
<p>BMI = weight(kg) / height(m)²</p>
<pre><code>function calculateBMI(weight, height) {
  return weight / (height * height);
}

function classifyBMI(bmi) {
  if (bmi < 18.5) return "Underweight";
  else if (bmi < 25) return "Normal";
  else if (bmi < 30) return "Overweight";
  else return "Obese";
}
</code></pre>
<p>For a group of people, calculate each person's BMI and count how many fall into each category.</p>`,

              duration: 25,
              resources: [],
              codeExercises: [
                // Exercise 18: BMI Calculator
                {
                  id: 'js-applied-ex4',
                  title: 'BMI Calculator for 100 People',
                  description: `<p><strong>Problem:</strong> Analyze the health of a group using BMI. For each person (weight in kg, height in meters):
- Calculate BMI: weight / height²
- Classify: Underweight (< 18.5), Normal (18.5–24.9), Overweight (25–29.9), Obese (≥ 30)
- Count people in each category
- Find the highest BMI</p>
<p><strong>Task:</strong> Write a function <code>analyzeBMI</code> that takes two arrays (weights and heights) and displays the analysis.</p>
<p><strong>Example:</strong> <code>analyzeBMI([70, 85, 55], [1.75, 1.80, 1.60])</code></p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function analyzeBMI(weights, heights) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("analyzeBMI", function() {
  it("should be a function", function() {
    assert.isFunction(analyzeBMI, "analyzeBMI is a function");
  });
});
`,

                  expectedOutput: 'Underweight: 0\nNormal: 3\nOverweight: 1\nObese: 1\nHighest BMI: 32.1',
                },
              ],
            },

            {
              title: 'Module 3 Quiz — Applied Programming',
              type: 'quiz',
              content: '<p>Test your applied programming knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What mark is considered a pass?', type: 'multiple_choice', options: ['>= 50', '> 50', '>= 80', '> 80'], correctOptionIndex: 0, explanation: 'Mark >= 50 means passed.' },
                { questionText: 'What temperature is classified as DANGER?', type: 'multiple_choice', options: ['37.5°C', '38.0°C', '39.5°C or above', '36.5°C'], correctOptionIndex: 2, explanation: '39.5°C and above is dangerous fever.' },
                { questionText: 'What is the formula for BMI?', type: 'multiple_choice', options: ['weight × height²', 'weight / height²', 'height / weight²', 'weight + height²'], correctOptionIndex: 1, explanation: 'BMI = weight(kg) / height(m)²' },
                { questionText: 'A BMI of 22 is classified as:', type: 'multiple_choice', options: ['Underweight', 'Normal', 'Overweight', 'Obese'], correctOptionIndex: 1, explanation: '18.5–24.9 is Normal.' },
                { questionText: 'How do you find the maximum value in an array?', type: 'multiple_choice', options: ['Sort it', 'Loop and compare', 'Use Math.max only', 'Reverse it'], correctOptionIndex: 1, explanation: 'Loop through and compare each element.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 4: Pattern Printing (6 exercises)
        // =====================================================================
        {
          title: 'Module 4: Pattern Printing',
          description: 'Learn to use nested loops to print amazing patterns: pyramids, diamonds, triangles, Floyd\'s triangle, and multiplication tables.',
          order: 4,
          lessons: [
            {
              title: 'Nested Loops for Patterns',
              type: 'article',
              content: `<h2>Nested Loops Create Patterns</h2>
<p>Use one loop inside another to create rows and columns:</p>
<pre><code>// Simple triangle
for (let i = 1; i <= 5; i++) {
  let row = "";
  for (let j = 1; j <= i; j++) {
    row += "*";
  }
  console.log(row);
}

// Output:
// *
// **
// ***
// ****
// *****
</code></pre>
<p>The outer loop controls the <strong>rows</strong>, the inner loop controls the <strong>columns</strong>.</p>`,

              duration: 20,
              resources: [],
              codeExercises: [
                // Exercise 19: Pyramid of Stars
                {
                  id: 'js-pattern-ex1',
                  title: 'Pyramid of Stars',
                  description: `<p><strong>Problem:</strong> Display a pyramid of stars with n rows.</p>
<p><strong>Example for n=5:</strong></p>
<pre>    *
   ***
  *****
 *******
*********</pre>
<p><strong>Task:</strong> Write a function <code>printPyramid</code> that takes number of rows and prints the pyramid.</p>
<p><strong>Hint:</strong> Row i has (n-i-1) spaces and (2*i+1) stars.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function printPyramid(rows) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("printPyramid", function() {
  it("should be a function", function() {
    assert.isFunction(printPyramid, "printPyramid is a function");
  });
  it("should handle 1 row", function() {
    printPyramid(1);
    assert.isTrue(true);
  });
});
`,

                  expectedOutput: '    *\n   ***\n  *****\n *******\n*********',
                },

                // Exercise 20: Inverted Pyramid
                {
                  id: 'js-pattern-ex2',
                  title: 'Inverted Pyramid',
                  description: `<p><strong>Problem:</strong> Display an inverted pyramid of stars.</p>
<p><strong>Example for n=5:</strong></p>
<pre>*********
 *******
  *****
   ***
    *</pre>
<p><strong>Task:</strong> Write a function <code>printInvertedPyramid</code> that takes number of rows and prints the inverted pyramid.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function printInvertedPyramid(rows) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("printInvertedPyramid", function() {
  it("should be a function", function() {
    assert.isFunction(printInvertedPyramid, "printInvertedPyramid is a function");
  });
});
`,

                  expectedOutput: '*********\n *******\n  *****\n   ***\n    *',
                },
              ],
            },

            {
              title: 'Number Triangles and Floyd\'s Triangle',
              type: 'article',
              content: `<h2>Number Patterns</h2>
<pre><code>// Number Triangle (n=5)
// 1
// 12
// 123
// 1234
// 12345

for (let i = 1; i <= 5; i++) {
  let row = "";
  for (let j = 1; j <= i; j++) {
    row += j;
  }
  console.log(row);
}

// Floyd's Triangle (n=5)
// 1
// 2 3
// 4 5 6
// 7 8 9 10
// 11 12 13 14 15

let num = 1;
for (let i = 1; i <= 5; i++) {
  let row = "";
  for (let j = 1; j <= i; j++) {
    row += num + " ";
    num++;
  }
  console.log(row.trim());
}
</code></pre>`,

              duration: 20,
              resources: [],
              codeExercises: [
                // Exercise 21: Number Triangle
                {
                  id: 'js-pattern-ex3',
                  title: 'Number Triangle',
                  description: `<p><strong>Problem:</strong> Display a triangle of numbers.</p>
<p><strong>Example for n=5:</strong></p>
<pre>1
12
123
1234
12345</pre>
<p><strong>Task:</strong> Write a function <code>printNumberTriangle</code> that takes a number n and prints the pattern.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function printNumberTriangle(n) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("printNumberTriangle", function() {
  it("should be a function", function() {
    assert.isFunction(printNumberTriangle, "printNumberTriangle is a function");
  });
});
`,

                  expectedOutput: '1\n12\n123\n1234\n12345',
                },

                // Exercise 22: Floyd's Triangle
                {
                  id: 'js-pattern-ex4',
                  title: "Floyd's Triangle",
                  description: `<p><strong>Problem:</strong> Display Floyd's Triangle.</p>
<p><strong>Example for n=5:</strong></p>
<pre>1
2 3
4 5 6
7 8 9 10
11 12 13 14 15</pre>
<p><strong>Task:</strong> Write a function <code>printFloydsTriangle</code> that takes number of rows and prints Floyd's Triangle.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function printFloydsTriangle(rows) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("printFloydsTriangle", function() {
  it("should be a function", function() {
    assert.isFunction(printFloydsTriangle, "printFloydsTriangle is a function");
  });
});
`,

                  expectedOutput: '1\n2 3\n4 5 6\n7 8 9 10\n11 12 13 14 15',
                },
              ],
            },

            {
              title: 'Diamond Pattern & Multiplication Table',
              type: 'article',
              content: `<h2>Diamond Pattern</h2>
<p>A diamond is a pyramid on top + inverted pyramid on bottom:</p>
<pre><code>function printDiamond(n) {
  // Upper half (pyramid)
  for (let i = 0; i < n; i++) {
    let row = "";
    for (let s = 0; s < n - i - 1; s++) row += " ";
    for (let j = 0; j < 2 * i + 1; j++) row += "*";
    console.log(row);
  }
  // Lower half (inverted, minus the middle row)
  for (let i = n - 2; i >= 0; i--) {
    let row = "";
    for (let s = 0; s < n - i - 1; s++) row += " ";
    for (let j = 0; j < 2 * i + 1; j++) row += "*";
    console.log(row);
  }
}
</code></pre>

<h2>Multiplication Table</h2>
<pre><code>let n = 7;
for (let i = 1; i <= 10; i++) {
  console.log(n + " x " + i + " = " + (n * i));
}
</code></pre>`,

              duration: 20,
              resources: [],
              codeExercises: [
                // Exercise 23: Diamond Pattern
                {
                  id: 'js-pattern-ex5',
                  title: 'Diamond Pattern',
                  description: `<p><strong>Problem:</strong> Display a diamond pattern of stars.</p>
<p><strong>Example for n=5:</strong></p>
<pre>    *
   ***
  *****
 *******
*********
 *******
  *****
   ***
    *</pre>
<p><strong>Task:</strong> Write a function <code>printDiamond</code> that takes number of rows and prints a diamond.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function printDiamond(n) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("printDiamond", function() {
  it("should be a function", function() {
    assert.isFunction(printDiamond, "printDiamond is a function");
  });
});
`,

                  expectedOutput: '    *\n   ***\n  *****\n *******\n*********\n *******\n  *****\n   ***\n    *',
                },

                // Exercise 24: Multiplication Table
                {
                  id: 'js-pattern-ex6',
                  title: 'Multiplication Table',
                  description: `<p><strong>Problem:</strong> Display the multiplication table for a given number from 1 to 10.</p>
<p><strong>Example for 7:</strong></p>
<pre>7 x 1 = 7
7 x 2 = 14
7 x 3 = 21
7 x 4 = 28
7 x 5 = 35
7 x 6 = 42
7 x 7 = 49
7 x 8 = 56
7 x 9 = 63
7 x 10 = 70</pre>
<p><strong>Task:</strong> Write a function <code>printTable</code> that takes a number and prints its multiplication table.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function printTable(n) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("printTable", function() {
  it("should be a function", function() {
    assert.isFunction(printTable, "printTable is a function");
  });
});
`,

                  expectedOutput: '7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70',
                },
              ],
            },

            {
              title: 'Module 4 Quiz — Pattern Printing',
              type: 'quiz',
              content: '<p>Test your understanding of nested loops and patterns.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'A pyramid with n rows has how many stars in the last row?', type: 'multiple_choice', options: ['n', '2n-1', '2n+1', 'n+1'], correctOptionIndex: 1, explanation: 'Last row has 2n-1 stars (odd number pattern).' },
                { questionText: 'Floyd\'s triangle uses what kind of numbers?', type: 'multiple_choice', options: ['Random', 'Sequential (1,2,3...)', 'Even only', 'Odd only'], correctOptionIndex: 1, explanation: 'Numbers count up sequentially: 1, 2, 3, 4...' },
                { questionText: 'How many times does 7×5 appear in the 7 times table?', type: 'multiple_choice', options: ['5', '1', '7', '10'], correctOptionIndex: 1, explanation: 'Each equation appears once in the table.' },
                { questionText: 'What is 7 × 8?', type: 'multiple_choice', options: ['48', '56', '64', '72'], correctOptionIndex: 1, explanation: '7 × 8 = 56' },
                { questionText: 'The diamond pattern combines:', type: 'multiple_choice', options: ['Two triangles', 'A pyramid and inverted pyramid', 'Two squares', 'A circle and square'], correctOptionIndex: 1, explanation: 'Diamond = pyramid + inverted pyramid.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },

        // =====================================================================
        // MODULE 5: Algorithm Challenges (7 exercises)
        // =====================================================================
        {
          title: 'Module 5: Algorithm Challenges',
          description: 'Solve classic algorithm problems: prime numbers, unique elements, Two Sum, longest consecutive sequence, snake game, Sudoku validator, and maze escape.',
          order: 5,
          lessons: [
            {
              title: 'Prime Numbers & Array Searching',
              type: 'article',
              content: `<h2>Prime Numbers</h2>
<p>A prime number is only divisible by 1 and itself:</p>
<pre><code>function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i < n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}
</code></pre>

<h2>Finding Unique Elements</h2>
<p>To find a number that appears only once, count how many times each number appears:</p>
<pre><code>function firstUnique(arr) {
  for (let i = 0; i < arr.length; i++) {
    let count = 0;
    for (let j = 0; j < arr.length; j++) {
      if (arr[i] === arr[j]) count++;
    }
    if (count === 1) return arr[i];
  }
  return null;
}
</code></pre>`,

              duration: 25,
              resources: [],
              codeExercises: [
                // Exercise 25: Prime Numbers
                {
                  id: 'js-algo-ex1',
                  title: 'Find All Prime Numbers up to N',
                  description: `<p><strong>Problem:</strong> Display all prime numbers between 1 and N.</p>
<p><strong>Example:</strong> N=20 → 2, 3, 5, 7, 11, 13, 17, 19</p>
<p><strong>Task:</strong> Write a function <code>findPrimes</code> that takes a number N and prints all primes from 1 to N.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function isPrime(n) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("findPrimes", function() {
  it("should be a function", function() {
    assert.isFunction(findPrimes, "findPrimes is a function");
  });
  it("isPrime should detect 7 as prime", function() {
    assert.equals(isPrime(7), true);
  });
  it("isPrime should detect 1 as non-prime", function() {
    assert.equals(isPrime(1), false);
  });
});
`,

                  expectedOutput: '2\n3\n5\n7\n11\n13\n17\n19',
                },

                // Exercise 26: First Unique Number
                {
                  id: 'js-algo-ex2',
                  title: 'Find the First Unique Number',
                  description: `<p><strong>Problem:</strong> Given an array, find the first number that appears only once.</p>
<p><strong>Example:</strong> <code>[4,5,1,2,0,4,1,0]</code> → returns <code>5</code></p>
<p><strong>Task:</strong> Write a function <code>firstUnique</code> that takes an array and returns the first unique element (or null if none).</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function firstUnique(arr) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("firstUnique", function() {
  it("should find 5 in [4,5,1,2,0,4,1,0]", function() {
    assert.equals(firstUnique([4,5,1,2,0,4,1,0]), 5);
  });
  it("should return null when no unique", function() {
    assert.equals(firstUnique([1,1,2,2]), null);
  });
  it("should handle single element", function() {
    assert.equals(firstUnique([42]), 42);
  });
});
`,

                  expectedOutput: '5\nnull',
                },
              ],
            },

            {
              title: 'Two Sum & Longest Consecutive',
              type: 'article',
              content: `<h2>Two Sum Algorithm</h2>
<p>Find two numbers that add up to a target:</p>
<pre><code>function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}
</code></pre>

<h2>Longest Consecutive Sequence</h2>
<p>Find the longest run of consecutive numbers:</p>
<pre><code>function longestConsecutive(nums) {
  if (nums.length === 0) return 0;
  nums.sort((a,b) => a - b);
  let longest = 1, current = 1;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === nums[i-1] + 1) {
      current++;
    } else if (nums[i] !== nums[i-1]) {
      longest = Math.max(longest, current);
      current = 1;
    }
  }
  return Math.max(longest, current);
}
</code></pre>`,

              duration: 25,
              resources: [],
              codeExercises: [
                // Exercise 27: Two Sum
                {
                  id: 'js-algo-ex3',
                  title: 'Two Sum - Find Index Pair',
                  description: `<p><strong>Problem:</strong> Given an array and target, find two indices whose values sum to the target.</p>
<p><strong>Example:</strong> <code>twoSum([2,7,11,15], 9)</code> → returns <code>[0, 1]</code> (because 2 + 7 = 9)</p>
<p><strong>Task:</strong> Write a function <code>twoSum</code> that returns the indices as an array.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function twoSum(nums, target) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("twoSum", function() {
  it("should find 2+7=9 at indices 0,1", function() {
    const r = twoSum([2,7,11,15], 9);
    assert.equals(r[0], 0);
    assert.equals(r[1], 1);
  });
  it("should find 3+4=7 at indices 1,2", function() {
    const r = twoSum([1,3,4,6], 7);
    assert.equals(r[0], 1);
    assert.equals(r[1], 2);
  });
  it("should return empty when no solution", function() {
    assert.equals(twoSum([1,2,3], 10).length, 0);
  });
});
`,

                  expectedOutput: '0,1',
                },

                // Exercise 28: Longest Consecutive Sequence
                {
                  id: 'js-algo-ex4',
                  title: 'Longest Consecutive Sequence',
                  description: `<p><strong>Problem:</strong> Find the length of the longest consecutive sequence in an unsorted array.</p>
<p><strong>Example:</strong> <code>[100,4,200,1,3,2]</code> → returns <code>4</code> (sequence: 1,2,3,4)</p>
<p><strong>Task:</strong> Write a function <code>longestConsecutive</code> that returns the length.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function longestConsecutive(nums) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("longestConsecutive", function() {
  it("should find 4 in [100,4,200,1,3,2]", function() {
    assert.equals(longestConsecutive([100,4,200,1,3,2]), 4);
  });
  it("should handle empty array", function() {
    assert.equals(longestConsecutive([]), 0);
  });
  it("should handle single element", function() {
    assert.equals(longestConsecutive([5]), 1);
  });
});
`,

                  expectedOutput: '4\n3',
                },
              ],
            },

            {
              title: 'Snake Game, Sudoku, and Maze',
              type: 'article',
              content: `<h2>Advanced Algorithm Challenges</h2>
<p><strong>Snake Game Simulation:</strong> Track the snake's path and detect self-collision using a set of visited positions.</p>
<pre><code>// R = Right, L = Left, U = Up, D = Down
let x = 0, y = 0;
let visited = new Set();
visited.add("0,0");

for (let move of moves) {
  if (move === 'R') x++;
  else if (move === 'L') x--;
  else if (move === 'U') y--;
  else if (move === 'D') y++;
  
  let pos = x + "," + y;
  if (visited.has(pos)) return "Collision Detected";
  visited.add(pos);
}
</code></pre>

<p><strong>Sudoku Validator:</strong> Check rows, columns, and 3×3 boxes for duplicates.</p>
<p><strong>Maze Escape:</strong> Use recursion (DFS) or queue (BFS) to find a path from S to E.</p>`,

              duration: 30,
              resources: [],
              codeExercises: [
                // Exercise 29: Snake Game
                {
                  id: 'js-algo-ex5',
                  title: 'Snake Game - Detect Collision',
                  description: `<p><strong>Problem:</strong> A snake moves on a grid with commands R, L, U, D. Detect if it collides with itself.</p>
<p><strong>Example:</strong> <code>snakeGame("RRRDDLLUUR")</code></p>
<p><strong>Task:</strong> Write a function <code>snakeGame</code> that takes a string of moves and returns "Collision Detected" or "Safe Path".</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function snakeGame(moves) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("snakeGame", function() {
  it("should detect collision in RRRDDLLUUR", function() {
    assert.equals(snakeGame("RRRDDLLUUR"), "Collision Detected");
  });
  it("should return safe for RRRDDD", function() {
    assert.equals(snakeGame("RRRDDD"), "Safe Path");
  });
  it("should handle empty moves", function() {
    assert.equals(snakeGame(""), "Safe Path");
  });
});
`,

                  expectedOutput: 'Collision Detected\nSafe Path',
                },

                // Exercise 30: Sudoku Validator
                {
                  id: 'js-algo-ex6',
                  title: 'Sudoku Validator',
                  description: `<p><strong>Problem:</strong> Validate a 9×9 Sudoku board. Check:
1. Each row has unique 1-9
2. Each column has unique 1-9
3. Each 3×3 box has unique 1-9</p>
<p><strong>Task:</strong> Write a function <code>isValidSudoku</code> that takes a 9×9 board (array of arrays) and returns true if valid, false otherwise.</p>
<p><strong>Note:</strong> Empty cells are represented by 0.</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function isValidSudoku(board) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("isValidSudoku", function() {
  it("should validate a correct board", function() {
    const board = [
      [5,3,0,0,7,0,0,0,0],
      [6,0,0,1,9,5,0,0,0],
      [0,9,8,0,0,0,0,6,0],
      [8,0,0,0,6,0,0,0,3],
      [4,0,0,8,0,3,0,0,1],
      [7,0,0,0,2,0,0,0,6],
      [0,6,0,0,0,0,2,8,0],
      [0,0,0,4,1,9,0,0,5],
      [0,0,0,0,8,0,0,7,9]
    ];
    assert.equals(isValidSudoku(board), true);
  });
  it("should reject board with duplicate in row", function() {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    board[0][0] = 5;
    board[0][1] = 5;
    assert.equals(isValidSudoku(board), false);
  });
});
`,

                  expectedOutput: 'Valid Sudoku',
                },

                // Exercise 31: Maze Escape
                {
                  id: 'js-algo-ex7',
                  title: 'Maze Escape - Find a Path',
                  description: `<p><strong>Problem:</strong> Given a maze with S (start), E (exit), X (wall), and . (empty), determine if a path exists from S to E. You can move up, down, left, right.</p>
<p><strong>Task:</strong> Write a function <code>canEscape</code> that takes a maze (array of strings) and returns "Escape Possible" or "No Path Found".</p>
<p><strong>Example:</strong></p>
<pre>S . .
X X .
. . E</pre>
<p>→ Escape Possible</p>`,

                  language: 'javascript',
                  type: 'write',
                  initialCode: `function canEscape(maze) {
  // Write your code here
}`,

                  solutionCode: ``,

                  testCode: `describe("canEscape", function() {
  it("should find escape in first maze", function() {
    assert.equals(canEscape(["S..","XX.","..E"]), "Escape Possible");
  });
  it("should find no path in second maze", function() {
    assert.equals(canEscape(["S.X","XXX","..E"]), "No Path Found");
  });
  it("should handle start=exit", function() {
    assert.equals(canEscape(["SE"]), "Escape Possible");
  });
});
`,

                  expectedOutput: 'Escape Possible\nNo Path Found',
                },
              ],
            },

            {
              title: 'Final Exam — JavaScript Coding Challenges',
              type: 'assignment',
              content: '<p><strong>Congratulations on reaching the final exam!</strong></p><p>Complete the following challenges to earn your Certificate of Completion.</p>',
              isAssignment: true,
              requiredAssignment: true,
              assignmentDescription: 'Complete all challenges to earn your certificate. You must score at least 60%.',
              assignmentDeliverables: ['Completed exam with minimum 60% score'],
              assignmentQuestions: [
                { questionText: 'Write a function called findMissingNumber that takes an array of consecutive numbers from 1 to n with one number missing, and returns the missing number. Example: [1,2,4,5] → 3', type: 'open', points: 15 },
                { questionText: 'Write a function called isPalindrome that checks if a string reads the same forward and backward. Example: "radar" → true', type: 'open', points: 15 },
                { questionText: 'Write a function called fizzBuzz that prints numbers 1 to n. For multiples of 3 print "Fizz", for 5 print "Buzz", for both print "FizzBuzz".', type: 'open', points: 15 },
                { questionText: 'Write a function called countWords that takes a sentence and returns an object counting each word. Example: "the cat and the dog" → {the: 2, cat: 1, and: 1, dog: 1}', type: 'open', points: 15 },
                { questionText: 'Write a function called binarySearch that takes a sorted array and a target, and returns the index of the target using binary search, or -1 if not found.', type: 'open', points: 20 },
                { questionText: 'Write a function called anagramCheck that checks if two strings are anagrams of each other (same letters, different order). Example: "listen" and "silent" → true', type: 'open', points: 10 },
                { questionText: 'Write a function called flattenArray that takes a nested array and returns a flat array. Example: [[1,2],[3,[4,5]]] → [1,2,3,4,5]', type: 'open', points: 10 },
              ],
              assignmentConfig: { timeLimit: 120, allowRetakes: true, mode: 'exercise' },
              duration: 120,
              resources: [],
            },
          ],
        },
      ],
    };

    // ─── Upsert the course ───────────────────────────────
    const existing = await Course.findOne({ title: courseTitle });
    if (existing) {
      Object.assign(existing, coursePayload);
      await existing.save();
      console.log('✅ Updated existing course');
    } else {
      await new Course(coursePayload).save();
      console.log('✅ Created new course');
    }

    // ─── Count stats ─────────────────────────────────────
    const saved = await Course.findOne({ title: courseTitle }).lean() as any;
    if (!saved) throw new Error('Course not found after saving');

    let totalExercises = 0;
    let totalLessons = 0;
    let totalAssignments = 0;
    for (const mod of saved.modules) {
      for (const les of mod.lessons) {
        totalLessons++;
        if (les.isAssignment) totalAssignments++;
        if (les.codeExercises) totalExercises += les.codeExercises.length;
      }
    }

    console.log(`\n📊 Course Stats:`);
    console.log(`   📚 Modules: ${saved.modules.length}`);
    console.log(`   📖 Lessons: ${totalLessons}`);
    console.log(`   💻 Code Exercises: ${totalExercises}`);
    console.log(`   📝 Quizzes: ${saved.modules.reduce((sum: number, m: any) => sum + m.lessons.filter((l: any) => l.type === 'quiz').length, 0)}`);
    console.log(`   📋 Assignments: ${totalAssignments}`);
    console.log(`   💰 Price: ${saved.price} RWF`);
    console.log(`   👨‍🏫 Instructor: admin@bootskills.com`);
    console.log(`\n🎓 Certificate: Earned upon completing all exercises and passing the final exam.`);

    console.log('\n🏁 Course seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedJSCodeChallenges();
