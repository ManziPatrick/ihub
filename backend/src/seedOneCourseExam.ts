import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Course } from './models/Course';
import { User } from './models/User';

dotenv.config();

const seedOneCourseExam = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    // Find the admin/super_admin user to use as instructor
    const admin = await User.findOne({ role: { $in: ['super_admin', 'admin'] } });
    if (!admin) {
      console.error('❌ No admin/super_admin user found. Run seedBaseUsers first.');
      process.exit(1);
    }
    console.log(`👤 Using instructor: ${admin.fullName || admin.username} (${admin._id})`);

    // ── Course: One module with 1 exam lesson ─────────────────────────
    const courseData = {
      title: "JavaScript Fundamentals — Certification Exam",
      description: "<p>Test your core JavaScript knowledge with this certification exam. Covers variables, functions, objects, arrays, DOM manipulation, and modern ES6+ syntax. Passing score: 70%. Time limit: 45 minutes.</p>",
      price: 0,
      category: "Technology",
      level: "Intermediate",
      thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=1974",
      instructor: admin._id,
      school: "IHUB Academy",
      status: "published",
      passingScore: 70,
      modules: [
        {
          title: "Final Certification Assessment",
          description: "This module contains the final JavaScript certification exam. Complete all questions within the time limit.",
          lessons: [
            {
              title: "JavaScript Fundamentals Exam",
              content: "<p>Answer all questions carefully. You have <strong>45 minutes</strong> to complete this exam. The passing score is <strong>70%</strong>.</p><ul><li>20 multiple-choice questions (4 points each = 80 points total)</li><li>2 open-ended questions (10 points each = 20 points total)</li><li>Total: 100 points</li></ul>",
              type: "assignment",
              isAssignment: true,
              requiredAssignment: true,
              assignmentDescription: "Complete the JavaScript Fundamentals certification exam. Answer all 22 questions within the 45-minute time limit.",
              assignmentConfig: {
                timeLimit: 45,
                allowRetakes: false,
                disableRightClick: true,
                mode: "exam"
              },
              assignmentQuestions: [
                // MCQ Questions (4 pts each)
                {
                  questionText: "Which of the following is NOT a JavaScript data type?",
                  type: "mcq",
                  options: ["String", "Number", "Boolean", "Character"],
                  correctOptionIndex: 3,
                  explanation: "JavaScript does not have a 'Character' data type. It uses strings for single characters.",
                  points: 4
                },
                {
                  questionText: "What does `typeof null` return in JavaScript?",
                  type: "mcq",
                  options: ["'null'", "'undefined'", "'object'", "'boolean'"],
                  correctOptionIndex: 2,
                  explanation: "This is a well-known JavaScript bug/feature. `typeof null` returns 'object' due to legacy behavior from the first version of JavaScript.",
                  points: 4
                },
                {
                  questionText: "Which method adds an element to the end of an array?",
                  type: "mcq",
                  options: ["push()", "pop()", "shift()", "unshift()"],
                  correctOptionIndex: 0,
                  explanation: "push() adds one or more elements to the end of an array and returns the new length.",
                  points: 4
                },
                {
                  questionText: "What is the result of `'5' - 3` in JavaScript?",
                  type: "mcq",
                  options: ["'53'", "2", "'2'", "NaN"],
                  correctOptionIndex: 1,
                  explanation: "The subtraction operator (-) coerces strings to numbers. So '5' becomes 5, and 5 - 3 = 2 (a number).",
                  points: 4
                },
                {
                  questionText: "Which keyword is used to declare a constant variable?",
                  type: "mcq",
                  options: ["var", "let", "const", "static"],
                  correctOptionIndex: 2,
                  explanation: "const declares a block-scoped constant whose value cannot be reassigned.",
                  points: 4
                },
                {
                  questionText: "What does the `===` operator check?",
                  type: "mcq",
                  options: ["Value only", "Type only", "Value and type", "Reference only"],
                  correctOptionIndex: 2,
                  explanation: "The strict equality operator (===) checks both value AND type without performing type coercion.",
                  points: 4
                },
                {
                  questionText: "Which of the following is a truthy value in JavaScript?",
                  type: "mcq",
                  options: ["0", "\"\"", "null", "\"false\""],
                  correctOptionIndex: 3,
                  explanation: "The string \"false\" is non-empty, so it's truthy. All other options are falsy values.",
                  points: 4
                },
                {
                  questionText: "What is a closure in JavaScript?",
                  type: "mcq",
                  options: [
                    "A way to close a browser tab",
                    "A function with access to its outer scope even after the outer function returns",
                    "A method to end a loop early",
                    "A data structure for closed objects"
                  ],
                  correctOptionIndex: 1,
                  explanation: "A closure is created when a function retains access to variables from its outer (enclosing) scope, even after that outer function has finished executing.",
                  points: 4
                },
                {
                  questionText: "Which method creates a new array with elements that pass a test?",
                  type: "mcq",
                  options: ["forEach()", "map()", "filter()", "reduce()"],
                  correctOptionIndex: 2,
                  explanation: "filter() creates a new array containing only the elements that pass the provided test function.",
                  points: 4
                },
                {
                  questionText: "What does `Promise.all()` do?",
                  type: "mcq",
                  options: [
                    "Runs promises sequentially",
                    "Waits for all promises to resolve or any to reject",
                    "Returns the fastest promise",
                    "Cancels all pending promises"
                  ],
                  correctOptionIndex: 1,
                  explanation: "Promise.all() takes an array of promises and returns a single promise that resolves when ALL input promises resolve, or rejects immediately if ANY rejects.",
                  points: 4
                },
                {
                  questionText: "How do you access the first property of an object `obj`?",
                  type: "mcq",
                  options: [
                    "obj[0]",
                    "Object.keys(obj)[0]",
                    "obj.first()",
                    "obj.getItem(0)"
                  ],
                  correctOptionIndex: 1,
                  explanation: "JavaScript objects don't have ordered properties. Object.keys(obj) returns an array of keys, and [0] accesses the first one.",
                  points: 4
                },
                {
                  questionText: "What is the spread operator used for?",
                  type: "mcq",
                  options: [
                    "Deleting array elements",
                    "Expanding iterables into individual elements",
                    "Spreading errors across handlers",
                    "Looping through objects"
                  ],
                  correctOptionIndex: 1,
                  explanation: "The spread operator (...) expands iterables (arrays, strings, objects) into their individual elements.",
                  points: 4
                },
                {
                  questionText: "What does `document.querySelector('.class')` return?",
                  type: "mcq",
                  options: [
                    "All elements with that class",
                    "The first element matching the selector",
                    "The last element matching the selector",
                    "An array of all matching elements"
                  ],
                  correctOptionIndex: 1,
                  explanation: "querySelector returns the FIRST element that matches the CSS selector. Use querySelectorAll to get all matches.",
                  points: 4
                },
                {
                  questionText: "Which event fires when a user clicks an element?",
                  type: "mcq",
                  options: ["mouseover", "change", "click", "submit"],
                  correctOptionIndex: 2,
                  explanation: "The 'click' event fires when a pointing device button is pressed and released on an element.",
                  points: 4
                },
                {
                  questionText: "What is the difference between `null` and `undefined`?",
                  type: "mcq",
                  options: [
                    "They are exactly the same",
                    "undefined means a variable is declared but not assigned; null is an intentional absence",
                    "null means undefined; undefined means null",
                    "undefined is a type, null is a value"
                  ],
                  correctOptionIndex: 1,
                  explanation: "undefined means a variable has been declared but has not been assigned a value. null is an intentional assignment representing 'no value'.",
                  points: 4
                },
                {
                  questionText: "What does `Array.isArray()` do?",
                  type: "mcq",
                  options: [
                    "Checks if a value is an array",
                    "Creates a new array",
                    "Sorts an array",
                    "Measures array length"
                  ],
                  correctOptionIndex: 0,
                  explanation: "Array.isArray() returns true if the argument is an array, false otherwise. It's more reliable than typeof for arrays.",
                  points: 4
                },
                {
                  questionText: "How do you handle errors in async/await?",
                  type: "mcq",
                  options: [
                    "Using .catch() only",
                    "Using try/catch blocks",
                    "Using if/else statements",
                    "Errors are automatically handled"
                  ],
                  correctOptionIndex: 1,
                  explanation: "With async/await, errors are handled using try/catch blocks around the await expressions.",
                  points: 4
                },
                {
                  questionText: "What does `localStorage` allow you to do?",
                  type: "mcq",
                  options: [
                    "Store data that persists after closing the browser",
                    "Store data only for the current session",
                    "Store data on the server",
                    "Store data in a database"
                  ],
                  correctOptionIndex: 0,
                  explanation: "localStorage stores data in the browser that persists even after closing and reopening the browser. sessionStorage is for session-only data.",
                  points: 4
                },
                {
                  questionText: "Which method converts a JSON string to a JavaScript object?",
                  type: "mcq",
                  options: [
                    "JSON.stringify()",
                    "JSON.parse()",
                    "JSON.toObject()",
                    "JSON.convert()"
                  ],
                  correctOptionIndex: 1,
                  explanation: "JSON.parse() parses a JSON string and returns the corresponding JavaScript value or object.",
                  points: 4
                },
                {
                  questionText: "What is the purpose of `use strict`?",
                  type: "mcq",
                  options: [
                    "Makes JavaScript run faster",
                    "Enforces stricter parsing and error handling",
                    "Disables all console logs",
                    "Prevents variable declarations"
                  ],
                  correctOptionIndex: 1,
                  explanation: "\"use strict\" enables strict mode which catches common coding errors and prevents the use of potentially problematic features like undeclared variables.",
                  points: 4
                },
                // Open-ended Questions (10 pts each)
                {
                  questionText: "Explain the difference between `let`, `const`, and `var` in JavaScript. When would you use each one?",
                  type: "open",
                  points: 10
                },
                {
                  questionText: "Describe how the `this` keyword works in JavaScript. Give an example of a situation where `this` might behave unexpectedly and how to fix it (e.g., using arrow functions or .bind()).",
                  type: "open",
                  points: 10
                }
              ]
            }
          ]
        }
      ]
    };

    // Upsert the course (create if doesn't exist, update if it does)
    const course = await Course.findOneAndUpdate(
      { title: courseData.title },
      { $set: courseData },
      { upsert: true, new: true }
    );
    console.log(`✅ Seeded exam course: "${course.title}" (ID: ${course._id})`);
    console.log(`   - Module: "${course.modules[0].title}"`);
    console.log(`   - Lesson: "${course.modules[0].lessons[0].title}"`);
    console.log(`   - ${course.modules[0].lessons[0].assignmentQuestions.length} exam questions`);

    console.log('\n🚀 Exam course seeded successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedOneCourseExam();
