import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

/**
 * stripYouTubeUrl: remove videoUrl fields per the user's instruction
 */
function stripYoutube(obj: any): any {
  if (Array.isArray(obj)) return obj.map(stripYoutube);
  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'videoUrl' || k === 'videoTitle' || k === 'videoThumbnail') continue;
      cleaned[k] = stripYoutube(v);
    }
    return cleaned;
  }
  return obj;
}

const seedDataStructuresCourse = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to database — seeding Data Structures Mastery course...');

    // Find an admin or trainer to be the instructor
    let instructor = await User.findOne({ role: { $in: ['admin', 'trainer', 'super_admin'] } });
    if (!instructor) {
      console.log('No admin/trainer found. Creating a default instructor...');
      instructor = await new User({
        fullName: 'Dr. Alex Murenzi',
        username: 'alex.murenzi',
        email: 'alex.murenzi@bootskills.com',
        password: 'Password@123',
        role: 'trainer',
        status: 'active',
        academicStatus: 'active',
      }).save();
      console.log('✅ Created default instructor:', instructor.fullName);
    } else {
      console.log('✅ Using instructor:', instructor.fullName);
    }

    // === COURSE DATA (stripped of videoUrl fields, level fixed) ===
    const courseData = {
      title: 'Data Structures Mastery for Beginners for all',
      description:
        '<p>The most comprehensive data structures course for absolute beginners. Covers everything from pseudocode basics to advanced data structures. No programming experience needed. Includes interactive games, video links, and free resources.</p>',
      thumbnail: 'https://res.cloudinary.com/example/data_structures_mastery.webp',
      instructor: instructor._id,
      price: 0,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Programming',
      status: 'published',
      submissionRequired: true,
      modules: [
        // ====== MODULE 1 ======
        {
          title: 'Module 1: Introduction to Pseudocode',
          description: 'Learn what pseudocode is and how to write it clearly.',
          order: 1,
          lessons: [
            {
              title: 'Lesson 1: What Is Pseudocode?',
              type: 'article',
              content:
                '<p><strong>Pseudocode is a simple way to write down program steps using plain English.</strong> You don\'t need to know any programming language. It\'s like writing a recipe or giving directions.</p><p>📸 <strong>Example:</strong></p><pre>START\n  Ask user for their name\n  Store name in variable called \'username\'\n  Say \'Hello \' + username\nEND</pre><p><strong>Key point:</strong> Pseudocode helps you think through problems before writing real code. It works for everyone — no computer needed!</p>',
              duration: 6,
              resources: [
                {
                  title: 'Download: Pseudocode Cheat Sheet',
                  url: 'https://example.com/pseudocode-cheatsheet.pdf',
                  type: 'pdf',
                },
              ],
            },
            {
              title: 'Lesson 2: Basic Pseudocode Rules',
              type: 'article',
              content:
                '<p><strong>Rules of good pseudocode:</strong></p><ul><li>Use plain English words (START, END, IF, ELSE, FOR, WHILE)</li><li>Indent to show blocks of code</li><li>Be specific but not technical</li><li>One step per line</li><li>Use variables to store information</li></ul><p>📸 <strong>Example of GOOD pseudocode:</strong></p><pre>IF temperature > 30 THEN\n    DISPLAY \'It is hot outside\'\nELSE\n    DISPLAY \'It is cool outside\'\nEND IF</pre>',
              duration: 5,
              resources: [],
            },
            {
              title: 'Lesson 3: Variables in Pseudocode',
              type: 'article',
              content:
                '<p><strong>A variable is a container that stores information.</strong> You can name it anything you want.</p><p><strong>Common variable types:</strong></p><ul><li><strong>STRING:</strong> Text (e.g., name = \'John\')</li><li><strong>NUMBER:</strong> A number (e.g., age = 25)</li><li><strong>BOOLEAN:</strong> True or False (e.g., isRaining = False)</li></ul><p><strong>How to write variables in pseudocode:</strong></p><pre>SET name TO \'Alice\'\nSET age TO 30\nSET isStudent TO True</pre>',
              duration: 6,
              resources: [],
            },
            {
              title: 'Lesson 4: Input and Output',
              type: 'article',
              content:
                '<p><strong>INPUT</strong> is when your program gets information from the user.<br><strong>OUTPUT</strong> is when your program displays information to the user.</p><p><strong>Common keywords:</strong></p><ul><li><strong>INPUT</strong> or <strong>READ</strong> — get data from user</li><li><strong>DISPLAY</strong> or <strong>PRINT</strong> or <strong>OUTPUT</strong> — show data to user</li></ul><p><strong>Example:</strong></p><pre>DISPLAY \'What is your favorite color?\'\nINPUT favoriteColor\nDISPLAY \'Your favorite color is \' + favoriteColor</pre>',
              duration: 4,
              resources: [],
            },
            {
              title: 'Lesson 5: Conditional Statements (IF/THEN/ELSE)',
              type: 'article',
              content:
                '<p><strong>Conditional statements let your program make decisions.</strong></p><p><strong>Basic structure:</strong></p><pre>IF condition THEN\n    // do something\nELSE\n    // do something else\nEND IF</pre><p><strong>Comparison operators:</strong></p><ul><li>== equal to</li><li>!= not equal to</li><li>> greater than</li><li>< less than</li><li>>= greater than or equal</li><li><= less than or equal</li></ul>',
              duration: 7,
              resources: [],
            },
            {
              title: 'Lesson 6: Loops (Repeating Actions)',
              type: 'article',
              content:
                '<p><strong>Loops let you repeat actions multiple times.</strong></p><p><strong>1. FOR loop</strong> — use when you know how many times to repeat</p><pre>FOR counter FROM 1 TO 5\n    DISPLAY \'Hello\'\nEND FOR</pre><p><strong>2. WHILE loop</strong> — use when you don\'t know how many times</p><pre>SET count TO 1\nWHILE count <= 5\n    DISPLAY \'Hello\'\n    SET count TO count + 1\nEND WHILE</pre>',
              duration: 7,
              resources: [],
            },
            {
              title: 'Module 1 Quiz — Introduction to Pseudocode',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is pseudocode?', type: 'multiple_choice', options: ['A real programming language', 'A simple way to write program steps in plain English', 'A type of computer virus', 'A software program'], correctOptionIndex: 1, explanation: 'Pseudocode uses plain English to describe program logic.' },
                { questionText: 'Which keyword is used to display output in pseudocode?', type: 'multiple_choice', options: ['INPUT', 'READ', 'DISPLAY', 'SET'], correctOptionIndex: 2, explanation: 'DISPLAY, PRINT, or OUTPUT are used to show information.' },
                { questionText: 'What does IF score >= 70 mean?', type: 'multiple_choice', options: ['If score is 70 or higher', 'If score is less than 70', 'If score equals 70', 'If score is not 70'], correctOptionIndex: 0, explanation: '>= means \'greater than or equal to\'.' },
                { questionText: 'How many times will FOR counter FROM 1 TO 3 run?', type: 'multiple_choice', options: ['1', '2', '3', '4'], correctOptionIndex: 2, explanation: 'FROM 1 TO 3 runs 3 times (1, 2, 3).' },
                { questionText: 'What is a variable?', type: 'multiple_choice', options: ['A container that stores information', 'A type of loop', 'A conditional statement', 'A programming language'], correctOptionIndex: 0, explanation: 'A variable stores data like numbers or text.' },
                { questionText: 'Which is a GOOD variable name?', type: 'multiple_choice', options: ['x', 'userAge', 'a1', 'temp'], correctOptionIndex: 1, explanation: 'Good variable names describe what they store.' },
                { questionText: 'What does \'>\' mean?', type: 'multiple_choice', options: ['Less than', 'Equal to', 'Greater than', 'Not equal to'], correctOptionIndex: 2, explanation: '> means \'greater than\'.' },
                { questionText: 'What keyword starts a conditional statement?', type: 'multiple_choice', options: ['LOOP', 'START', 'IF', 'SET'], correctOptionIndex: 2, explanation: 'IF starts a conditional statement.' },
                { questionText: 'What keyword ends an IF statement?', type: 'multiple_choice', options: ['STOP', 'END IF', 'FINISH', 'CLOSE'], correctOptionIndex: 1, explanation: 'END IF marks the end of an IF statement.' },
                { questionText: 'Which loop do you use when you know how many times to repeat?', type: 'multiple_choice', options: ['WHILE', 'IF', 'FOR', 'ELSE'], correctOptionIndex: 2, explanation: 'Use a FOR loop when you know the exact number of repetitions.' },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 2 ======
        {
          title: 'Module 2: Arrays — The Foundation',
          description: 'Learn how to store multiple items in one variable using arrays.',
          order: 2,
          lessons: [
            { title: 'Lesson 1: What Is an Array?', type: 'article', content: '<p><strong>An array is a list of items stored in one variable.</strong> Think of it like a row of boxes, each containing one item.</p><p>📸 <strong>Visual example:</strong></p><pre>Array \'days\' contains: [Monday, Tuesday, Wednesday, Thursday, Friday]</pre><p><strong>Why use arrays?</strong> Without arrays, you would need 5 separate variables. With arrays, you only need ONE variable called \'days\'.</p><p><strong>Pseudocode for creating an array:</strong></p><pre>SET days TO [\'Monday\', \'Tuesday\', \'Wednesday\', \'Thursday\', \'Friday\']</pre>', duration: 6, resources: [] },
            { title: 'Lesson 2: Accessing Array Items', type: 'article', content: '<p><strong>Each item in an array has a number called an INDEX.</strong></p><p><strong>IMPORTANT:</strong> In programming, indexes start at 0, not 1!</p><p><strong>Example:</strong></p><pre>Array \'fruits\' = [\'apple\', \'banana\', \'cherry\', \'date\']\n\nIndex 0 = \'apple\'\nIndex 1 = \'banana\'\nIndex 2 = \'cherry\'\nIndex 3 = \'date\'</pre><p><strong>How to access:</strong></p><pre>SET fruits TO [\'apple\', \'banana\', \'cherry\', \'date\']\nDISPLAY fruits[0]    // displays \'apple\'\nDISPLAY fruits[2]    // displays \'cherry\'</pre>', duration: 5, resources: [] },
            { title: 'Lesson 3: Looping Through an Array', type: 'article', content: '<p><strong>You can use a FOR loop to visit every item in an array.</strong></p><p><strong>Example — display all fruits:</strong></p><pre>SET fruits TO [\'apple\', \'banana\', \'cherry\', \'date\']\n\nFOR each fruit IN fruits\n    DISPLAY fruit\nEND FOR</pre>', duration: 6, resources: [] },
            { title: 'Lesson 4: Adding and Removing Items', type: 'article', content: '<p><strong>You can change arrays after creating them.</strong></p><p><strong>Add to the end:</strong></p><pre>APPEND \'cherry\' TO fruits</pre><p><strong>Add at a specific position:</strong></p><pre>INSERT \'blueberry\' AT POSITION 1 IN fruits</pre><p><strong>Remove an item:</strong></p><pre>REMOVE \'banana\' FROM fruits</pre><p><strong>Update an item:</strong></p><pre>SET fruits[1] TO \'blackberry\'</pre>', duration: 5, resources: [] },
            { title: 'Lesson 5: Searching in an Array', type: 'article', content: '<p><strong>Often you need to check if an item exists in an array.</strong></p><p><strong>Example — search for a specific fruit:</strong></p><pre>SET fruits TO [\'apple\', \'banana\', \'cherry\', \'date\']\nINPUT searchItem\nSET found TO False\n\nFOR each fruit IN fruits\n    IF fruit == searchItem THEN\n        SET found TO True\n    END IF\nEND FOR\n\nIF found == True THEN\n    DISPLAY \'Found \' + searchItem\nELSE\n    DISPLAY searchItem + \' not found\'\nEND IF</pre>', duration: 5, resources: [] },
            { title: 'Lesson 6: 2D Arrays (Tables of Data)', type: 'article', content: '<p><strong>A 2D array is like a table with rows and columns.</strong></p><p><strong>Example — a 3x3 grid:</strong></p><pre>grid = [\n    [1, 2, 3],   // row 0\n    [4, 5, 6],   // row 1\n    [7, 8, 9]    // row 2\n]</pre><p><strong>Accessing items:</strong> use [row][column]</p><pre>DISPLAY grid[0][0]  // displays 1\nDISPLAY grid[1][2]  // displays 6\nDISPLAY grid[2][1]  // displays 8</pre>', duration: 7, resources: [] },
            {
              title: 'Module 2 Quiz — Arrays and Lists',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is an array?', type: 'multiple_choice', options: ['A single variable that stores one value', 'A list of items stored in one variable', 'A type of loop', 'A conditional statement'], correctOptionIndex: 1, explanation: 'An array holds multiple items in a single variable.' },
                { questionText: 'In programming, what number is the FIRST item in an array?', type: 'multiple_choice', options: ['1', '0', '-1', 'It depends'], correctOptionIndex: 1, explanation: 'Array indexes start at 0.' },
                { questionText: 'Given \'colors = [\'red\', \'green\', \'blue\']\', what is colors[1]?', type: 'multiple_choice', options: ['red', 'green', 'blue', 'null'], correctOptionIndex: 1, explanation: 'Index 0=red, 1=green, 2=blue' },
                { questionText: 'How do you add an item to the end of an array in pseudocode?', type: 'multiple_choice', options: ['INSERT', 'REMOVE', 'APPEND', 'ADD'], correctOptionIndex: 2, explanation: 'APPEND adds an item to the end.' },
                { questionText: 'What is a 2D array?', type: 'multiple_choice', options: ['An array with 2 items', 'An array that stores only numbers', 'An array of arrays (like a table)', 'A type of loop'], correctOptionIndex: 2, explanation: 'A 2D array has rows and columns.' },
                { questionText: 'Given \'grid = [[1,2],[3,4]]\', what is grid[1][0]?', type: 'multiple_choice', options: ['1', '2', '3', '4'], correctOptionIndex: 2, explanation: 'grid[1][0] = row 1, column 0 = 3' },
                { questionText: 'Which loop is best for visiting every item in an array?', type: 'multiple_choice', options: ['WHILE', 'FOR EACH', 'IF', 'DO WHILE'], correctOptionIndex: 1, explanation: 'FOR EACH is designed for arrays.' },
                { questionText: 'Array \'scores\' has 5 items. What is the index of the LAST item?', type: 'multiple_choice', options: ['5', '4', '6', '0'], correctOptionIndex: 1, explanation: '5 items = indexes 0,1,2,3,4. Last = 4.' },
                { questionText: 'What keyword removes an item from an array?', type: 'multiple_choice', options: ['APPEND', 'INSERT', 'REMOVE', 'DELETE'], correctOptionIndex: 2, explanation: 'REMOVE deletes an item from the array.' },
                { questionText: 'What is the sum of [10, 20, 30, 40]?', type: 'multiple_choice', options: ['10', '40', '100', '120'], correctOptionIndex: 2, explanation: '10 + 20 + 30 + 40 = 100' },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 3 ======
        {
          title: 'Module 3: Advanced Arrays — Sorting and Searching',
          description: 'Learn how to sort and search arrays efficiently.',
          order: 3,
          lessons: [
            { title: 'Lesson 1: Bubble Sort (Simple Sorting)', type: 'article', content: '<p><strong>Bubble Sort is the simplest sorting algorithm.</strong> It repeatedly steps through the list, compares adjacent items, and swaps them if they are in the wrong order.</p><p><strong>Example — sorting numbers in ascending order:</strong></p><pre>SET numbers TO [5, 3, 8, 1, 2]\n\nFOR i FROM 0 TO length-1\n    FOR j FROM 0 TO length-2\n        IF numbers[j] > numbers[j+1] THEN\n            SET temp TO numbers[j]\n            SET numbers[j] TO numbers[j+1]\n            SET numbers[j+1] TO temp\n        END IF\n    END FOR\nEND FOR\n\n// numbers is now [1, 2, 3, 5, 8]</pre>', duration: 7, resources: [] },
            { title: 'Lesson 2: Selection Sort', type: 'article', content: '<p><strong>Selection Sort finds the smallest element and puts it at the front.</strong> It repeats this process for each position.</p><pre>SET numbers TO [5, 3, 8, 1, 2]\n\nFOR i FROM 0 TO length-1\n    SET minIndex TO i\n    FOR j FROM i+1 TO length-1\n        IF numbers[j] < numbers[minIndex] THEN\n            SET minIndex TO j\n        END IF\n    END FOR\n    SET temp TO numbers[i]\n    SET numbers[i] TO numbers[minIndex]\n    SET numbers[minIndex] TO temp\nEND FOR\n\n// numbers is now [1, 2, 3, 5, 8]</pre>', duration: 6, resources: [] },
            { title: 'Lesson 3: Insertion Sort', type: 'article', content: '<p><strong>Insertion Sort builds the final sorted array one item at a time.</strong> It\'s like sorting a hand of playing cards.</p><pre>SET numbers TO [5, 3, 8, 1, 2]\n\nFOR i FROM 1 TO length-1\n    SET key TO numbers[i]\n    SET j TO i-1\n    WHILE j >= 0 AND numbers[j] > key\n        SET numbers[j+1] TO numbers[j]\n        SET j TO j-1\n    END WHILE\n    SET numbers[j+1] TO key\nEND FOR\n\n// numbers is now [1, 2, 3, 5, 8]</pre>', duration: 6, resources: [] },
            { title: 'Lesson 4: Merge Sort (Divide and Conquer)', type: 'article', content: '<p><strong>Merge Sort divides the array in half, sorts each half, then merges them together.</strong> It\'s faster than bubble sort for large arrays.</p><pre>FUNCTION mergeSort(array)\n    IF length(array) <= 1 THEN\n        RETURN array\n    END IF\n    SET mid TO length(array) / 2\n    SET left TO mergeSort(first half of array)\n    SET right TO mergeSort(second half of array)\n    RETURN merge(left, right)\nEND FUNCTION\n\nFUNCTION merge(left, right)\n    SET result TO []\n    WHILE left not empty AND right not empty\n        IF left[0] <= right[0] THEN\n            APPEND left[0] TO result\n            REMOVE left[0] FROM left\n        ELSE\n            APPEND right[0] TO result\n            REMOVE right[0] FROM right\n        END IF\n    END WHILE\n    APPEND remaining left + right TO result\n    RETURN result\nEND FUNCTION</pre>', duration: 8, resources: [] },
            { title: 'Lesson 5: Quick Sort', type: 'article', content: '<p><strong>Quick Sort picks a \'pivot\' element and partitions the array around it.</strong> It\'s one of the fastest sorting algorithms.</p><pre>FUNCTION quickSort(array, low, high)\n    IF low < high THEN\n        SET pivotIndex TO partition(array, low, high)\n        quickSort(array, low, pivotIndex-1)\n        quickSort(array, pivotIndex+1, high)\n    END IF\nEND FUNCTION\n\nFUNCTION partition(array, low, high)\n    SET pivot TO array[high]\n    SET i TO low-1\n    FOR j FROM low TO high-1\n        IF array[j] <= pivot THEN\n            SET i TO i+1\n            SWAP array[i] AND array[j]\n        END IF\n    END FOR\n    SWAP array[i+1] AND array[high]\n    RETURN i+1\nEND FUNCTION</pre>', duration: 8, resources: [] },
            { title: 'Lesson 6: Binary Search (Searching in Sorted Arrays)', type: 'article', content: '<p><strong>Binary Search finds an item in a sorted array by repeatedly dividing the search range in half.</strong> It\'s much faster than linear search.</p><pre>FUNCTION binarySearch(array, target)\n    SET low TO 0\n    SET high TO length(array)-1\n    WHILE low <= high\n        SET mid TO (low + high) / 2\n        IF array[mid] == target THEN\n            RETURN mid\n        ELSE IF array[mid] < target THEN\n            SET low TO mid+1\n        ELSE\n            SET high TO mid-1\n        END IF\n    END WHILE\n    RETURN -1\nEND FUNCTION</pre>', duration: 7, resources: [] },
            {
              title: 'Module 3 Quiz — Sorting and Searching',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Which sorting algorithm is the simplest?', type: 'multiple_choice', options: ['Merge Sort', 'Bubble Sort', 'Quick Sort', 'Selection Sort'], correctOptionIndex: 1 },
                { questionText: 'Which sorting algorithm uses a \'pivot\'?', type: 'multiple_choice', options: ['Bubble Sort', 'Selection Sort', 'Quick Sort', 'Insertion Sort'], correctOptionIndex: 2 },
                { questionText: 'What does Binary Search require?', type: 'multiple_choice', options: ['Unsorted array', 'Sorted array', 'Random array', 'Empty array'], correctOptionIndex: 1 },
                { questionText: 'Merge Sort uses what technique?', type: 'multiple_choice', options: ['Divide and conquer', 'Brute force', 'Greedy', 'Dynamic programming'], correctOptionIndex: 0 },
                { questionText: 'Bubble Sort has time complexity of:', type: 'multiple_choice', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correctOptionIndex: 1 },
                { questionText: 'Binary Search has time complexity of:', type: 'multiple_choice', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correctOptionIndex: 2 },
                { questionText: 'Selection Sort finds which element each time?', type: 'multiple_choice', options: ['Largest', 'Smallest', 'Middle', 'Random'], correctOptionIndex: 1 },
                { questionText: 'Insertion Sort is good for what type of data?', type: 'multiple_choice', options: ['Reverse sorted', 'Already almost sorted', 'Completely random', 'All the same'], correctOptionIndex: 1 },
                { questionText: 'Which sort is best for large datasets?', type: 'multiple_choice', options: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'], correctOptionIndex: 2 },
                { questionText: 'What is the first step in Merge Sort?', type: 'multiple_choice', options: ['Merge', 'Divide in half', 'Swap', 'Find pivot'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 4 ======
        {
          title: 'Module 4: Stacks (LIFO)',
          description: 'Learn the stack data structure — Last In, First Out.',
          order: 4,
          lessons: [
            { title: 'Lesson 1: What Is a Stack?', type: 'article', content: '<p><strong>A stack is like a pile of plates.</strong> You add to the top and remove from the top. LIFO = Last In, First Out.</p><p><strong>Stack operations:</strong></p><ul><li><strong>PUSH</strong> — add an item to the top</li><li><strong>POP</strong> — remove and return the top item</li><li><strong>PEEK</strong> — look at the top item without removing it</li><li><strong>ISEMPTY</strong> — check if stack has no items</li></ul><p><strong>Example:</strong></p><pre>CREATE STACK plates\nPUSH \'Plate 1\' TO plates\nPUSH \'Plate 2\' TO plates\nPUSH \'Plate 3\' TO plates\nPOP plates   // returns \'Plate 3\'\nPEEK plates  // returns \'Plate 2\'</pre>', duration: 6, resources: [] },
            { title: 'Lesson 2: Stack Implementation in Pseudocode', type: 'article', content: '<p><strong>Implementing a stack using an array in pseudocode:</strong></p><pre>CREATE STACK s\nSET topIndex TO -1\n\nFUNCTION push(s, value)\n    SET topIndex TO topIndex + 1\n    SET s[topIndex] TO value\nEND FUNCTION\n\nFUNCTION pop(s)\n    IF topIndex < 0 THEN\n        DISPLAY \'Stack is empty\'\n        RETURN null\n    END IF\n    SET value TO s[topIndex]\n    SET topIndex TO topIndex - 1\n    RETURN value\nEND FUNCTION\n\nFUNCTION peek(s)\n    IF topIndex < 0 THEN\n        DISPLAY \'Stack is empty\'\n        RETURN null\n    END IF\n    RETURN s[topIndex]\nEND FUNCTION\n\nFUNCTION isEmpty(s)\n    RETURN topIndex == -1\nEND FUNCTION</pre>', duration: 7, resources: [] },
            { title: 'Lesson 3: Stack Example — Browser Back Button', type: 'article', content: '<p><strong>A real-world stack example is your browser\'s back button.</strong></p><pre>CREATE STACK history\nPUSH \'google.com\' TO history\nPUSH \'youtube.com\' TO history\nPUSH \'facebook.com\' TO history\nSET currentPage TO POP history   // returns \'facebook.com\'\nSET currentPage TO POP history   // returns \'youtube.com\'</pre>', duration: 5, resources: [] },
            { title: 'Lesson 4: Stack Example — Undo Feature', type: 'article', content: '<p><strong>The Undo feature in text editors uses a stack.</strong></p><pre>CREATE STACK actions\nPUSH \'type: H\' TO actions\nPUSH \'type: E\' TO actions\nPUSH \'type: L\' TO actions\nPUSH \'type: L\' TO actions\nPUSH \'type: O\' TO actions\nSET lastAction TO POP actions   // removes \'type: O\'</pre>', duration: 6, resources: [] },
            { title: 'Lesson 5: Balanced Parentheses Using Stack', type: 'article', content: '<p><strong>Stacks are used to check if parentheses are balanced.</strong></p><pre>FUNCTION isBalanced(inputString)\n    CREATE STACK s\n    FOR each character ch IN inputString\n        IF ch == \'(\' OR ch == \'{\' OR ch == \'[\' THEN\n            PUSH ch TO s\n        ELSE IF ch == \')\' OR ch == \'}\' OR ch == \']\' THEN\n            IF ISEMPTY(s) THEN\n                RETURN False\n            END IF\n            SET top TO POP s\n            IF (ch == \')\' AND top != \'(\') OR (ch == \'}\' AND top != \'{\') OR (ch == \']\' AND top != \'[\') THEN\n                RETURN False\n            END IF\n        END IF\n    END FOR\n    RETURN ISEMPTY(s)\nEND FUNCTION</pre>', duration: 8, resources: [] },
            { title: 'Lesson 6: Reverse a String Using Stack', type: 'article', content: '<p><strong>A stack can reverse any string.</strong> Push each character, then pop them all.</p><pre>FUNCTION reverseString(inputString)\n    CREATE STACK s\n    FOR each character ch IN inputString\n        PUSH ch TO s\n    END FOR\n    SET result TO \'\'\n    WHILE ISEMPTY(s) == False\n        SET result TO result + POP(s)\n    END WHILE\n    RETURN result\nEND FUNCTION\n\n// reverseString(\'hello\') returns \'olleh\'</pre>', duration: 5, resources: [] },
            {
              title: 'Module 4 Quiz — Stacks',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What does LIFO stand for?', type: 'multiple_choice', options: ['Last In First Out', 'First In First Out', 'Last In Last Out', 'First In Last Out'], correctOptionIndex: 0 },
                { questionText: 'Which operation adds an item to a stack?', type: 'multiple_choice', options: ['POP', 'PUSH', 'PEEK', 'TOP'], correctOptionIndex: 1 },
                { questionText: 'Which operation removes an item from a stack?', type: 'multiple_choice', options: ['PUSH', 'PEEK', 'POP', 'TOP'], correctOptionIndex: 2 },
                { questionText: 'What is a real-world example of a stack?', type: 'multiple_choice', options: ['Print queue', 'Browser back button', 'Grocery line', 'Customer service'], correctOptionIndex: 1 },
                { questionText: 'After PUSH A, PUSH B, PUSH C, what does POP return?', type: 'multiple_choice', options: ['A', 'B', 'C', 'None'], correctOptionIndex: 2 },
                { questionText: 'What does PEEK do?', type: 'multiple_choice', options: ['Removes top item', 'Removes bottom item', 'Looks at top item without removing', 'Looks at bottom item'], correctOptionIndex: 2 },
                { questionText: 'Stacks are used for checking:', type: 'multiple_choice', options: ['Balanced parentheses', 'Array sorting', 'Searching', 'Matrix multiplication'], correctOptionIndex: 0 },
                { questionText: 'What is the result of reverseString(\'abc\')?', type: 'multiple_choice', options: ['abc', 'cba', 'cba', 'acb'], correctOptionIndex: 1 },
                { questionText: 'Which app uses a stack for undo?', type: 'multiple_choice', options: ['Maps', 'Text editor', 'Calculator', 'Weather app'], correctOptionIndex: 1 },
                { questionText: 'What does ISEMPTY check?', type: 'multiple_choice', options: ['If stack is full', 'If stack has no items', 'If stack has 1 item', 'If stack is sorted'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 5 ======
        {
          title: 'Module 5: Queues (FIFO)',
          description: 'Learn the queue data structure — First In, First Out.',
          order: 5,
          lessons: [
            { title: 'Lesson 1: What Is a Queue?', type: 'article', content: '<p><strong>A queue is like a line at a grocery store.</strong> First person in line gets served first. FIFO = First In, First Out.</p><p><strong>Queue operations:</strong></p><ul><li><strong>ENQUEUE</strong> — add an item to the back</li><li><strong>DEQUEUE</strong> — remove and return the front item</li><li><strong>FRONT</strong> — look at front item without removing it</li><li><strong>ISEMPTY</strong> — check if queue has no items</li></ul><p><strong>Example:</strong></p><pre>CREATE QUEUE customers\nENQUEUE \'Alice\' TO customers\nENQUEUE \'Bob\' TO customers\nENQUEUE \'Charlie\' TO customers\nDEQUEUE customers   // returns \'Alice\'\nFRONT customers     // returns \'Bob\'</pre>', duration: 6, resources: [] },
            { title: 'Lesson 2: Queue Implementation in Pseudocode', type: 'article', content: '<p><strong>Implementing a queue using an array in pseudocode:</strong></p><pre>CREATE QUEUE q\nSET frontIndex TO 0\nSET backIndex TO -1\n\nFUNCTION enqueue(q, value)\n    SET backIndex TO backIndex + 1\n    SET q[backIndex] TO value\nEND FUNCTION\n\nFUNCTION dequeue(q)\n    IF frontIndex > backIndex THEN\n        DISPLAY \'Queue is empty\'\n        RETURN null\n    END IF\n    SET value TO q[frontIndex]\n    SET frontIndex TO frontIndex + 1\n    RETURN value\nEND FUNCTION\n\nFUNCTION front(q)\n    IF frontIndex > backIndex THEN\n        DISPLAY \'Queue is empty\'\n        RETURN null\n    END IF\n    RETURN q[frontIndex]\nEND FUNCTION\n\nFUNCTION isEmpty(q)\n    RETURN frontIndex > backIndex\nEND FUNCTION</pre>', duration: 7, resources: [] },
            { title: 'Lesson 3: Queue Example — Print Queue', type: 'article', content: '<p><strong>A print queue is a real-world queue example.</strong></p><pre>CREATE QUEUE printJobs\nENQUEUE \'Report.pdf\' TO printJobs\nENQUEUE \'Photo.jpg\' TO printJobs\nENQUEUE \'Invoice.docx\' TO printJobs\nWHILE ISEMPTY(printJobs) == False\n    SET currentJob TO DEQUEUE printJobs\n    DISPLAY \'Printing: \' + currentJob\nEND WHILE</pre>', duration: 5, resources: [] },
            { title: 'Lesson 4: Queue Example — Customer Service Line', type: 'article', content: '<p><strong>Customer service lines use a queue.</strong></p><pre>CREATE QUEUE customers\nENQUEUE \'John\' TO customers\nENQUEUE \'Maria\' TO customers\nENQUEUE \'David\' TO customers\nWHILE ISEMPTY(customers) == False\n    SET currentCustomer TO DEQUEUE customers\n    DISPLAY \'Serving: \' + currentCustomer\nEND WHILE</pre>', duration: 5, resources: [] },
            { title: 'Lesson 5: Stack vs Queue — Comparison', type: 'article', content: '<p><strong>Key differences between Stack and Queue.</strong></p><pre>┌─────────────┬─────────────┬─────────────┐\n│   Feature   │    Stack    │    Queue    │\n├─────────────┼─────────────┼─────────────┤\n│ Order       │ LIFO        │ FIFO        │\n│ Add to      │ Top         │ Back        │\n│ Remove from │ Top         │ Front       │\n│ Example     │ Undo button │ Print queue │\n└─────────────┴─────────────┴─────────────┘</pre>', duration: 6, resources: [] },
            { title: 'Lesson 6: Circular Queue (Better Memory)', type: 'article', content: '<p><strong>A circular queue reuses empty spaces at the front.</strong> It\'s more memory-efficient.</p><pre>CREATE QUEUE q (size = 5)\nSET frontIndex TO 0\nSET backIndex TO 0\nSET count TO 0\n\nFUNCTION enqueue(q, value)\n    IF count == size THEN\n        DISPLAY \'Queue is full\'\n        RETURN\n    END IF\n    SET q[backIndex] TO value\n    SET backIndex TO (backIndex + 1) % size\n    SET count TO count + 1\nEND FUNCTION\n\nFUNCTION dequeue(q)\n    IF count == 0 THEN\n        DISPLAY \'Queue is empty\'\n        RETURN null\n    END IF\n    SET value TO q[frontIndex]\n    SET frontIndex TO (frontIndex + 1) % size\n    SET count TO count - 1\n    RETURN value\nEND FUNCTION</pre>', duration: 7, resources: [] },
            {
              title: 'Module 5 Quiz — Queues',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What does FIFO stand for?', type: 'multiple_choice', options: ['Last In First Out', 'First In First Out', 'Last In Last Out', 'First In Last Out'], correctOptionIndex: 1 },
                { questionText: 'Which operation adds an item to a queue?', type: 'multiple_choice', options: ['DEQUEUE', 'ENQUEUE', 'FRONT', 'BACK'], correctOptionIndex: 1 },
                { questionText: 'Which operation removes an item from a queue?', type: 'multiple_choice', options: ['ENQUEUE', 'FRONT', 'DEQUEUE', 'BACK'], correctOptionIndex: 2 },
                { questionText: 'What is a real-world example of a queue?', type: 'multiple_choice', options: ['Browser back button', 'Print queue', 'Undo feature', 'Function calls'], correctOptionIndex: 1 },
                { questionText: 'After ENQUEUE X, ENQUEUE Y, ENQUEUE Z, what does DEQUEUE return?', type: 'multiple_choice', options: ['X', 'Y', 'Z', 'None'], correctOptionIndex: 0 },
                { questionText: 'What does FRONT do?', type: 'multiple_choice', options: ['Removes first item', 'Looks at first item without removing', 'Removes last item', 'Looks at last item'], correctOptionIndex: 1 },
                { questionText: 'A circular queue solves what problem?', type: 'multiple_choice', options: ['Overflow', 'Memory waste at the front', 'Underflow', 'Sorting'], correctOptionIndex: 1 },
                { questionText: 'What is the time complexity of enqueue operation in a queue?', type: 'multiple_choice', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correctOptionIndex: 0 },
                { questionText: 'Which data structure uses FIFO?', type: 'multiple_choice', options: ['Stack', 'Queue', 'Array', 'Tree'], correctOptionIndex: 1 },
                { questionText: 'What does ISEMPTY check in a queue?', type: 'multiple_choice', options: ['If queue is full', 'If queue has no items', 'If queue has 1 item', 'If queue is sorted'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 6 ======
        {
          title: 'Module 6: Linked Lists — Introduction',
          description: 'Learn the linked list data structure.',
          order: 6,
          lessons: [
            { title: 'Lesson 1: What Is a Linked List?', type: 'article', content: '<p><strong>A linked list is a chain of nodes where each node points to the next node.</strong></p><pre>[Data: 10] → [Data: 20] → [Data: 30] → null</pre><p><strong>Each node contains:</strong> Data and a pointer to the next node.</p><p><strong>Advantages:</strong> Easy to add/remove items in the middle, can grow/shrink easily.</p><p><strong>Disadvantages:</strong> Can\'t access by index directly, uses more memory.</p>', duration: 7, resources: [] },
            { title: 'Lesson 2: Creating a Node in Pseudocode', type: 'article', content: '<p><strong>A node is the building block of a linked list.</strong></p><pre>CREATE NODE with data = value and next = null\n\nSET node1 TO CREATE NODE with data = 10, next = null\nSET node2 TO CREATE NODE with data = 20, next = null\nSET node3 TO CREATE NODE with data = 30, next = null\n\nSET node1.next TO node2\nSET node2.next TO node3\n\n// node1 → node2 → node3 → null</pre>', duration: 6, resources: [] },
            { title: 'Lesson 3: Traversing a Linked List', type: 'article', content: '<p><strong>Traversing means visiting every node in the list.</strong></p><pre>FUNCTION printList(head)\n    SET current TO head\n    WHILE current != null\n        DISPLAY current.data\n        SET current TO current.next\n    END WHILE\nEND FUNCTION</pre>', duration: 6, resources: [] },
            { title: 'Lesson 4: Adding to a Linked List (Prepend)', type: 'article', content: '<p><strong>Adding to the beginning is called PREPEND.</strong></p><pre>FUNCTION prepend(head, value)\n    CREATE newNode WITH data = value, next = head\n    RETURN newNode\nEND FUNCTION\n\n// List: 20 → 30 → null\nSET head TO prepend(head, 10)\n// List: 10 → 20 → 30 → null</pre>', duration: 5, resources: [] },
            { title: 'Lesson 5: Adding to a Linked List (Append)', type: 'article', content: '<p><strong>Adding to the end is called APPEND.</strong></p><pre>FUNCTION append(head, value)\n    CREATE newNode WITH data = value, next = null\n    IF head == null THEN\n        RETURN newNode\n    END IF\n    SET current TO head\n    WHILE current.next != null\n        SET current TO current.next\n    END WHILE\n    SET current.next TO newNode\n    RETURN head\nEND FUNCTION</pre>', duration: 6, resources: [] },
            { title: 'Lesson 6: Deleting from a Linked List', type: 'article', content: '<p><strong>Delete a node with a specific value.</strong></p><pre>FUNCTION delete(head, value)\n    IF head == null THEN RETURN null\n    IF head.data == value THEN RETURN head.next\n    SET current TO head\n    WHILE current.next != null AND current.next.data != value\n        SET current TO current.next\n    END WHILE\n    IF current.next != null THEN\n        SET current.next TO current.next.next\n    END IF\n    RETURN head\nEND FUNCTION</pre>', duration: 7, resources: [] },
            {
              title: 'Module 6 Quiz — Linked Lists (Basics)',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What does a node in a linked list contain?', type: 'multiple_choice', options: ['Only data', 'Data and a pointer to next node', 'Only pointer', 'Data and two pointers'], correctOptionIndex: 1 },
                { questionText: 'What is the last node\'s \'next\' pointer set to?', type: 'multiple_choice', options: ['Itself', 'The head', 'Null', 'The previous node'], correctOptionIndex: 2 },
                { questionText: 'What is PREPEND?', type: 'multiple_choice', options: ['Adding to the end', 'Adding to the beginning', 'Removing from the end', 'Removing from the beginning'], correctOptionIndex: 1 },
                { questionText: 'What is APPEND?', type: 'multiple_choice', options: ['Adding to the end', 'Adding to the beginning', 'Removing from the end', 'Removing from the beginning'], correctOptionIndex: 0 },
                { questionText: 'One advantage of linked lists over arrays is:', type: 'multiple_choice', options: ['Faster searching', 'Easier insertion/deletion', 'Less memory usage', 'Direct access by index'], correctOptionIndex: 1 },
                { questionText: 'One disadvantage of linked lists is:', type: 'multiple_choice', options: ['Easier insertion', 'No direct access by index', 'Less memory usage', 'Slower traversal'], correctOptionIndex: 1 },
                { questionText: 'What does traversing a linked list mean?', type: 'multiple_choice', options: ['Sorting it', 'Visiting every node', 'Adding to it', 'Deleting from it'], correctOptionIndex: 1 },
                { questionText: 'If head == null, what does that mean?', type: 'multiple_choice', options: ['List is empty', 'List has one item', 'List has many items', 'List is sorted'], correctOptionIndex: 0 },
                { questionText: 'What happens if you delete a node and don\'t update the previous node\'s \'next\'?', type: 'multiple_choice', options: ['Nothing', 'The list breaks', 'The data is copied', 'The list becomes sorted'], correctOptionIndex: 1 },
                { questionText: 'Which operation requires traversing to the end of the list?', type: 'multiple_choice', options: ['Prepend', 'Append', 'Delete head', 'Delete middle'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 7 ======
        {
          title: 'Module 7: Advanced Linked Lists',
          description: 'Learn doubly linked lists and circular linked lists.',
          order: 7,
          lessons: [
            { title: 'Lesson 1: Doubly Linked List — What It Is', type: 'article', content: '<p><strong>A doubly linked list has nodes that point to both the next AND the previous node.</strong></p><pre>null ← [10] ↔ [20] ↔ [30] → null</pre><p><strong>Each node contains:</strong> Data, Next pointer, Prev pointer.</p><p><strong>Advantage:</strong> Can traverse backwards, easier to delete a node.</p>', duration: 7, resources: [] },
            { title: 'Lesson 2: Doubly Linked List — Node Creation', type: 'article', content: '<p><strong>Creating a node for a doubly linked list:</strong></p><pre>CREATE NODE with data = value, next = null, prev = null\n\nSET node1 TO CREATE NODE with data = 10, next = null, prev = null\nSET node2 TO CREATE NODE with data = 20, next = null, prev = null\nSET node3 TO CREATE NODE with data = 30, next = null, prev = null\n\nSET node1.next TO node2\nSET node2.prev TO node1\nSET node2.next TO node3\nSET node3.prev TO node2\n\n// null ← 10 ↔ 20 ↔ 30 → null</pre>', duration: 6, resources: [] },
            { title: 'Lesson 3: Doubly Linked List — Insertion', type: 'article', content: '<p><strong>Prepend and Append in a doubly linked list.</strong></p><pre>FUNCTION prepend(head, value)\n    CREATE newNode WITH data = value, next = null, prev = null\n    IF head == null THEN RETURN newNode\n    SET newNode.next TO head\n    SET head.prev TO newNode\n    RETURN newNode\nEND FUNCTION\n\nFUNCTION append(head, value)\n    CREATE newNode WITH data = value, next = null, prev = null\n    IF head == null THEN RETURN newNode\n    SET current TO head\n    WHILE current.next != null: SET current TO current.next\n    SET current.next TO newNode\n    SET newNode.prev TO current\n    RETURN head\nEND FUNCTION</pre>', duration: 7, resources: [] },
            { title: 'Lesson 4: Doubly Linked List — Deletion', type: 'article', content: '<p><strong>Deleting a node from a doubly linked list is easier.</strong></p><pre>FUNCTION delete(head, value)\n    IF head == null THEN RETURN null\n    SET current TO head\n    WHILE current != null AND current.data != value\n        SET current TO current.next\n    END WHILE\n    IF current == null THEN RETURN head\n    IF current.prev != null THEN SET current.prev.next TO current.next\n    IF current.next != null THEN SET current.next.prev TO current.prev\n    IF current == head THEN RETURN current.next\n    RETURN head\nEND FUNCTION</pre>', duration: 6, resources: [] },
            { title: 'Lesson 5: Circular Linked List', type: 'article', content: '<p><strong>A circular linked list has the last node pointing back to the first node.</strong></p><pre>[10] → [20] → [30] → (back to 10)</pre><p><strong>Why use circular linked lists?</strong> Round-robin scheduling, game loops, always accessible from any node.</p>', duration: 7, resources: [] },
            { title: 'Lesson 6: Circular Doubly Linked List', type: 'article', content: '<p><strong>A circular doubly linked list combines both concepts.</strong></p><pre>↔ [10] ↔ [20] ↔ [30] ↔ (back to 10)</pre><p><strong>Use cases:</strong> Music playlists, game loops, round-robin scheduling.</p>', duration: 6, resources: [] },
            {
              title: 'Module 7 Quiz — Advanced Linked Lists',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What extra pointer does a doubly linked list have?', type: 'multiple_choice', options: ['Next', 'Prev', 'Head', 'Tail'], correctOptionIndex: 1 },
                { questionText: 'In a doubly linked list, each node points to:', type: 'multiple_choice', options: ['Only next', 'Only prev', 'Next and prev', 'Only head'], correctOptionIndex: 2 },
                { questionText: 'In a circular linked list, the last node points to:', type: 'multiple_choice', options: ['Null', 'Itself', 'The first node', 'The previous node'], correctOptionIndex: 2 },
                { questionText: 'One advantage of doubly linked lists is:', type: 'multiple_choice', options: ['Uses less memory', 'Can traverse backwards', 'Faster access', 'Less code'], correctOptionIndex: 1 },
                { questionText: 'A circular linked list is useful for:', type: 'multiple_choice', options: ['Undo feature', 'Round-robin scheduling', 'Print queue', 'Parentheses checking'], correctOptionIndex: 1 },
                { questionText: 'In a circular linked list, what is the \'next\' of the last node?', type: 'multiple_choice', options: ['Null', 'Head', 'Tail', 'Itself'], correctOptionIndex: 1 },
                { questionText: 'Which has more pointers per node?', type: 'multiple_choice', options: ['Singly linked list', 'Doubly linked list', 'Circular singly', 'They are the same'], correctOptionIndex: 1 },
                { questionText: 'In a doubly linked list, if you have a node, you can:', type: 'multiple_choice', options: ['Only go forward', 'Only go backward', 'Go both forward and backward', 'Only go to head'], correctOptionIndex: 2 },
                { questionText: 'Circular linked lists are often used in:', type: 'multiple_choice', options: ['Browsers', 'Game development', 'Word processors', 'Spreadsheets'], correctOptionIndex: 1 },
                { questionText: 'What is the first node in a linked list called?', type: 'multiple_choice', options: ['Tail', 'Head', 'Middle', 'Pivot'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 8 ======
        {
          title: 'Module 8: Trees — Introduction',
          description: 'Learn the tree data structure and its terminology.',
          order: 8,
          lessons: [
            { title: 'Lesson 1: What Is a Tree?', type: 'article', content: '<p><strong>A tree is a data structure with a root node and child nodes forming a hierarchy.</strong></p><pre>        Grandfather\n       /          \\\n    Father       Uncle\n    /    \\         |\n Son1   Son2   Cousin</pre><p><strong>Tree terminology:</strong> Root, Parent, Child, Leaf.</p><p><strong>Real-world examples:</strong> File system, HTML, organization chart.</p>', duration: 7, resources: [] },
            { title: 'Lesson 2: Tree Terminology in Detail', type: 'article', content: '<p><strong>Level/Depth:</strong> Edges from root to a node.</p><pre>        Root (Level 0)\n       /    \\\n    Node1   Node2 (Level 1)\n   /  \\\nNode3 Node4 (Level 2)</pre><p><strong>Height:</strong> Maximum depth. <strong>Subtree:</strong> Node + all descendants. <strong>Edge:</strong> Connection between parent and child.</p>', duration: 6, resources: [] },
            { title: 'Lesson 3: Binary Trees', type: 'article', content: '<p><strong>A binary tree where each node has at most two children.</strong></p><pre>        10\n       /  \\\n      5    15\n     / \\     \\\n    3   7    20</pre><p><strong>Types:</strong> Full (0 or 2 children), Complete (all levels filled), Perfect (all internal have 2 children, all leaves same depth).</p>', duration: 7, resources: [] },
            { title: 'Lesson 4: Binary Search Trees (BST)', type: 'article', content: '<p><strong>A BST organizes data for fast searching.</strong> Left child contains smaller value, right child larger value.</p><pre>        50\n       /  \\\n      30   70\n     / \\   / \\\n    20 40 60 80</pre><pre>FUNCTION search(root, target)\n    IF root == null THEN RETURN False\n    IF root.data == target THEN RETURN True\n    ELSE IF target < root.data THEN RETURN search(root.left, target)\n    ELSE RETURN search(root.right, target)\nEND FUNCTION</pre>', duration: 8, resources: [] },
            { title: 'Lesson 5: BST Insertion and Deletion', type: 'article', content: '<p><strong>Inserting into a BST:</strong></p><pre>FUNCTION insert(root, value)\n    IF root == null THEN RETURN CREATE NODE with data=value\n    IF value < root.data THEN root.left = insert(root.left, value)\n    ELSE IF value > root.data THEN root.right = insert(root.right, value)\n    RETURN root\nEND FUNCTION</pre><p><strong>Deletion (3 cases):</strong> Leaf → remove; One child → replace; Two children → replace with smallest in right subtree.</p>', duration: 9, resources: [] },
            { title: 'Lesson 6: Tree Traversal Methods', type: 'article', content: '<p><strong>Three common ways to visit all nodes:</strong></p><p><strong>Pre-order:</strong> Root → Left → Right</p><p><strong>In-order:</strong> Left → Root → Right (gives sorted order in BST)</p><p><strong>Post-order:</strong> Left → Right → Root</p>', duration: 8, resources: [] },
            {
              title: 'Module 8 Quiz — Trees and BST',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is the top node of a tree called?', type: 'multiple_choice', options: ['Leaf', 'Child', 'Root', 'Branch'], correctOptionIndex: 2 },
                { questionText: 'What is a node with no children called?', type: 'multiple_choice', options: ['Root', 'Parent', 'Leaf', 'Branch'], correctOptionIndex: 2 },
                { questionText: 'In a BST, where do smaller values go?', type: 'multiple_choice', options: ['Left child', 'Right child', 'Parent', 'Root'], correctOptionIndex: 0 },
                { questionText: 'Which traversal visits: left, then root, then right?', type: 'multiple_choice', options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'], correctOptionIndex: 1 },
                { questionText: 'Which traversal visits: root, then left, then right?', type: 'multiple_choice', options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'], correctOptionIndex: 0 },
                { questionText: 'In a BST, searching takes approximately:', type: 'multiple_choice', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctOptionIndex: 1 },
                { questionText: 'What is the maximum number of children a node can have in a binary tree?', type: 'multiple_choice', options: ['1', '2', '3', 'Unlimited'], correctOptionIndex: 1 },
                { questionText: 'What is a leaf in a tree?', type: 'multiple_choice', options: ['A node with no children', 'A node with two children', 'The root', 'A node with one child'], correctOptionIndex: 0 },
                { questionText: 'Which traversal gives sorted output in a BST?', type: 'multiple_choice', options: ['Pre-order', 'In-order', 'Post-order', 'All give sorted'], correctOptionIndex: 1 },
                { questionText: 'What is the height of a tree with only a root node?', type: 'multiple_choice', options: ['0', '1', '2', 'Depends'], correctOptionIndex: 0 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 9 ======
        {
          title: 'Module 9: Advanced Trees — AVL and Red-Black',
          description: 'Learn self-balancing trees.',
          order: 9,
          lessons: [
            { title: 'Lesson 1: Why Do We Need Balanced Trees?', type: 'article', content: '<p><strong>BST can become unbalanced.</strong> Inserting 1,2,3,4,5 in order creates a linked list. Searching becomes O(n) instead of O(log n).</p><p><strong>Solution:</strong> Self-balancing trees like AVL and Red-Black trees.</p>', duration: 6, resources: [] },
            { title: 'Lesson 2: AVL Trees', type: 'article', content: '<p><strong>AVL trees are self-balancing BSTs.</strong> Balance factor = height(left) - height(right).</p><ul><li>If -1, 0, or 1 → balanced</li><li>If -2 or 2 → need rotation</li></ul><p><strong>Four rotations:</strong> LL (left), RR (right), LR (left-right), RL (right-left).</p>', duration: 10, resources: [] },
            { title: 'Lesson 3: AVL Tree Rotations', type: 'article', content: '<p><strong>Right Rotation (fixes left-left case):</strong></p><pre>Before:       After:\n   z            y\n  /            / \\\n y            x   z\n/\nx</pre><p><strong>Left Rotation (fixes right-right case):</strong> Mirror of above.</p><p><strong>Left-Right Rotation (fixes left-right case):</strong> First rotate left, then rotate right.</p>', duration: 8, resources: [] },
            { title: 'Lesson 4: Red-Black Trees', type: 'article', content: '<p><strong>Red-Black trees: another self-balancing BST.</strong></p><ul><li>Every node is red or black</li><li>Root is always black</li><li>No red node has a red child</li><li>All root-to-leaf paths have same black count</li></ul><p><strong>Used in:</strong> Java TreeMap, C++ map, Linux kernel.</p>', duration: 10, resources: [] },
            { title: 'Lesson 5: B-Trees', type: 'article', content: '<p><strong>B-Trees are used in databases.</strong> Each node can have many children. All leaves at the same level.</p><p><strong>B-Tree with order 3 (2-3 tree):</strong></p><pre>       [10, 20]\n      /   |   \\\n   [5]  [15]  [25, 30]</pre><p><strong>Use cases:</strong> MySQL, NTFS, HFS+.</p>', duration: 9, resources: [] },
            { title: 'Lesson 6: B+ Trees', type: 'article', content: '<p><strong>B+ Trees extend B-Trees for databases.</strong></p><ul><li>All data in leaves</li><li>Internal nodes store only keys</li><li>Leaves linked for fast range queries</li></ul><p><strong>Used in:</strong> MySQL, PostgreSQL.</p>', duration: 8, resources: [] },
            {
              title: 'Module 9 Quiz — Advanced Trees',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Why do we need balanced trees?', type: 'multiple_choice', options: ['They look better', 'To keep search time O(log n)', 'To use less memory', 'To sort faster'], correctOptionIndex: 1 },
                { questionText: 'What is an AVL tree?', type: 'multiple_choice', options: ['A sorted array', 'A self-balancing BST', 'A linked list', 'A queue'], correctOptionIndex: 1 },
                { questionText: 'The balance factor in AVL trees must be between:', type: 'multiple_choice', options: ['0 and 1', '-1 and 1', '-2 and 2', '0 and 5'], correctOptionIndex: 1 },
                { questionText: 'What is a Red-Black tree?', type: 'multiple_choice', options: ['A colorful tree', 'Another self-balancing BST', 'An array', 'A stack'], correctOptionIndex: 1 },
                { questionText: 'What color is always at the root of a Red-Black tree?', type: 'multiple_choice', options: ['Red', 'Black', 'Blue', 'Green'], correctOptionIndex: 1 },
                { questionText: 'B-Trees are commonly used in:', type: 'multiple_choice', options: ['Browsers', 'Databases', 'Text editors', 'Calculators'], correctOptionIndex: 1 },
                { questionText: 'In a B+ Tree, where is data stored?', type: 'multiple_choice', options: ['In internal nodes only', 'In leaves only', 'In both internal and leaves', 'Only in the root'], correctOptionIndex: 1 },
                { questionText: 'Which type of rotation fixes a left-left case in an AVL tree?', type: 'multiple_choice', options: ['Left rotation', 'Right rotation', 'Double rotation', 'No rotation'], correctOptionIndex: 1 },
                { questionText: 'What property do B-Trees maintain?', type: 'multiple_choice', options: ['All nodes have 2 children', 'All leaves are at the same level', 'All nodes are red', 'All nodes have 0 children'], correctOptionIndex: 1 },
                { questionText: 'B+ Trees are preferred over B-Trees for databases because:', type: 'multiple_choice', options: ['They use less memory', 'Leaves are linked for fast range queries', 'They are faster to build', 'They have fewer levels'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 10 ======
        {
          title: 'Module 10: Tries and Prefix Trees',
          description: 'Learn the Trie data structure for text storage.',
          order: 10,
          lessons: [
            { title: 'Lesson 1: What Is a Trie?', type: 'article', content: '<p><strong>A Trie (prefix tree) stores strings efficiently.</strong></p><pre>        (root)\n       /      \\\n      c        d\n     / \\        \\\n    a   a        o\n   /     \\        \\\n  t       r        g</pre><p><strong>Uses:</strong> Autocomplete, spell checking, word games, dictionary lookup.</p>', duration: 8, resources: [] },
            { title: 'Lesson 2: Trie Operations — Insert', type: 'article', content: '<pre>FUNCTION insert(root, word)\n    SET current TO root\n    FOR each character ch IN word\n        IF current.children[ch] == null THEN\n            CREATE newNode\n            SET current.children[ch] TO newNode\n        END IF\n        SET current TO current.children[ch]\n    END FOR\n    SET current.isEnd TO True\nEND FUNCTION</pre>', duration: 6, resources: [] },
            { title: 'Lesson 3: Trie Operations — Search', type: 'article', content: '<pre>FUNCTION search(root, word)\n    SET current TO root\n    FOR each character ch IN word\n        IF current.children[ch] == null THEN\n            RETURN False\n        END IF\n        SET current TO current.children[ch]\n    END FOR\n    RETURN current.isEnd\nEND FUNCTION</pre>', duration: 6, resources: [] },
            { title: 'Lesson 4: Trie Operations — Delete', type: 'article', content: '<p><strong>Deleting a word from a Trie</strong> — Recursively remove nodes that are not shared.</p>', duration: 7, resources: [] },
            { title: 'Lesson 5: Autocomplete Using Tries', type: 'article', content: '<p><strong>Autocomplete is the most common use of Tries.</strong> Navigate to the prefix node, then collect all words under it.</p>', duration: 7, resources: [] },
            { title: 'Lesson 6: Trie vs Hash Table', type: 'article', content: '<p><strong>Trie vs Hash Table:</strong> Trie excels at prefix search and doesn\'t have collisions. Hash table is faster for exact lookups and uses less memory.</p>', duration: 6, resources: [] },
            {
              title: 'Module 10 Quiz — Tries',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is a Trie used for?', type: 'multiple_choice', options: ['Storing numbers', 'Storing strings efficiently', 'Sorting arrays', 'Storing images'], correctOptionIndex: 1 },
                { questionText: 'Tries are also called:', type: 'multiple_choice', options: ['Binary trees', 'Prefix trees', 'Hash maps', 'Linked lists'], correctOptionIndex: 1 },
                { questionText: 'What is the main advantage of a Trie over a hash table?', type: 'multiple_choice', options: ['Faster lookup', 'Prefix search', 'Less memory', 'Easier deletion'], correctOptionIndex: 1 },
                { questionText: 'Tries are commonly used for:', type: 'multiple_choice', options: ['Autocomplete', 'Image processing', 'Audio storage', 'Video rendering'], correctOptionIndex: 0 },
                { questionText: 'In a Trie, what does each node represent?', type: 'multiple_choice', options: ['A number', 'A character', 'A string', 'An array'], correctOptionIndex: 1 },
                { questionText: 'The \'isEnd\' flag in a Trie indicates:', type: 'multiple_choice', options: ['The end of the trie', 'A complete word', 'The root', 'The last node'], correctOptionIndex: 1 },
                { questionText: 'What is the time complexity of searching in a Trie for a word of length L?', type: 'multiple_choice', options: ['O(1)', 'O(L)', 'O(log L)', 'O(L²)'], correctOptionIndex: 1 },
                { questionText: 'Autocomplete finds all words with a given:', type: 'multiple_choice', options: ['Suffix', 'Prefix', 'Root', 'Ending'], correctOptionIndex: 1 },
                { questionText: 'One disadvantage of Tries is:', type: 'multiple_choice', options: ['Slow lookup', 'High memory usage', 'Cannot find prefixes', 'No exact search'], correctOptionIndex: 1 },
                { questionText: 'In a Trie, the root node represents:', type: 'multiple_choice', options: ['The first character', 'The last character', 'An empty string', 'A special character'], correctOptionIndex: 2 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 11 ======
        {
          title: 'Module 11: Heaps and Priority Queues',
          description: 'Learn heaps — a tree-based data structure.',
          order: 11,
          lessons: [
            { title: 'Lesson 1: What Is a Heap?', type: 'article', content: '<p><strong>A heap is a complete binary tree with a special property.</strong></p><p><strong>Max-Heap:</strong> Parent >= children.</p><pre>        100\n       /   \\\n      90    80\n     / \\   / \\\n    70 60 50 40</pre><p><strong>Min-Heap:</strong> Parent <= children.</p><p><strong>Used for:</strong> Priority queues, heap sort, graph algorithms.</p>', duration: 8, resources: [] },
            { title: 'Lesson 2: Heap Operations — Insert', type: 'article', content: '<pre>FUNCTION insert(heap, value)\n    APPEND value TO heap\n    SET index TO length(heap) - 1\n    WHILE index > 0\n        SET parentIndex TO (index - 1) / 2\n        IF heap[index] <= heap[parentIndex] THEN BREAK\n        SWAP heap[index] AND heap[parentIndex]\n        SET index TO parentIndex\n    END WHILE\nEND FUNCTION</pre>', duration: 7, resources: [] },
            { title: 'Lesson 3: Heap Operations — Remove Max', type: 'article', content: '<p><strong>Removing the max (root) from a Max-Heap.</strong> Replace root with last element, bubble down.</p>', duration: 8, resources: [] },
            { title: 'Lesson 4: Heap Sort', type: 'article', content: '<p><strong>Heap Sort uses a heap to sort an array.</strong> Build max heap, then extract elements one by one.</p><p><strong>Time complexity:</strong> O(n log n) — very efficient, in-place!</p>', duration: 8, resources: [] },
            { title: 'Lesson 5: Priority Queues', type: 'article', content: '<p><strong>A priority queue uses a heap.</strong> Higher-priority items go to the front.</p><p><strong>Applications:</strong> Task scheduling, Dijkstra\'s algorithm, Huffman coding, OS process scheduling.</p>', duration: 7, resources: [] },
            { title: 'Lesson 6: Heap Applications — Finding Top K Elements', type: 'article', content: '<p><strong>Heaps find top K elements efficiently.</strong> Use a Min-Heap of size K: insert each element, if value > min, remove min and insert.</p>', duration: 7, resources: [] },
            {
              title: 'Module 11 Quiz — Heaps',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'In a Max-Heap, the parent is always:', type: 'multiple_choice', options: ['Smaller than children', 'Greater than or equal to children', 'Equal to children', 'Random'], correctOptionIndex: 1 },
                { questionText: 'What is the time complexity of heap insertion?', type: 'multiple_choice', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctOptionIndex: 1 },
                { questionText: 'What is the time complexity of removing the max from a heap?', type: 'multiple_choice', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctOptionIndex: 1 },
                { questionText: 'Heap Sort has time complexity of:', type: 'multiple_choice', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctOptionIndex: 1 },
                { questionText: 'A priority queue is often implemented using:', type: 'multiple_choice', options: ['Array', 'Heap', 'Stack', 'Queue'], correctOptionIndex: 1 },
                { questionText: 'In a Min-Heap, the smallest element is at the:', type: 'multiple_choice', options: ['Root', 'Leaf', 'Middle', 'End'], correctOptionIndex: 0 },
                { questionText: 'Finding top K elements is best done using:', type: 'multiple_choice', options: ['Stack', 'Heap', 'Queue', 'Array'], correctOptionIndex: 1 },
                { questionText: 'What operation is also called \'bubble up\'?', type: 'multiple_choice', options: ['Heapify', 'Heap insertion', 'Heap removal', 'Heap sort'], correctOptionIndex: 1 },
                { questionText: 'What operation is also called \'bubble down\'?', type: 'multiple_choice', options: ['Heapify', 'Heap insertion', 'Heap removal', 'Heap sort'], correctOptionIndex: 2 },
                { questionText: 'Heaps are used in which algorithm?', type: 'multiple_choice', options: ['Bubble Sort', 'Dijkstra\'s algorithm', 'Linear Search', 'BFS'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 12 ======
        {
          title: 'Module 12: Hash Tables',
          description: 'Learn hash tables — fast key-value storage.',
          order: 12,
          lessons: [
            { title: 'Lesson 1: What Is a Hash Table?', type: 'article', content: '<p><strong>A hash table maps keys to values with O(1) lookup.</strong></p><p><strong>Real-world examples:</strong> Python dict, JavaScript objects, Java HashMap, database indexes.</p>', duration: 8, resources: [] },
            { title: 'Lesson 2: Hash Functions', type: 'article', content: '<pre>FUNCTION hash(key, size)\n    SET sum TO 0\n    FOR each character ch IN key\n        SET sum TO sum + ASCII(ch)\n    END FOR\n    RETURN sum % size\nEND FUNCTION</pre><p><strong>Good hash functions:</strong> Fast, distribute keys evenly, minimize collisions.</p>', duration: 7, resources: [] },
            { title: 'Lesson 3: Collision Resolution — Chaining', type: 'article', content: '<p><strong>Chaining uses linked lists at each index.</strong> Multiple keys at the same index are stored in a linked list.</p>', duration: 7, resources: [] },
            { title: 'Lesson 4: Collision Resolution — Open Addressing', type: 'article', content: '<p><strong>Open Addressing finds another empty spot.</strong></p><p><strong>Linear probing:</strong> Try index+1, index+2, ...</p><p><strong>Quadratic probing:</strong> Try index+1², index+2², ...</p><p><strong>Double hashing:</strong> Use second hash function.</p>', duration: 8, resources: [] },
            { title: 'Lesson 5: Hash Table Operations', type: 'article', content: '<p><strong>Insert, Search, and Delete in a hash table.</strong></p><p>Hash the key, then use chaining or open addressing to handle collisions.</p>', duration: 7, resources: [] },
            { title: 'Lesson 6: Load Factor and Resizing', type: 'article', content: '<p><strong>Load Factor = elements / size.</strong></p><ul><li>Load factor > 0.75 → resize (grow)</li><li>Resizing keeps lookup time O(1)</li></ul>', duration: 7, resources: [] },
            {
              title: 'Module 12 Quiz — Hash Tables',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is a hash table?', type: 'multiple_choice', options: ['A sorted array', 'A key-value store with fast lookup', 'A linked list', 'A binary tree'], correctOptionIndex: 1 },
                { questionText: 'What is the average lookup time of a hash table?', type: 'multiple_choice', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correctOptionIndex: 0 },
                { questionText: 'A collision happens when:', type: 'multiple_choice', options: ['Two keys are the same', 'Two keys hash to the same index', 'Table is empty', 'Table is full'], correctOptionIndex: 1 },
                { questionText: 'What is chaining?', type: 'multiple_choice', options: ['Sorting hash table', 'Using linked lists to handle collisions', 'Resizing the table', 'Hash function'], correctOptionIndex: 1 },
                { questionText: 'What is open addressing?', type: 'multiple_choice', options: ['Finding another empty spot', 'Using linked lists', 'Sorting keys', 'Hash function'], correctOptionIndex: 0 },
                { questionText: 'What is a hash function?', type: 'multiple_choice', options: ['A function that sorts keys', 'A function that maps keys to indexes', 'A function that deletes keys', 'A function that lists keys'], correctOptionIndex: 1 },
                { questionText: 'What is load factor?', type: 'multiple_choice', options: ['Number of elements / table size', 'Number of collisions', 'Table size / number of elements', 'Hash function value'], correctOptionIndex: 0 },
                { questionText: 'When should a hash table be resized?', type: 'multiple_choice', options: ['When empty', 'When load factor > 0.75', 'When full', 'When empty'], correctOptionIndex: 1 },
                { questionText: 'Linear probing is a type of:', type: 'multiple_choice', options: ['Chaining', 'Open addressing', 'Sorting', 'Hash function'], correctOptionIndex: 1 },
                { questionText: 'Which uses less memory: chaining or open addressing?', type: 'multiple_choice', options: ['Chaining', 'Open addressing', 'Both same', 'Depends on data'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 13 ======
        {
          title: 'Module 13: Graphs — Introduction',
          description: 'Learn the graph data structure.',
          order: 13,
          lessons: [
            { title: 'Lesson 1: What Is a Graph?', type: 'article', content: '<p><strong>A graph has vertices (nodes) connected by edges.</strong></p><p><strong>Terminology:</strong> Vertex, Edge, Undirected, Directed, Weighted.</p><p><strong>Real-world examples:</strong> Social networks, road maps, web pages.</p>', duration: 8, resources: [] },
            { title: 'Lesson 2: Graph Representations — Adjacency Matrix', type: 'article', content: '<p><strong>Adjacency Matrix:</strong> 2D array showing connections. O(V²) memory.</p><p><strong>Advantage:</strong> Fast to check connections O(1). <strong>Disadvantage:</strong> Uses O(V²) memory.</p>', duration: 7, resources: [] },
            { title: 'Lesson 3: Graph Representations — Adjacency List', type: 'article', content: '<p><strong>Adjacency List:</strong> Array of lists. O(V+E) memory.</p><p><strong>Advantage:</strong> Efficient for sparse graphs. <strong>Disadvantage:</strong> Checking connection takes O(degree) time.</p>', duration: 7, resources: [] },
            { title: 'Lesson 4: Graph Traversal — BFS', type: 'article', content: '<p><strong>BFS explores all neighbors at current depth first.</strong> Uses a queue.</p><pre>FUNCTION bfs(graph, start)\n    CREATE QUEUE q, SET visited\n    ENQUEUE start TO q, ADD start TO visited\n    WHILE ISEMPTY(q) == False\n        SET current TO DEQUEUE q\n        DISPLAY current\n        FOR each neighbor IN graph[current]\n            IF neighbor NOT IN visited THEN\n                ADD neighbor TO visited\n                ENQUEUE neighbor TO q\n            END IF\n        END FOR\n    END WHILE\nEND FUNCTION</pre><p><strong>Used for:</strong> Shortest path in unweighted graphs, web crawling.</p>', duration: 8, resources: [] },
            { title: 'Lesson 5: Graph Traversal — DFS', type: 'article', content: '<p><strong>DFS explores as far as possible along each branch.</strong> Uses a stack or recursion.</p><pre>FUNCTION dfs(graph, current, visited)\n    ADD current TO visited\n    DISPLAY current\n    FOR each neighbor IN graph[current]\n        IF neighbor NOT IN visited THEN\n            dfs(graph, neighbor, visited)\n        END IF\n    END FOR\nEND FUNCTION</pre><p><strong>Used for:</strong> Maze solving, cycle detection, topological sorting.</p>', duration: 8, resources: [] },
            { title: 'Lesson 6: BFS vs DFS — Comparison', type: 'article', content: '<p><strong>BFS:</strong> Uses Queue, finds shortest path.</p><p><strong>DFS:</strong> Uses Stack/recursion, good for mazes and cycles.</p>', duration: 7, resources: [] },
            {
              title: 'Module 13 Quiz — Graphs (Basics)',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is a graph?', type: 'multiple_choice', options: ['A collection of vertices connected by edges', 'A collection of arrays', 'A collection of stacks', 'A type of tree'], correctOptionIndex: 0 },
                { questionText: 'An undirected graph means:', type: 'multiple_choice', options: ['Edges go one way', 'Edges go both ways', 'Edges have weights', 'Edges are invisible'], correctOptionIndex: 1 },
                { questionText: 'Adjacency Matrix uses how much memory for V vertices?', type: 'multiple_choice', options: ['O(V)', 'O(V²)', 'O(V+E)', 'O(E)'], correctOptionIndex: 1 },
                { questionText: 'Adjacency List uses how much memory?', type: 'multiple_choice', options: ['O(V²)', 'O(V+E)', 'O(E²)', 'O(V*E)'], correctOptionIndex: 1 },
                { questionText: 'BFS uses which data structure?', type: 'multiple_choice', options: ['Stack', 'Queue', 'Array', 'Tree'], correctOptionIndex: 1 },
                { questionText: 'DFS uses which data structure?', type: 'multiple_choice', options: ['Queue', 'Stack (or recursion)', 'Array', 'Hash Table'], correctOptionIndex: 1 },
                { questionText: 'Which traversal finds the shortest path in an unweighted graph?', type: 'multiple_choice', options: ['DFS', 'BFS', 'Binary Search', 'Hash Table'], correctOptionIndex: 1 },
                { questionText: 'DFS is good for:', type: 'multiple_choice', options: ['Shortest path', 'Maze solving', 'Print queue', 'Web crawling'], correctOptionIndex: 1 },
                { questionText: 'What is a weighted graph?', type: 'multiple_choice', options: ['Edges have values', 'Edges have no values', 'Edges are invisible', 'Edges are doubled'], correctOptionIndex: 0 },
                { questionText: 'A directed graph has:', type: 'multiple_choice', options: ['Edges that go both ways', 'Edges that go one way', 'No edges', 'Only one vertex'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 14 ======
        {
          title: 'Module 14: Advanced Graphs — Shortest Path',
          description: 'Learn shortest path algorithms.',
          order: 14,
          lessons: [
            { title: 'Lesson 1: Dijkstra\'s Algorithm', type: 'article', content: '<p><strong>Dijkstra finds shortest path from start to all other nodes.</strong> Works with positive weights only. Uses a priority queue.</p>', duration: 10, resources: [] },
            { title: 'Lesson 2: Dijkstra\'s Algorithm Example', type: 'article', content: '<p><strong>Example step-by-step</strong> finding shortest distances from a start node.</p>', duration: 8, resources: [] },
            { title: 'Lesson 3: Bellman-Ford Algorithm', type: 'article', content: '<p><strong>Bellman-Ford works with negative weights.</strong> Relaxes all edges V-1 times. Can detect negative cycles.</p>', duration: 9, resources: [] },
            { title: 'Lesson 4: Floyd-Warshall Algorithm', type: 'article', content: '<p><strong>Floyd-Warshall finds shortest paths between ALL pairs.</strong> O(V³) time. Works with negative weights.</p>', duration: 9, resources: [] },
            { title: 'Lesson 5: A* Search Algorithm', type: 'article', content: '<p><strong>A* uses heuristic + cost</strong> for intelligent pathfinding. Better than Dijkstra for map navigation with a good heuristic.</p>', duration: 10, resources: [] },
            { title: 'Lesson 6: Shortest Path Algorithm Comparison', type: 'article', content: '<p><strong>Comparison:</strong> Dijkstra (positive), Bellman-Ford (negative), Floyd-Warshall (all pairs), A* (heuristic).</p>', duration: 8, resources: [] },
            {
              title: 'Module 14 Quiz — Shortest Path',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Dijkstra\'s algorithm finds:', type: 'multiple_choice', options: ['Shortest path from one node to all', 'Shortest path between all pairs', 'Maximum flow', 'Minimum spanning tree'], correctOptionIndex: 0 },
                { questionText: 'Dijkstra\'s algorithm works with:', type: 'multiple_choice', options: ['Positive weights only', 'Negative weights only', 'Any weights', 'No weights'], correctOptionIndex: 0 },
                { questionText: 'Bellman-Ford algorithm works with:', type: 'multiple_choice', options: ['Positive weights only', 'Negative weights (and positive)', 'Only zero weights', 'No weights'], correctOptionIndex: 1 },
                { questionText: 'Floyd-Warshall finds:', type: 'multiple_choice', options: ['Shortest path from one node', 'Shortest paths between ALL pairs', 'Maximum path', 'Minimum spanning tree'], correctOptionIndex: 1 },
                { questionText: 'A* search uses:', type: 'multiple_choice', options: ['Only cost', 'Heuristic + cost', 'Only heuristic', 'Random guessing'], correctOptionIndex: 1 },
                { questionText: 'Dijkstra\'s algorithm uses which data structure?', type: 'multiple_choice', options: ['Stack', 'Priority Queue', 'Queue', 'Array'], correctOptionIndex: 1 },
                { questionText: 'A* is better than Dijkstra for:', type: 'multiple_choice', options: ['All graphs', 'Map navigation with heuristic', 'Graphs with negative weights', 'Graphs with no weights'], correctOptionIndex: 1 },
                { questionText: 'Floyd-Warshall has time complexity of:', type: 'multiple_choice', options: ['O(V²)', 'O(V³)', 'O(E log V)', 'O(VE)'], correctOptionIndex: 1 },
                { questionText: 'Bellman-Ford can detect:', type: 'multiple_choice', options: ['Positive cycles', 'Negative cycles', 'No cycles', 'All cycles'], correctOptionIndex: 1 },
                { questionText: 'A* is commonly used in:', type: 'multiple_choice', options: ['Spreadsheets', 'Game pathfinding', 'Databases', 'Web servers'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 15 ======
        {
          title: 'Module 15: Advanced Graphs — Minimum Spanning Tree',
          description: 'Learn MST algorithms.',
          order: 15,
          lessons: [
            { title: 'Lesson 1: What Is a Minimum Spanning Tree?', type: 'article', content: '<p><strong>An MST connects all vertices with minimum total edge weight.</strong></p><p><strong>Applications:</strong> Network design, circuit design, road planning.</p>', duration: 8, resources: [] },
            { title: 'Lesson 2: Kruskal\'s Algorithm', type: 'article', content: '<p><strong>Kruskal\'s builds MST by adding cheapest edge that doesn\'t create a cycle.</strong> Uses Disjoint Set (Union-Find). Time: O(E log E).</p>', duration: 9, resources: [] },
            { title: 'Lesson 3: Prim\'s Algorithm', type: 'article', content: '<p><strong>Prim\'s grows MST from a starting vertex.</strong> Uses a priority queue. Time: O(E log V).</p>', duration: 9, resources: [] },
            { title: 'Lesson 4: Kruskal vs Prim — Comparison', type: 'article', content: '<p><strong>Kruskal:</strong> Edge-based, best for sparse graphs.</p><p><strong>Prim:</strong> Vertex-based, best for dense graphs.</p>', duration: 7, resources: [] },
            { title: 'Lesson 5: Disjoint Set (Union-Find)', type: 'article', content: '<p><strong>Union-Find:</strong> FIND (find root) and UNION (merge two sets). Uses path compression and union by rank.</p>', duration: 8, resources: [] },
            { title: 'Lesson 6: MST Applications', type: 'article', content: '<p><strong>Applications:</strong> Network design, circuit design, road planning, telephone networks, pipeline networks, image segmentation.</p>', duration: 7, resources: [] },
            {
              title: 'Module 15 Quiz — Minimum Spanning Tree',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'A Minimum Spanning Tree connects all vertices with:', type: 'multiple_choice', options: ['Maximum total weight', 'Minimum total weight', 'All edges', 'No edges'], correctOptionIndex: 1 },
                { questionText: 'Kruskal\'s algorithm sorts edges by:', type: 'multiple_choice', options: ['Weight (ascending)', 'Weight (descending)', 'Vertex order', 'Random'], correctOptionIndex: 0 },
                { questionText: 'Prim\'s algorithm starts with:', type: 'multiple_choice', options: ['All edges', 'One vertex', 'All vertices', 'No vertices'], correctOptionIndex: 1 },
                { questionText: 'Kruskal\'s algorithm uses which data structure to detect cycles?', type: 'multiple_choice', options: ['Stack', 'Queue', 'Disjoint Set (Union-Find)', 'Hash Table'], correctOptionIndex: 2 },
                { questionText: 'Prim\'s algorithm uses which data structure?', type: 'multiple_choice', options: ['Stack', 'Priority Queue', 'Disjoint Set', 'Array'], correctOptionIndex: 1 },
                { questionText: 'MST applications include:', type: 'multiple_choice', options: ['Network design', 'Image segmentation', 'Road planning', 'All of the above'], correctOptionIndex: 3 },
                { questionText: 'What is \'union\' in Union-Find?', type: 'multiple_choice', options: ['Merging two sets', 'Finding a set', 'Deleting a set', 'Creating a set'], correctOptionIndex: 0 },
                { questionText: 'Kruskal\'s algorithm is best for:', type: 'multiple_choice', options: ['Dense graphs', 'Sparse graphs', 'All graphs', 'No graphs'], correctOptionIndex: 1 },
                { questionText: 'Prim\'s algorithm is best for:', type: 'multiple_choice', options: ['Dense graphs', 'Sparse graphs', 'Directed graphs', 'Weighted graphs'], correctOptionIndex: 0 },
                { questionText: 'What happens if you add an edge that creates a cycle in MST?', type: 'multiple_choice', options: ['You must add it', 'You skip it', 'You remove another edge', 'You add it anyway'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 16 ======
        {
          title: 'Module 16: Advanced Graphs — Topological Sort',
          description: 'Learn topological sorting for directed acyclic graphs.',
          order: 16,
          lessons: [
            { title: 'Lesson 1: What Is Topological Sort?', type: 'article', content: '<p><strong>Topological sort orders vertices so that for every edge (u→v), u comes before v.</strong> Only works on DAGs.</p><p><strong>Applications:</strong> Course prerequisites, task scheduling, build systems.</p>', duration: 8, resources: [] },
            { title: 'Lesson 2: Kahn\'s Algorithm (BFS)', type: 'article', content: '<p><strong>Kahn\'s Algorithm uses a queue.</strong> Calculate indegree, add vertices with indegree 0 to queue, process them.</p>', duration: 8, resources: [] },
            { title: 'Lesson 3: DFS Method', type: 'article', content: '<p><strong>DFS method:</strong> Use recursion, push vertices to stack after processing all neighbors. Reverse the stack for topological order.</p>', duration: 7, resources: [] },
            { title: 'Lesson 4: Cycle Detection in Graphs', type: 'article', content: '<p><strong>Use DFS with a recursion stack.</strong> If we encounter a node already in the recursion stack, there\'s a cycle.</p>', duration: 7, resources: [] },
            { title: 'Lesson 5: Applications of Topological Sort', type: 'article', content: '<p><strong>Used in:</strong> Course prerequisites, build systems, package management, project planning.</p>', duration: 7, resources: [] },
            { title: 'Lesson 6: Topological Sort vs Other Algorithms', type: 'article', content: '<p><strong>Topological sort:</strong> Orders DAG. <strong>BFS/DFS:</strong> Traverses any graph. <strong>Dijkstra:</strong> Shortest path. <strong>MST:</strong> Connect all.</p>', duration: 6, resources: [] },
            {
              title: 'Module 16 Quiz — Topological Sort',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Topological sort works on what type of graph?', type: 'multiple_choice', options: ['Any graph', 'Directed Acyclic Graph (DAG)', 'Undirected graph', 'Complete graph'], correctOptionIndex: 1 },
                { questionText: 'In topological sort, for edge u→v, u appears:', type: 'multiple_choice', options: ['After v', 'Before v', 'Anywhere', 'Never'], correctOptionIndex: 1 },
                { questionText: 'Kahn\'s algorithm uses which data structure?', type: 'multiple_choice', options: ['Stack', 'Queue', 'Array', 'Tree'], correctOptionIndex: 1 },
                { questionText: 'DFS topological sort uses which data structure?', type: 'multiple_choice', options: ['Queue', 'Stack', 'Array', 'Hash Table'], correctOptionIndex: 1 },
                { questionText: 'If a graph has a cycle, topological sort:', type: 'multiple_choice', options: ['Works fine', 'Fails', 'Ignores the cycle', 'Creates a new order'], correctOptionIndex: 1 },
                { questionText: 'Topological sort is used in:', type: 'multiple_choice', options: ['Course prerequisites', 'Maze solving', 'Shortest path', 'Minimum spanning tree'], correctOptionIndex: 0 },
                { questionText: 'What does Kahn\'s algorithm calculate first?', type: 'multiple_choice', options: ['Outdegree', 'Indegree', 'Weight', 'Distance'], correctOptionIndex: 1 },
                { questionText: 'DFS topological sort pushes vertices onto stack AFTER processing:', type: 'multiple_choice', options: ['All neighbors', 'No neighbors', 'One neighbor', 'The root'], correctOptionIndex: 0 },
                { questionText: 'The final result of topological sort is:', type: 'multiple_choice', options: ['Unique', 'Not unique (multiple valid orders possible)', 'Random', 'Empty'], correctOptionIndex: 1 },
                { questionText: 'Topological sort is used in build systems to:', type: 'multiple_choice', options: ['Find errors', 'Determine compilation order', 'Optimize code', 'Test programs'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 17 ======
        {
          title: 'Module 17: Advanced Graphs — Strongly Connected Components',
          description: 'Learn about strongly connected components and Kosaraju\'s algorithm.',
          order: 17,
          lessons: [
            { title: 'Lesson 1: What Are Strongly Connected Components?', type: 'article', content: '<p><strong>An SCC is a maximal set where every vertex can reach every other vertex.</strong></p><p><strong>Applications:</strong> Social networks, web clustering, circuit analysis.</p>', duration: 9, resources: [] },
            { title: 'Lesson 2: Kosaraju\'s Algorithm', type: 'article', content: '<p><strong>Kosaraju\'s algorithm:</strong> Two passes. First DFS on original graph to get finishing order. Then DFS on transpose graph to find SCCs.</p>', duration: 10, resources: [] },
            { title: 'Lesson 3: Tarjan\'s Algorithm', type: 'article', content: '<p><strong>Tarjan\'s algorithm finds SCCs in a single DFS.</strong> Uses low-link values and a stack. More efficient, no transpose needed.</p>', duration: 10, resources: [] },
            { title: 'Lesson 4: Kosaraju vs Tarjan', type: 'article', content: '<p><strong>Kosaraju:</strong> Two passes, easier to understand, needs transpose.</p><p><strong>Tarjan:</strong> One pass, more complex, less memory.</p>', duration: 8, resources: [] },
            { title: 'Lesson 5: Applications of SCCs', type: 'article', content: '<p><strong>Used in:</strong> Social network groups, web page clusters, circuit analysis, map reduction.</p>', duration: 8, resources: [] },
            { title: 'Lesson 6: Condensation Graphs (DAG of SCCs)', type: 'article', content: '<p><strong>Condensation graph:</strong> Each SCC becomes a node. The result is always a DAG.</p>', duration: 7, resources: [] },
            {
              title: 'Module 17 Quiz — Strongly Connected Components',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is a Strongly Connected Component (SCC)?', type: 'multiple_choice', options: ['A graph with no edges', 'A maximal set where every vertex can reach every other', 'A tree', 'A stack'], correctOptionIndex: 1 },
                { questionText: 'Kosaraju\'s algorithm requires:', type: 'multiple_choice', options: ['One pass', 'Two passes', 'Three passes', 'Four passes'], correctOptionIndex: 1 },
                { questionText: 'Tarjan\'s algorithm uses how many passes?', type: 'multiple_choice', options: ['One', 'Two', 'Three', 'Four'], correctOptionIndex: 0 },
                { questionText: 'Kosaraju\'s algorithm requires a:', type: 'multiple_choice', options: ['Transpose graph', 'Symmetric graph', 'Complete graph', 'No graph'], correctOptionIndex: 0 },
                { questionText: 'Tarjan\'s algorithm uses a:', type: 'multiple_choice', options: ['Queue', 'Stack', 'Array', 'Tree'], correctOptionIndex: 1 },
                { questionText: 'SCCs are used in:', type: 'multiple_choice', options: ['Social networks', 'Web crawling', 'Circuit analysis', 'All of the above'], correctOptionIndex: 3 },
                { questionText: 'After finding SCCs, the condensation graph is always:', type: 'multiple_choice', options: ['Cyclic', 'Acyclic (DAG)', 'Complete', 'Empty'], correctOptionIndex: 1 },
                { questionText: 'A condensation graph has one node for each:', type: 'multiple_choice', options: ['Vertex', 'Edge', 'SCC', 'Path'], correctOptionIndex: 2 },
                { questionText: 'Which algorithm finds SCCs in one pass?', type: 'multiple_choice', options: ['Kosaraju', 'Tarjan', 'Dijkstra', 'Floyd-Warshall'], correctOptionIndex: 1 },
                { questionText: 'SCCs help identify in social networks:', type: 'multiple_choice', options: ['Isolated users', 'Groups where everyone knows everyone', 'Influencers', 'Spam accounts'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 18 ======
        {
          title: 'Module 18: Flow Networks',
          description: 'Learn about maximum flow in networks.',
          order: 18,
          lessons: [
            { title: 'Lesson 1: What Is a Flow Network?', type: 'article', content: '<p><strong>A flow network has capacities on edges.</strong> Source (flow starts), Sink (flow ends).</p><p><strong>Applications:</strong> Transportation, computer networks, water supply.</p>', duration: 8, resources: [] },
            { title: 'Lesson 2: Max Flow — Min Cut Theorem', type: 'article', content: '<p><strong>Max Flow = Min Cut.</strong> The maximum flow equals the minimum capacity needed to disconnect source from sink.</p>', duration: 8, resources: [] },
            { title: 'Lesson 3: Ford-Fulkerson Algorithm', type: 'article', content: '<p><strong>Ford-Fulkerson finds max flow using augmenting paths.</strong> Uses a residual graph to track remaining capacity.</p>', duration: 10, resources: [] },
            { title: 'Lesson 4: Edmonds-Karp Algorithm', type: 'article', content: '<p><strong>Edmonds-Karp:</strong> Ford-Fulkerson with BFS to find shortest augmenting path. Better worst-case performance.</p>', duration: 10, resources: [] },
            { title: 'Lesson 5: Applications of Max Flow', type: 'article', content: '<p><strong>Applications:</strong> Network bandwidth, transportation, supply chain, bipartite matching, baseball elimination.</p>', duration: 8, resources: [] },
            { title: 'Lesson 6: Bipartite Matching Using Max Flow', type: 'article', content: '<p><strong>Bipartite matching via max flow:</strong> Source → People (capacity 1), People → Jobs (capacity 1), Jobs → Sink (capacity 1). Max flow = maximum matches.</p>', duration: 8, resources: [] },
            {
              title: 'Module 18 Quiz — Flow Networks',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'A flow network has:', type: 'multiple_choice', options: ['Capacities on edges', 'No capacities', 'Only vertices', 'Only paths'], correctOptionIndex: 0 },
                { questionText: 'Max Flow = Min Cut is called:', type: 'multiple_choice', options: ['Max-Flow Min-Cut Theorem', 'Dijkstra\'s Theorem', 'Floyd\'s Theorem', 'Bellman\'s Theorem'], correctOptionIndex: 0 },
                { questionText: 'Ford-Fulkerson uses:', type: 'multiple_choice', options: ['Augmenting paths', 'Shortest paths', 'Minimum spanning tree', 'Topological sort'], correctOptionIndex: 0 },
                { questionText: 'Edmonds-Karp uses BFS to find:', type: 'multiple_choice', options: ['Shortest augmenting path', 'Longest path', 'Minimum cut', 'Maximum matching'], correctOptionIndex: 0 },
                { questionText: 'Bipartite matching can be solved using:', type: 'multiple_choice', options: ['DFS only', 'Max flow', 'BFS only', 'Dijkstra'], correctOptionIndex: 1 },
                { questionText: 'In bipartite matching, each person and job edge has capacity:', type: 'multiple_choice', options: ['1', '0', '∞', 'Any'], correctOptionIndex: 0 },
                { questionText: 'The source is where flow:', type: 'multiple_choice', options: ['Ends', 'Starts', 'Pauses', 'Splits'], correctOptionIndex: 1 },
                { questionText: 'The sink is where flow:', type: 'multiple_choice', options: ['Ends', 'Starts', 'Pauses', 'Splits'], correctOptionIndex: 0 },
                { questionText: 'Max flow is used in:', type: 'multiple_choice', options: ['Network bandwidth', 'Transportation', 'Supply chain', 'All of the above'], correctOptionIndex: 3 },
                { questionText: 'The Min Cut identifies:', type: 'multiple_choice', options: ['Maximum flow', 'Bottlenecks in the network', 'Shortest path', 'Minimum spanning tree'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 19 ======
        {
          title: 'Module 19: Advanced Data Structures — Fenwick Tree',
          description: 'Learn the Fenwick Tree (Binary Indexed Tree).',
          order: 19,
          lessons: [
            { title: 'Lesson 1: What Is a Fenwick Tree?', type: 'article', content: '<p><strong>A Fenwick Tree (Binary Indexed Tree) supports prefix sum queries and point updates in O(log n) time.</strong></p>', duration: 9, resources: [] },
            { title: 'Lesson 2: Fenwick Tree — Build and Update', type: 'article', content: '<pre>FUNCTION update(tree, i, delta, n)\n    WHILE i <= n\n        tree[i] = tree[i] + delta\n        i = i + (i & -i)\n    END WHILE\nEND FUNCTION</pre>', duration: 8, resources: [] },
            { title: 'Lesson 3: Fenwick Tree — Query (Prefix Sum)', type: 'article', content: '<pre>FUNCTION prefixSum(tree, i)\n    SET sum TO 0\n    WHILE i > 0\n        sum = sum + tree[i]\n        i = i - (i & -i)\n    END WHILE\n    RETURN sum\nEND FUNCTION</pre>', duration: 8, resources: [] },
            { title: 'Lesson 4: Fenwick Tree vs Segment Tree', type: 'article', content: '<p><strong>Fenwick Tree:</strong> O(n) memory, easier code, prefix sums.</p><p><strong>Segment Tree:</strong> O(4n) memory, range updates, range min/max.</p>', duration: 8, resources: [] },
            { title: 'Lesson 5: Fenwick Tree — Finding the K-th Element', type: 'article', content: '<p><strong>Find k-th element using binary lifting on the Fenwick Tree.</strong></p>', duration: 8, resources: [] },
            { title: 'Lesson 6: Applications of Fenwick Tree', type: 'article', content: '<p><strong>Applications:</strong> Inversion count, frequency counting, order statistics, prefix XOR.</p>', duration: 8, resources: [] },
            {
              title: 'Module 19 Quiz — Fenwick Tree',
              type: 'quiz',
              content: '<p>Test your understanding of Lessons 1-6. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is a Fenwick Tree also called?', type: 'multiple_choice', options: ['Binary Indexed Tree', 'Binary Search Tree', 'Segment Tree', 'AVL Tree'], correctOptionIndex: 0 },
                { questionText: 'Fenwick Tree supports prefix sum queries in:', type: 'multiple_choice', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctOptionIndex: 1 },
                { questionText: 'Fenwick Tree uses how much memory?', type: 'multiple_choice', options: ['O(n)', 'O(2n)', 'O(4n)', 'O(n²)'], correctOptionIndex: 0 },
                { questionText: 'Point update in Fenwick Tree takes:', type: 'multiple_choice', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctOptionIndex: 1 },
                { questionText: 'Fenwick Tree is indexed starting from:', type: 'multiple_choice', options: ['0', '1', 'Any', 'Depends'], correctOptionIndex: 1 },
                { questionText: 'Range sum query in Fenwick Tree uses:', type: 'multiple_choice', options: ['Two prefix sum queries', 'One prefix sum query', 'No queries', 'Three queries'], correctOptionIndex: 0 },
                { questionText: 'Fenwick Tree is easier to code than:', type: 'multiple_choice', options: ['Array', 'Segment Tree', 'Linked List', 'Stack'], correctOptionIndex: 1 },
                { questionText: 'Inversion count can be found using:', type: 'multiple_choice', options: ['Fenwick Tree', 'Stack', 'Queue', 'Hash Table'], correctOptionIndex: 0 },
                { questionText: 'The bitwise operation for Fenwick Tree uses:', type: 'multiple_choice', options: ['& (AND)', '| (OR)', '^ (XOR)', '~ (NOT)'], correctOptionIndex: 0 },
                { questionText: 'Which operation is NOT directly supported by Fenwick Tree?', type: 'multiple_choice', options: ['Prefix sum', 'Point update', 'Range update', 'Prefix XOR'], correctOptionIndex: 2 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
          ],
        },

        // ====== MODULE 20 (includes final exam) ======
        {
          title: 'Module 20: Summary and Final Exam',
          description: 'Review all data structures and take the final exam.',
          order: 20,
          lessons: [
            { title: 'Lesson 1: Complete Course Review — Part 1', type: 'article', content: '<p><strong>Course Summary — Modules 1-10:</strong> Pseudocode, arrays, sorting, stacks, queues, linked lists, trees, BST, balanced trees, tries.</p>', duration: 12, resources: [] },
            { title: 'Lesson 2: Complete Course Review — Part 2', type: 'article', content: '<p><strong>Course Summary — Modules 11-19:</strong> Heaps, hash tables, graphs, shortest path, MST, topological sort, SCC, flow networks, Fenwick tree.</p>', duration: 12, resources: [] },
            { title: 'Lesson 3: Time and Space Complexity Review', type: 'article', content: '<p><strong>Big-O:</strong> O(1), O(log n), O(n), O(n log n), O(n²). Complexity cheat sheet for all data structures.</p>', duration: 10, resources: [] },
            { title: 'Lesson 4: Choosing the Right Data Structure', type: 'article', content: '<p><strong>Guide:</strong> Fast access by index → Array; LIFO → Stack; FIFO → Queue; Fast key-value → Hash Table; Fast search → BST; Priority → Heap; Paths → Graph; Hierarchical → Tree; Prefixes → Trie.</p>', duration: 8, resources: [] },
            { title: 'Lesson 5: Final Exam Preparation', type: 'article', content: '<p><strong>Final Exam:</strong> 90 minutes, 70% to pass. 20 MCQs (40 pts) + 10 open-ended (60 pts) = 100 total.</p>', duration: 8, resources: [] },
            { title: 'Lesson 6: Course Completion and Next Steps', type: 'article', content: '<p><strong>Congratulations!</strong> You now know all major data structures. Next: learn Python/Java/C++, practice LeetCode, build real projects.</p>', duration: 6, resources: [] },
            {
              title: 'Module 20 Quiz — Final Review',
              type: 'quiz',
              content: '<p>Review quiz covering all modules. You need 70% to pass.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Which data structure uses LIFO?', type: 'multiple_choice', options: ['Queue', 'Stack', 'Array', 'Linked List'], correctOptionIndex: 1 },
                { questionText: 'Which data structure uses FIFO?', type: 'multiple_choice', options: ['Stack', 'Queue', 'Array', 'Tree'], correctOptionIndex: 1 },
                { questionText: 'What is the time complexity of binary search?', type: 'multiple_choice', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctOptionIndex: 1 },
                { questionText: 'In a BST, smaller values go to the:', type: 'multiple_choice', options: ['Left child', 'Right child', 'Parent', 'Root'], correctOptionIndex: 0 },
                { questionText: 'Dijkstra\'s algorithm finds:', type: 'multiple_choice', options: ['Minimum spanning tree', 'Shortest path', 'Topological order', 'Maximum flow'], correctOptionIndex: 1 },
                { questionText: 'Which algorithm is used for MST?', type: 'multiple_choice', options: ['Dijkstra', 'Kruskal', 'Floyd-Warshall', 'Bellman-Ford'], correctOptionIndex: 1 },
                { questionText: 'Hash table lookup is typically:', type: 'multiple_choice', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctOptionIndex: 0 },
                { questionText: 'Topological sort works on:', type: 'multiple_choice', options: ['Any graph', 'DAG', 'Undirected graph', 'Complete graph'], correctOptionIndex: 1 },
                { questionText: 'A Fenwick Tree is also called:', type: 'multiple_choice', options: ['Segment Tree', 'Binary Indexed Tree', 'AVL Tree', 'BST'], correctOptionIndex: 1 },
                { questionText: 'Max Flow = Min Cut is called:', type: 'multiple_choice', options: ['Dijkstra\'s Theorem', 'Max-Flow Min-Cut Theorem', 'Floyd\'s Theorem', 'Bellman\'s Theorem'], correctOptionIndex: 1 },
              ],
              quizConfig: { timeLimit: 15, passingScore: 70, allowRetakes: true, questionsPerPage: 5 },
            },
            {
              title: 'Final Exam — Data Structures Mastery',
              type: 'assignment',
              content: '<p>You must score 70% or higher to pass. You have 90 minutes. Covers all 20 modules.</p>',
              isAssignment: true,
              requiredAssignment: true,
              assignmentDescription: 'Complete the final exam covering all 20 modules. Score 70% or higher to pass.',
              assignmentQuestions: [
                { questionText: 'What is pseudocode?', type: 'mcq', options: ['A real programming language', 'A simple way to write program steps in plain English', 'A type of computer virus', 'A software program'], correctOptionIndex: 1, points: 2 },
                { questionText: 'What is an array?', type: 'mcq', options: ['A single variable storing one value', 'A list of items stored in one variable', 'A type of loop', 'A conditional statement'], correctOptionIndex: 1, points: 2 },
                { questionText: 'In programming, what number is the FIRST item in an array?', type: 'mcq', options: ['1', '0', '-1', 'It depends'], correctOptionIndex: 1, points: 2 },
                { questionText: 'What does LIFO stand for?', type: 'mcq', options: ['Last In First Out', 'First In First Out', 'Last In Last Out', 'First In Last Out'], correctOptionIndex: 0, points: 2 },
                { questionText: 'What does FIFO stand for?', type: 'mcq', options: ['Last In First Out', 'First In First Out', 'Last In Last Out', 'First In Last Out'], correctOptionIndex: 1, points: 2 },
                { questionText: 'Which data structure uses PUSH and POP?', type: 'mcq', options: ['Queue', 'Stack', 'Array', 'Tree'], correctOptionIndex: 1, points: 2 },
                { questionText: 'Which data structure uses ENQUEUE and DEQUEUE?', type: 'mcq', options: ['Stack', 'Queue', 'Array', 'Linked List'], correctOptionIndex: 1, points: 2 },
                { questionText: 'What is the time complexity of bubble sort?', type: 'mcq', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correctOptionIndex: 1, points: 2 },
                { questionText: 'What is the time complexity of binary search?', type: 'mcq', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctOptionIndex: 1, points: 2 },
                { questionText: 'In a BST, smaller values go to the:', type: 'mcq', options: ['Left child', 'Right child', 'Parent', 'Root'], correctOptionIndex: 0, points: 2 },
                { questionText: 'What is the top node of a tree called?', type: 'mcq', options: ['Leaf', 'Child', 'Root', 'Branch'], correctOptionIndex: 2, points: 2 },
                { questionText: 'What is a node with no children called?', type: 'mcq', options: ['Root', 'Parent', 'Leaf', 'Branch'], correctOptionIndex: 2, points: 2 },
                { questionText: 'BFS uses which data structure?', type: 'mcq', options: ['Stack', 'Queue', 'Array', 'Hash Table'], correctOptionIndex: 1, points: 2 },
                { questionText: 'DFS uses which data structure?', type: 'mcq', options: ['Queue', 'Stack (or recursion)', 'Array', 'Hash Table'], correctOptionIndex: 1, points: 2 },
                { questionText: 'Dijkstra\'s algorithm finds:', type: 'mcq', options: ['Minimum spanning tree', 'Shortest path', 'Topological order', 'Maximum flow'], correctOptionIndex: 1, points: 2 },
                { questionText: 'Kruskal\'s algorithm is used for:', type: 'mcq', options: ['Shortest path', 'Minimum spanning tree', 'Topological sort', 'Strongly connected components'], correctOptionIndex: 1, points: 2 },
                { questionText: 'Hash table lookup is typically:', type: 'mcq', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctOptionIndex: 0, points: 2 },
                { questionText: 'Topological sort works on:', type: 'mcq', options: ['Any graph', 'Directed Acyclic Graph (DAG)', 'Undirected graph', 'Complete graph'], correctOptionIndex: 1, points: 2 },
                { questionText: 'A Fenwick Tree is also called:', type: 'mcq', options: ['Segment Tree', 'Binary Indexed Tree', 'AVL Tree', 'BST'], correctOptionIndex: 1, points: 2 },
                { questionText: 'Max Flow = Min Cut is called:', type: 'mcq', options: ['Dijkstra\'s Theorem', 'Max-Flow Min-Cut Theorem', 'Floyd\'s Theorem', 'Bellman\'s Theorem'], correctOptionIndex: 1, points: 2 },
                { questionText: 'List 3 rules of writing good pseudocode.', type: 'open', points: 6, sampleAnswer: '1. Use plain English words (START, END, IF, ELSE, FOR, WHILE). 2. Indent to show blocks of code. 3. One step per line.' },
                { questionText: 'Write pseudocode for binary search in a sorted array.', type: 'open', points: 6, sampleAnswer: 'FUNCTION binarySearch(array, target)\n    SET low TO 0\n    SET high TO length(array)-1\n    WHILE low <= high\n        SET mid TO (low + high) / 2\n        IF array[mid] == target THEN RETURN mid\n        ELSE IF array[mid] < target THEN SET low TO mid+1\n        ELSE SET high TO mid-1\n        END IF\n    END WHILE\n    RETURN -1\nEND FUNCTION' },
                { questionText: 'Explain the difference between a stack and a queue. Give one example of each.', type: 'open', points: 6, sampleAnswer: 'Stack uses LIFO — like a browser back button. Queue uses FIFO — like a print queue.' },
                { questionText: 'Write pseudocode to find the largest number in an array.', type: 'open', points: 6, sampleAnswer: 'FUNCTION findMax(array)\n    SET max TO array[0]\n    FOR each value IN array\n        IF value > max THEN SET max TO value\n    END FOR\n    RETURN max\nEND FUNCTION' },
                { questionText: 'Describe how a Binary Search Tree works and why it is efficient for searching.', type: 'open', points: 6, sampleAnswer: 'A BST organizes data so all smaller values go left and larger values go right. Searching eliminates half the tree at each step, giving O(log n) time.' },
                { questionText: 'What is the difference between BFS and DFS? When would you use each?', type: 'open', points: 6, sampleAnswer: 'BFS explores all neighbors first (queue), finds shortest paths. DFS explores deep first (stack/recursion), good for mazes and cycle detection.' },
                { questionText: 'Explain what a Trie is and its main use cases.', type: 'open', points: 6, sampleAnswer: 'A Trie (prefix tree) stores strings efficiently by sharing common prefixes. Main uses: autocomplete, spell checking, dictionary lookup.' },
                { questionText: 'What is the Max Flow problem and why is it important?', type: 'open', points: 6, sampleAnswer: 'Max Flow finds maximum flow from source to sink in a network. Important for network bandwidth, transportation, supply chain, and bipartite matching.' },
                { questionText: 'Explain the concept of an SCC (Strongly Connected Component) and how Kosaraju\'s algorithm works.', type: 'open', points: 6, sampleAnswer: 'An SCC is a maximal set where every vertex can reach every other. Kosaraju uses two DFS passes: first for finishing order, then on the transpose graph.' },
                { questionText: 'What will you do differently in your programming journey after completing this course?', type: 'open', points: 6, sampleAnswer: 'I will choose the right data structure for each problem, understand time/space complexity, implement these in a real language, and practice coding challenges.' },
              ],
              assignmentConfig: {
                timeLimit: 90,
                passingScore: 70,
                allowRetakes: true,
                mode: 'exam',
                disableRightClick: true,
              },
            },
          ],
        },
      ],
    };

    // Check if course already exists
    const existingCourse = await Course.findOne({
      title: courseData.title,
    });

    if (existingCourse) {
      console.log('⚠️  Course already exists. Updating with new data...');
      Object.assign(existingCourse, courseData);
      await existingCourse.save();
      console.log('✅ Updated existing course:', existingCourse.title);
    } else {
      const course = await new Course(courseData).save();
      console.log('✅ Created new course:', course.title);
    }

    console.log(`\n📊 Course Stats:`);
    const saved = await Course.findOne({ title: courseData.title });
    if (saved) {
      let totalLessons = 0;
      let totalQuizQs = 0;
      let totalExamQs = 0;
      for (const mod of saved.modules) {
        for (const les of (mod as any).lessons || []) {
          totalLessons++;
          totalQuizQs += (les.quizQuestions?.length || 0);
          totalExamQs += (les.assignmentQuestions?.length || 0);
        }
      }
      console.log(`   Modules: ${saved.modules.length}`);
      console.log(`   Lessons: ${totalLessons}`);
      console.log(`   Quiz questions: ${totalQuizQs}`);
      console.log(`   Exam questions: ${totalExamQs}`);
    }

    console.log('\n🏁 Data Structures course seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDataStructuresCourse();
