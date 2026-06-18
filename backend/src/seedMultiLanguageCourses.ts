import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedMultiLanguageCourses = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding Multi-Language Programming Courses...\n');

    let instructor = await User.findOne({ role: { $in: ['admin', 'trainer', 'super_admin'] } });
    if (!instructor) {
      instructor = await new User({
        fullName: 'Code Master Bootskills',
        username: 'code.master',
        email: 'code.master@bootskills.com',
        password: 'Password@123',
        role: 'trainer',
        status: 'active',
        academicStatus: 'active',
      }).save();
    }
    const instructorId = instructor._id;

    // =====================================================================
    // COURSE 1: C Programming Fundamentals
    // =====================================================================
    const cCourse = {
      title: 'C Programming Fundamentals — From Hello World to Pointers',
      description: `<p>Learn the C programming language — the foundation of modern computing. This course covers variables, control flow, functions, arrays, pointers, structs, and file I/O.</p>
<p>🔧 <strong>All code exercises use the Judge0 API to compile and run your C code in a real GCC environment.</strong></p>
<p>Topics: printf, variables, if/else, loops, functions, arrays, strings, pointers, structs, file I/O.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800',
      instructor: instructorId,
      price: 0,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Programming',
      status: 'published',
      submissionRequired: true,
      school: 'Bootskills Academy',
      modules: [
        {
          title: 'Module 1: Hello, C!',
          description: 'Write your first C program and learn about variables, data types, and printf.',
          order: 1,
          lessons: [
            {
              title: 'Your First C Program',
              type: 'article',
              content: `<h2>Welcome to C!</h2>
<p>C is a powerful, low-level programming language that gives you fine-grained control over memory. It's the foundation of operating systems, embedded systems, and many other languages.</p>
<h3>Basic Structure</h3>
<pre><code>#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}</code></pre>
<ul>
<li><code>#include <stdio.h></code> — includes the standard I/O library</li>
<li><code>int main()</code> — the entry point of every C program</li>
<li><code>printf()</code> — prints formatted output</li>
<li><code>return 0;</code> — indicates successful execution</li>
</ul>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'c-m1-ex1',
                  title: 'Print Your Name',
                  description: 'Write a C program that prints your name to the console.',
                  language: 'c',
                  type: 'write',
                  initialCode: '#include <stdio.h>\n\nint main() {\n    // Print your name here\n    printf("______\\n");\n    return 0;\n}\n',
                  solutionCode: '#include <stdio.h>\n\nint main() {\n    printf("Alice\\n");\n    return 0;\n}\n',
                  testCode: '',
                  expectedOutput: 'Alice',
                },
                {
                  id: 'c-m1-ex2',
                  title: 'Variables and Format Specifiers',
                  description: 'Declare an integer and a float variable, assign values, and print them using printf with %d and %f format specifiers.',
                  language: 'c',
                  type: 'write',
                  initialCode: '#include <stdio.h>\n\nint main() {\n    int age = 25;\n    float height = 1.75;\n    \n    // Print "Age: 25, Height: 1.75"\n    printf("Age: %d, Height: %.2f\\n", age, height);\n    return 0;\n}\n',
                  solutionCode: '#include <stdio.h>\n\nint main() {\n    int age = 25;\n    float height = 1.75;\n    printf("Age: %d, Height: %.2f\\n", age, height);\n    return 0;\n}\n',
                  testCode: '',
                  expectedOutput: 'Age: 25, Height: 1.75',
                },
              ],
            },
            {
              title: 'Module 1 Quiz — C Basics',
              type: 'quiz',
              content: '<p>Test your understanding of C basics.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Which header file is needed for printf()?', type: 'multiple_choice', options: ['<stdlib.h>', '<stdio.h>', '<string.h>', '<math.h>'], correctOptionIndex: 1, explanation: 'printf() is declared in <stdio.h>.' },
                { questionText: 'What does int main() return on success?', type: 'multiple_choice', options: ['1', '0', '-1', 'void'], correctOptionIndex: 1, explanation: 'return 0; means successful execution.' },
                { questionText: 'Which format specifier is used for integers?', type: 'multiple_choice', options: ['%f', '%d', '%c', '%s'], correctOptionIndex: 1, explanation: '%d is for integers, %f for floats.' },
                { questionText: 'What character ends a statement in C?', type: 'multiple_choice', options: ['.', ';', ':', ','], correctOptionIndex: 1, explanation: 'Statements end with a semicolon (;).' },
                { questionText: 'What does \\\\n do in a string?', type: 'multiple_choice', options: ['Tab', 'New line', 'Null terminator', 'Backspace'], correctOptionIndex: 1, explanation: '\\\\n is the newline escape sequence.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },
        {
          title: 'Module 2: Control Flow & Functions',
          description: 'Learn if/else, loops, and how to write functions in C.',
          order: 2,
          lessons: [
            {
              title: 'If/Else and Loops',
              type: 'article',
              content: `<h2>Control Flow in C</h2>
<pre><code>int score = 85;

if (score >= 90) {
    printf("Grade: A\\n");
} else if (score >= 80) {
    printf("Grade: B\\n");
} else {
    printf("Grade: C\\n");
}

// For loop
for (int i = 0; i < 5; i++) {
    printf("%d ", i);  // 0 1 2 3 4
}

// While loop
int i = 0;
while (i < 5) {
    printf("%d ", i);
    i++;
}</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'c-m2-ex1',
                  title: 'Even or Odd Checker',
                  description: 'Write a C program that checks if the number 7 is even or odd using the modulo operator (%%).',
                  language: 'c',
                  type: 'write',
                  initialCode: '#include <stdio.h>\n\nint main() {\n    int num = 7;\n    // Check if num is even or odd\n    if (num % 2 == 0) {\n        printf("even\\n");\n    } else {\n        printf("odd\\n");\n    }\n    return 0;\n}\n',
                  solutionCode: '#include <stdio.h>\n\nint main() {\n    int num = 7;\n    if (num % 2 == 0) {\n        printf("even\\n");\n    } else {\n        printf("odd\\n");\n    }\n    return 0;\n}\n',
                  testCode: '',
                  expectedOutput: 'odd',
                },
                {
                  id: 'c-m2-ex2',
                  title: 'Sum 1 to N',
                  description: 'Write a C program that sums numbers from 1 to 10 using a for loop and prints the result.',
                  language: 'c',
                  type: 'write',
                  initialCode: '#include <stdio.h>\n\nint main() {\n    int sum = 0;\n    // Use a for loop to sum 1 to 10\n    for (int i = 1; i <= 10; i++) {\n        sum += i;\n    }\n    printf("Sum: %d\\n", sum);\n    return 0;\n}\n',
                  solutionCode: '#include <stdio.h>\n\nint main() {\n    int sum = 0;\n    for (int i = 1; i <= 10; i++) {\n        sum += i;\n    }\n    printf("Sum: %d\\n", sum);\n    return 0;\n}\n',
                  testCode: '',
                  expectedOutput: 'Sum: 55',
                },
              ],
            },
            {
              title: 'Module 2 Quiz — Control Flow',
              type: 'quiz',
              content: '<p>Test your understanding of C control flow.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What operator gives the remainder in C?', type: 'multiple_choice', options: ['/', '%%', '&', '#'], correctOptionIndex: 1, explanation: '% is the modulus operator.' },
                { questionText: 'How many times does for(i=0; i<3; i++) run?', type: 'multiple_choice', options: ['2', '3', '4', 'Infinite'], correctOptionIndex: 1, explanation: 'Runs for i=0,1,2 = 3 times.' },
                { questionText: 'What is the syntax for "else if"?', type: 'multiple_choice', options: ['elseif', 'else if', 'elif', 'elsif'], correctOptionIndex: 1, explanation: 'C uses "else if" (space between).' },
                { questionText: 'What does && mean in C?', type: 'multiple_choice', options: ['OR', 'AND', 'NOT', 'XOR'], correctOptionIndex: 1, explanation: '&& is the logical AND operator.' },
                { questionText: 'What is the increment operator?', type: 'multiple_choice', options: ['+1', '++', '+=', 'i+1'], correctOptionIndex: 1, explanation: '++ increments a variable by 1.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },
        {
          title: 'Module 3: Arrays, Strings & Pointers',
          description: 'Master arrays, string handling, and understand pointers in C.',
          order: 3,
          lessons: [
            {
              title: 'Arrays and Strings',
              type: 'article',
              content: `<h2>Arrays and Strings</h2>
<pre><code>// Arrays
int numbers[5] = {1, 2, 3, 4, 5};
printf("%d\\n", numbers[0]);  // 1

// Strings (arrays of char)
char name[] = "Alice";
printf("%s\\n", name);        // Alice
printf("%c\\n", name[0]);     // A

// String functions (include <string.h>)
#include <string.h>
printf("%lu\\n", strlen(name));  // 5</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'c-m3-ex1',
                  title: 'Reverse a String',
                  description: 'Write a C program that reverses the string "Hello" and prints the result.',
                  language: 'c',
                  type: 'write',
                  initialCode: '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char str[] = "Hello";\n    int len = strlen(str);\n    \n    // Print the string in reverse\n    for (int i = len - 1; i >= 0; i--) {\n        printf("%c", str[i]);\n    }\n    printf("\\n");\n    return 0;\n}\n',
                  solutionCode: '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char str[] = "Hello";\n    int len = strlen(str);\n    for (int i = len - 1; i >= 0; i--) {\n        printf("%c", str[i]);\n    }\n    printf("\\n");\n    return 0;\n}\n',
                  testCode: '',
                  expectedOutput: 'olleH',
                },
                {
                  id: 'c-m3-ex2',
                  title: 'Find Maximum in Array',
                  description: 'Write a C program that finds the maximum value in the array {3, 7, 2, 9, 5}.',
                  language: 'c',
                  type: 'write',
                  initialCode: '#include <stdio.h>\n\nint main() {\n    int numbers[] = {3, 7, 2, 9, 5};\n    int count = 5;\n    int max = numbers[0];\n    \n    // Find the maximum\n    for (int i = 1; i < count; i++) {\n        if (numbers[i] > max) {\n            max = numbers[i];\n        }\n    }\n    \n    printf("Max: %d\\n", max);\n    return 0;\n}\n',
                  solutionCode: '#include <stdio.h>\n\nint main() {\n    int numbers[] = {3, 7, 2, 9, 5};\n    int count = 5;\n    int max = numbers[0];\n    for (int i = 1; i < count; i++) {\n        if (numbers[i] > max) {\n            max = numbers[i];\n        }\n    }\n    printf("Max: %d\\n", max);\n    return 0;\n}\n',
                  testCode: '',
                  expectedOutput: 'Max: 9',
                },
              ],
            },
          ],
        },
      ],
    };

    // =====================================================================
    // COURSE 2: C++ Programming
    // =====================================================================
    const cppCourse = {
      title: 'C++ Programming — Objects, Classes & STL',
      description: `<p>Learn C++ from the ground up — from basic I/O to object-oriented programming and the Standard Template Library.</p>
<p>🔧 <strong>Code exercises use Judge0 to compile and run C++ with GCC 14.</strong></p>
<p>Topics: cout/cin, functions, classes, inheritance, vectors, strings, file I/O.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800',
      instructor: instructorId,
      price: 0,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Programming',
      status: 'published',
      submissionRequired: true,
      school: 'Bootskills Academy',
      modules: [
        {
          title: 'Module 1: C++ Basics',
          description: 'Learn C++ I/O, variables, and basic syntax.',
          order: 1,
          lessons: [
            {
              title: 'Hello C++ with cout',
              type: 'article',
              content: `<h2>Welcome to C++!</h2>
<p>C++ is an extension of C that adds object-oriented programming, templates, and the Standard Template Library (STL).</p>
<pre><code>#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}</code></pre>
<p>Key differences from C:</p>
<ul>
<li><code>cout</code> and <code>cin</code> instead of <code>printf</code>/<code>scanf</code></li>
<li><code>endl</code> for newline</li>
<li>Can use <code>string</code> type (from <code><string></code>)</li>
</ul>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'cpp-m1-ex1',
                  title: 'Print with cout',
                  description: 'Write a C++ program that prints "C++ is awesome!" to the console.',
                  language: 'cpp',
                  type: 'write',
                  initialCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "______" << endl;\n    return 0;\n}\n',
                  solutionCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "C++ is awesome!" << endl;\n    return 0;\n}\n',
                  testCode: '',
                  expectedOutput: 'C++ is awesome!',
                },
                {
                  id: 'cpp-m1-ex2',
                  title: 'Add Two Numbers',
                  description: 'Write a C++ program that declares two integers, adds them, and prints the sum.',
                  language: 'cpp',
                  type: 'write',
                  initialCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 15;\n    int b = 27;\n    int sum = a + b;\n    cout << "Sum: " << sum << endl;\n    return 0;\n}\n',
                  solutionCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 15;\n    int b = 27;\n    int sum = a + b;\n    cout << "Sum: " << sum << endl;\n    return 0;\n}\n',
                  testCode: '',
                  expectedOutput: 'Sum: 42',
                },
              ],
            },
            {
              title: 'Module 1 Quiz — C++ Basics',
              type: 'quiz',
              content: '<p>Test your C++ basics knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'Which header is needed for cout?', type: 'multiple_choice', options: ['<stdio.h>', '<iostream>', '<console>', '<output>'], correctOptionIndex: 1, explanation: 'cout is in the <iostream> header.' },
                { questionText: 'What does endl do?', type: 'multiple_choice', options: ['Ends the program', 'Adds a newline and flushes', 'Clears the screen', 'Adds a space'], correctOptionIndex: 1, explanation: 'endl adds a newline and flushes the output buffer.' },
                { questionText: 'C++ was originally called...?', type: 'multiple_choice', options: ['C with Classes', 'D', 'C+', 'Objective C'], correctOptionIndex: 0, explanation: 'C++ was originally called "C with Classes".' },
                { questionText: 'What is the C++ I/O operator for output?', type: 'multiple_choice', options: ['>>', '<<', '|>', '<|'], correctOptionIndex: 1, explanation: '<< is the stream insertion operator (output).' },
                { questionText: 'What does using namespace std do?', type: 'multiple_choice', options: ['Required for all programs', 'Allows using std names without std::', 'Creates a new namespace', 'Imports the C library'], correctOptionIndex: 1, explanation: 'It lets you write cout instead of std::cout.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },
        {
          title: 'Module 2: Functions & Vectors',
          description: 'Learn function overloading, references, and the vector container.',
          order: 2,
          lessons: [
            {
              title: 'Functions and the STL Vector',
              type: 'article',
              content: `<h2>Functions in C++</h2>
<pre><code>// Function overloading (same name, different params)
int add(int a, int b) { return a + b; }
double add(double a, double b) { return a + b; }

// Pass by reference
void swap(int &a, int &b) {
    int temp = a;
    a = b;
    b = temp;
}</code></pre>

<h2>Vector (dynamic array)</h2>
<pre><code>#include <vector>
vector<int> nums = {1, 2, 3};
nums.push_back(4);
cout << nums.size() << endl;  // 4
cout << nums[0] << endl;      // 1</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'cpp-m2-ex1',
                  title: 'Vector Average',
                  description: 'Write a C++ program that creates a vector of integers {10, 20, 30, 40, 50} and computes their average.',
                  language: 'cpp',
                  type: 'write',
                  initialCode: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> numbers = {10, 20, 30, 40, 50};\n    int sum = 0;\n    \n    for (int n : numbers) {\n        sum += n;\n    }\n    \n    cout << "Average: " << sum / numbers.size() << endl;\n    return 0;\n}\n',
                  solutionCode: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> numbers = {10, 20, 30, 40, 50};\n    int sum = 0;\n    for (int n : numbers) {\n        sum += n;\n    }\n    cout << "Average: " << sum / numbers.size() << endl;\n    return 0;\n}\n',
                  testCode: '',
                  expectedOutput: 'Average: 30',
                },
                {
                  id: 'cpp-m2-ex2',
                  title: 'Swap Function with References',
                  description: 'Write a C++ program with a swap function using references that swaps two integers.',
                  language: 'cpp',
                  type: 'write',
                  initialCode: '#include <iostream>\nusing namespace std;\n\nvoid swap(int &a, int &b) {\n    int temp = a;\n    a = b;\n    b = temp;\n}\n\nint main() {\n    int x = 5, y = 10;\n    cout << "Before: " << x << " " << y << endl;\n    swap(x, y);\n    cout << "After: " << x << " " << y << endl;\n    return 0;\n}\n',
                  solutionCode: '#include <iostream>\nusing namespace std;\n\nvoid swap(int &a, int &b) {\n    int temp = a;\n    a = b;\n    b = temp;\n}\n\nint main() {\n    int x = 5, y = 10;\n    cout << "Before: " << x << " " << y << endl;\n    swap(x, y);\n    cout << "After: " << x << " " << y << endl;\n    return 0;\n}\n',
                  testCode: '',
                  expectedOutput: 'Before: 5 10\nAfter: 10 5',
                },
              ],
            },
          ],
        },
        {
          title: 'Module 3: Classes & OOP',
          description: 'Learn object-oriented programming with classes, inheritance, and polymorphism.',
          order: 3,
          lessons: [
            {
              title: 'Classes and Objects',
              type: 'article',
              content: `<h2>Object-Oriented Programming in C++</h2>
<pre><code>class Student {
private:
    string name;
    int age;
    
public:
    Student(string n, int a) : name(n), age(a) {}
    
    void display() {
        cout << name << " is " << age << " years old" << endl;
    }
};

int main() {
    Student s("Alice", 25);
    s.display();  // Alice is 25 years old
    return 0;
}</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'cpp-m3-ex1',
                  title: 'Create a Rectangle Class',
                  description: 'Create a Rectangle class with width and height, a constructor, and an area() method. Print the area of a 5x3 rectangle.',
                  language: 'cpp',
                  type: 'write',
                  initialCode: '#include <iostream>\nusing namespace std;\n\nclass Rectangle {\nprivate:\n    double width;\n    double height;\n    \npublic:\n    Rectangle(double w, double h) {\n        width = w;\n        height = h;\n    }\n    \n    double area() {\n        return width * height;\n    }\n};\n\nint main() {\n    Rectangle rect(5.0, 3.0);\n    cout << "Area: " << rect.area() << endl;\n    return 0;\n}\n',
                  solutionCode: '#include <iostream>\nusing namespace std;\n\nclass Rectangle {\nprivate:\n    double width;\n    double height;\npublic:\n    Rectangle(double w, double h) : width(w), height(h) {}\n    double area() { return width * height; }\n};\n\nint main() {\n    Rectangle rect(5.0, 3.0);\n    cout << "Area: " << rect.area() << endl;\n    return 0;\n}\n',
                  testCode: '',
                  expectedOutput: 'Area: 15',
                },
              ],
            },
          ],
        },
      ],
    };

    // =====================================================================
    // COURSE 3: Java Programming
    // =====================================================================
    const javaCourse = {
      title: 'Java Programming — From Zero to OOP',
      description: `<p>Learn Java — the language of enterprise applications. This course covers Java fundamentals, object-oriented programming, and core Java libraries.</p>
<p>🔧 <strong>Code exercises run on Judge0 with JDK 17.</strong></p>
<p>Topics: System.out, variables, methods, classes, inheritance, arrays, ArrayLists.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
      instructor: instructorId,
      price: 0,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Programming',
      status: 'published',
      submissionRequired: true,
      school: 'Bootskills Academy',
      modules: [
        {
          title: 'Module 1: Java Basics',
          description: 'Write your first Java program, learn variables, and understand data types.',
          order: 1,
          lessons: [
            {
              title: 'Hello, Java!',
              type: 'article',
              content: `<h2>Welcome to Java!</h2>
<p>Java is a class-based, object-oriented language designed for portability. "Write once, run anywhere."</p>
<pre><code>public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}</code></pre>
<p>Key points:</p>
<ul>
<li>The class name must match the filename (Main.java)</li>
<li><code>main()</code> is the entry point — always <code>public static void main(String[] args)</code></li>
<li><code>System.out.println()</code> prints output</li>
</ul>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'java-m1-ex1',
                  title: 'Print a Message',
                  description: 'Write a Java program that prints "Learning Java is fun!" to the console.',
                  language: 'java',
                  type: 'write',
                  initialCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("______");\n    }\n}\n',
                  solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Learning Java is fun!");\n    }\n}\n',
                  testCode: '',
                  expectedOutput: 'Learning Java is fun!',
                },
                {
                  id: 'java-m1-ex2',
                  title: 'Variables and Arithmetic',
                  description: 'Write a Java program that declares two integers, adds them, and prints the result.',
                  language: 'java',
                  type: 'write',
                  initialCode: 'public class Main {\n    public static void main(String[] args) {\n        int a = 12;\n        int b = 30;\n        int sum = a + b;\n        System.out.println("Sum: " + sum);\n    }\n}\n',
                  solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        int a = 12;\n        int b = 30;\n        int sum = a + b;\n        System.out.println("Sum: " + sum);\n    }\n}\n',
                  testCode: '',
                  expectedOutput: 'Sum: 42',
                },
              ],
            },
            {
              title: 'Module 1 Quiz — Java Basics',
              type: 'quiz',
              content: '<p>Test your Java basics.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is the entry point of a Java program?', type: 'multiple_choice', options: ['int main()', 'public static void main(String[] args)', 'void main()', 'static main()'], correctOptionIndex: 1, explanation: 'Java requires the exact signature: public static void main(String[] args).' },
                { questionText: 'How do you print in Java?', type: 'multiple_choice', options: ['cout <<', 'printf()', 'System.out.println()', 'console.log()'], correctOptionIndex: 2, explanation: 'System.out.println() is the standard output in Java.' },
                { questionText: 'What does JVM stand for?', type: 'multiple_choice', options: ['Java Virtual Machine', 'Java Variable Memory', 'Java Visual Model', 'Java Version Manager'], correctOptionIndex: 0, explanation: 'JVM = Java Virtual Machine, which runs Java bytecode.' },
                { questionText: 'Must the class name match the filename?', type: 'multiple_choice', options: ['Yes', 'No', 'Only for public classes', 'Only for main classes'], correctOptionIndex: 0, explanation: 'The public class name must match the .java filename.' },
                { questionText: 'What is the size of int in Java?', type: 'multiple_choice', options: ['16 bits', '32 bits', '64 bits', 'Depends on system'], correctOptionIndex: 1, explanation: 'Java int is always 32 bits regardless of platform.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },
        {
          title: 'Module 2: Methods & Arrays',
          description: 'Learn how to write methods and work with arrays in Java.',
          order: 2,
          lessons: [
            {
              title: 'Methods and Arrays',
              type: 'article',
              content: `<h2>Methods</h2>
<pre><code>public static int add(int a, int b) {
    return a + b;
}

// Calling a method
int result = add(5, 3);
System.out.println(result);  // 8</code></pre>

<h2>Arrays</h2>
<pre><code>int[] numbers = {1, 2, 3, 4, 5};
System.out.println(numbers[0]);     // 1
System.out.println(numbers.length); // 5

// Loop through array
for (int i = 0; i < numbers.length; i++) {
    System.out.println(numbers[i]);
}

// Enhanced for loop
for (int n : numbers) {
    System.out.println(n);
}</code></pre>`,
              duration: 14,
              resources: [],
              codeExercises: [
                {
                  id: 'java-m2-ex1',
                  title: 'Array Maximum',
                  description: 'Write a Java program that finds the maximum value in the array {4, 8, 2, 10, 6}.',
                  language: 'java',
                  type: 'write',
                  initialCode: 'public class Main {\n    public static void main(String[] args) {\n        int[] numbers = {4, 8, 2, 10, 6};\n        int max = numbers[0];\n        \n        for (int i = 1; i < numbers.length; i++) {\n            if (numbers[i] > max) {\n                max = numbers[i];\n            }\n        }\n        \n        System.out.println("Max: " + max);\n    }\n}\n',
                  solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        int[] numbers = {4, 8, 2, 10, 6};\n        int max = numbers[0];\n        for (int i = 1; i < numbers.length; i++) {\n            if (numbers[i] > max) {\n                max = numbers[i];\n            }\n        }\n        System.out.println("Max: " + max);\n    }\n}\n',
                  testCode: '',
                  expectedOutput: 'Max: 10',
                },
              ],
            },
          ],
        },
      ],
    };

    // =====================================================================
    // COURSE 4: Go Programming
    // =====================================================================
    const goCourse = {
      title: 'Go Programming — Concurrency & Simplicity',
      description: `<p>Learn Go (Golang) — a modern language designed for simplicity, efficiency, and built-in concurrency.</p>
<p>🔧 <strong>Code exercises run on Judge0 with Go 1.22.</strong></p>
<p>Topics: fmt.Println, variables, functions, goroutines, structs, interfaces.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910auj7?auto=format&fit=crop&q=80&w=800',
      instructor: instructorId,
      price: 0,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Programming',
      status: 'published',
      submissionRequired: true,
      school: 'Bootskills Academy',
      modules: [
        {
          title: 'Module 1: Go Basics',
          description: 'Write your first Go program, learn variables, and understand Go\'s unique syntax.',
          order: 1,
          lessons: [
            {
              title: 'Hello, Go!',
              type: 'article',
              content: `<h2>Welcome to Go!</h2>
<p>Go is a statically-typed, compiled language designed at Google. It's known for its simplicity, fast compilation, and built-in concurrency.</p>
<pre><code>package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}</code></pre>
<p>Key points:</p>
<ul>
<li>Every Go program starts with <code>package main</code></li>
<li><code>import</code> brings in packages</li>
<li><code>func main()</code> is the entry point</li>
<li><code>fmt.Println()</code> prints output</li>
</ul>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'go-m1-ex1',
                  title: 'Print a Greeting',
                  description: 'Write a Go program that prints "Hello from Go!" to the console.',
                  language: 'go',
                  type: 'write',
                  initialCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("______")\n}\n',
                  solutionCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go!")\n}\n',
                  testCode: '',
                  expectedOutput: 'Hello from Go!',
                },
                {
                  id: 'go-m1-ex2',
                  title: 'Variables and Addition',
                  description: 'Write a Go program that declares two integers, adds them, and prints the result.',
                  language: 'go',
                  type: 'write',
                  initialCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    a := 20\n    b := 22\n    sum := a + b\n    fmt.Println("Sum:", sum)\n}\n',
                  solutionCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    a := 20\n    b := 22\n    sum := a + b\n    fmt.Println("Sum:", sum)\n}\n',
                  testCode: '',
                  expectedOutput: 'Sum: 42',
                },
              ],
            },
            {
              title: 'Module 1 Quiz — Go Basics',
              type: 'quiz',
              content: '<p>Test your Go basics knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What keyword declares a package in Go?', type: 'multiple_choice', options: ['package', 'module', 'namespace', 'lib'], correctOptionIndex: 0, explanation: 'Every Go file starts with "package".' },
                { questionText: 'What is the entry point in Go?', type: 'multiple_choice', options: ['int main()', 'func main()', 'void main()', 'main()'], correctOptionIndex: 1, explanation: 'func main() in package main is the entry point.' },
                { questionText: 'What is the short variable declaration operator?', type: 'multiple_choice', options: ['var :=', ':=', '=:', '::='], correctOptionIndex: 1, explanation: ':= declares and assigns a variable with inferred type.' },
                { questionText: 'Which package provides Println?', type: 'multiple_choice', options: ['fmt', 'io', 'os', 'strconv'], correctOptionIndex: 0, explanation: 'The fmt package provides formatted I/O like Println.' },
                { questionText: 'How do you import a package in Go?', type: 'multiple_choice', options: ['using fmt', '#include <fmt>', 'import "fmt"', 'include "fmt"'], correctOptionIndex: 2, explanation: 'Go uses the import keyword.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },
      ],
    };

    // =====================================================================
    // COURSE 5: Rust Programming
    // =====================================================================
    const rustCourse = {
      title: 'Rust Programming — Safety & Performance',
      description: `<p>Learn Rust — a systems programming language focused on safety, speed, and concurrency without a garbage collector.</p>
<p>🔧 <strong>Code exercises run on Judge0 with Rust 1.85.</strong></p>
<p>Topics: println!, variables, ownership, functions, structs, enums.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&q=80&w=800',
      instructor: instructorId,
      price: 0,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Programming',
      status: 'published',
      submissionRequired: true,
      school: 'Bootskills Academy',
      modules: [
        {
          title: 'Module 1: Rust Basics',
          description: 'Write your first Rust program and understand its unique ownership model.',
          order: 1,
          lessons: [
            {
              title: 'Hello, Rust!',
              type: 'article',
              content: `<h2>Welcome to Rust!</h2>
<p>Rust is a systems programming language that guarantees memory safety without a garbage collector. It's known for its powerful type system and fearless concurrency.</p>
<pre><code>fn main() {
    println!("Hello, World!");
}</code></pre>
<p>Key points:</p>
<ul>
<li><code>fn main()</code> is the entry point</li>
<li><code>println!</code> is a macro (note the !)</li>
<li>Variables are immutable by default (<code>let</code>)</li>
<li>Use <code>let mut</code> for mutable variables</li>
</ul>`,
              duration: 12,
              resources: [],
              codeExercises: [
                {
                  id: 'rust-m1-ex1',
                  title: 'Print a Message',
                  description: 'Write a Rust program that prints "Rust is blazingly fast!" to the console.',
                  language: 'rust',
                  type: 'write',
                  initialCode: 'fn main() {\n    println!("______");\n}\n',
                  solutionCode: 'fn main() {\n    println!("Rust is blazingly fast!");\n}\n',
                  testCode: '',
                  expectedOutput: 'Rust is blazingly fast!',
                },
                {
                  id: 'rust-m1-ex2',
                  title: 'Variables and Arithmetic',
                  description: 'Write a Rust program that multiplies 6 by 7 and prints the result.',
                  language: 'rust',
                  type: 'write',
                  initialCode: 'fn main() {\n    let a = 6;\n    let b = 7;\n    let product = a * b;\n    println!("Product: {}", product);\n}\n',
                  solutionCode: 'fn main() {\n    let a = 6;\n    let b = 7;\n    let product = a * b;\n    println!("Product: {}", product);\n}\n',
                  testCode: '',
                  expectedOutput: 'Product: 42',
                },
              ],
            },
            {
              title: 'Module 1 Quiz — Rust Basics',
              type: 'quiz',
              content: '<p>Test your Rust basics knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What is the entry point in Rust?', type: 'multiple_choice', options: ['int main()', 'fn main()', 'void main()', 'main()'], correctOptionIndex: 1, explanation: 'Rust uses fn main() as the entry point.' },
                { questionText: 'What does the ! in println! indicate?', type: 'multiple_choice', options: ['It\'s a function', 'It\'s a macro', 'It\'s a built-in', 'It\'s a keyword'], correctOptionIndex: 1, explanation: 'The ! indicates println! is a macro, not a function.' },
                { questionText: 'Are variables mutable by default in Rust?', type: 'multiple_choice', options: ['Yes', 'No'], correctOptionIndex: 1, explanation: 'Variables are immutable by default. Use let mut for mutable.' },
                { questionText: 'What keyword creates a mutable variable?', type: 'multiple_choice', options: ['let mut', 'mut let', 'var', 'mutable'], correctOptionIndex: 0, explanation: 'let mut declares a mutable variable.' },
                { questionText: 'What does Rust guarantee about memory?', type: 'multiple_choice', options: ['Garbage collection', 'Memory safety without GC', 'Manual memory only', 'Reference counting'], correctOptionIndex: 1, explanation: 'Rust guarantees memory safety through ownership, not GC.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },
      ],
    };

    // =====================================================================
    // COURSE 6: Python for Data Science
    // =====================================================================
    const pythonCourse = {
      title: 'Python for Data Science — Lists, Dicts & Functions',
      description: `<p>Learn Python with a focus on the data structures and patterns used in data science and automation.</p>
<p>🔧 <strong>Code exercises use Judge0 for Python 3.12 execution.</strong></p>
<p>Topics: print(), lists, list comprehensions, dictionaries, functions, file I/O, error handling.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=800',
      instructor: instructorId,
      price: 0,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Programming',
      status: 'published',
      submissionRequired: true,
      school: 'Bootskills Academy',
      modules: [
        {
          title: 'Module 1: Python Fundamentals',
          description: 'Review Python basics — print, variables, and data types.',
          order: 1,
          lessons: [
            {
              title: 'Python Quick Start',
              type: 'article',
              content: `<h2>Python Refresher</h2>
<pre><code>print("Hello, Python!")

name = "Alice"
age = 25
print(f"{name} is {age} years old")

# Type checking
print(type(42))       # <class 'int'>
print(type(3.14))     # <class 'float'>
print(type("hello"))  # <class 'str'>
print(type(True))     # <class 'bool'></code></pre>`,
              duration: 10,
              resources: [],
              codeExercises: [
                {
                  id: 'py-ds-m1-ex1',
                  title: 'F-String Formatting',
                  description: 'Write Python code that creates variables for a product name and price, then prints them using an f-string.',
                  language: 'python',
                  type: 'write',
                  initialCode: 'product = "Laptop"\nprice = 999.99\n# Print using f-string\nprint(f"The {product} costs ${price}")\n',
                  solutionCode: 'product = "Laptop"\nprice = 999.99\nprint(f"The {product} costs ${price}")',
                  testCode: '',
                  expectedOutput: 'The Laptop costs $999.99',
                },
                {
                  id: 'py-ds-m1-ex2',
                  title: 'List Comprehension',
                  description: 'Use a list comprehension to create a list of squares from 1 to 10 (1, 4, 9, ..., 100) and print it.',
                  language: 'python',
                  type: 'write',
                  initialCode: '# Use list comprehension to create squares\nsquares = [x**2 for x in range(1, 11)]\nprint(squares)\n',
                  solutionCode: 'squares = [x**2 for x in range(1, 11)]\nprint(squares)',
                  testCode: '',
                  expectedOutput: '[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]',
                },
              ],
            },
            {
              title: 'Module 1 Quiz — Python Review',
              type: 'quiz',
              content: '<p>Test your Python knowledge.</p>',
              duration: 15,
              quizQuestions: [
                { questionText: 'What function prints output in Python?', type: 'multiple_choice', options: ['print()', 'console.log()', 'echo()', 'output()'], correctOptionIndex: 0, explanation: 'print() is Python\'s built-in output function.' },
                { questionText: 'What is [x**2 for x in range(5)]?', type: 'multiple_choice', options: ['A loop', 'A list comprehension', 'A function', 'A generator'], correctOptionIndex: 1, explanation: 'That\'s a list comprehension that creates squares.' },
                { questionText: 'How do you write an f-string?', type: 'multiple_choice', options: ['"Hello {name}"', 'f"Hello {name}"', '"Hello %name"', '"Hello " + name'], correctOptionIndex: 1, explanation: 'f-strings start with f and use {} for variables.' },
                { questionText: 'What does len([1,2,3]) return?', type: 'multiple_choice', options: ['3', '2', '1', '4'], correctOptionIndex: 0, explanation: 'len() returns the number of elements.' },
                { questionText: 'What is the Python type for True/False?', type: 'multiple_choice', options: ['int', 'bool', 'str', 'None'], correctOptionIndex: 1, explanation: 'True and False are bool type.' },
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
            },
          ],
        },
      ],
    };

    // ─── Seed all courses ───────────────────────────────────────────────
    const courses = [
      { data: cCourse, label: 'C Programming' },
      { data: cppCourse, label: 'C++ Programming' },
      { data: javaCourse, label: 'Java Programming' },
      { data: goCourse, label: 'Go Programming' },
      { data: rustCourse, label: 'Rust Programming' },
      { data: pythonCourse, label: 'Python for Data Science' },
    ];

    for (const course of courses) {
      const existing = await Course.findOne({ title: course.data.title });
      if (existing) {
        Object.assign(existing, course.data);
        await existing.save();
        console.log(`✅ Updated: ${course.label}`);
      } else {
        await new Course(course.data).save();
        console.log(`✅ Created: ${course.label}`);
      }
    }

    console.log('\n📊 Multi-Language Courses Created:');
    for (const course of courses) {
      const saved = await Course.findOne({ title: course.data.title }).lean() as any;
      if (saved) {
        let totalExercises = 0;
        let totalLessons = 0;
        for (const mod of saved.modules) {
          for (const les of mod.lessons) {
            totalLessons++;
            if (les.codeExercises) totalExercises += les.codeExercises.length;
          }
        }
        console.log(`   ${course.data.title}`);
        console.log(`      📖 Lessons: ${totalLessons} | 💻 Code Exercises: ${totalExercises}`);
      }
    }
    console.log('\n🏁 All multi-language courses seeded successfully!');
    console.log('💡 All non-JavaScript code exercises will execute via the open-source Judge0 API.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedMultiLanguageCourses();
