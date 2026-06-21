import { parseCourseText } from '../services/course-parser.service';

const sampleText = `
# Course Title: Master React & Node.js
# Description: Learn full-stack development with React and Node.js from scratch. Build real-world applications.
# Category: Development
# Level: Intermediate

## Module 1: React Fundamentals
Description: Learn the core concepts of React

### Lesson 1: Introduction to React
Duration: 15
Type: video
Content: React is a JavaScript library for building user interfaces.

### Lesson 2: Components & Props
Duration: 20
Type: video
Content: Understanding components and props in React.

### Lesson 3: State Management Quiz
Duration: 10
Type: quiz

## Module 2: Node.js Backend
Description: Build REST APIs with Node.js

### Lesson 1: Setting Up Express
Duration: 25
Type: video

### Lesson 2: Database Integration
Duration: 30
Type: assignment
Content: Connect your app to MongoDB and perform CRUD operations.
`;

const result = parseCourseText(sampleText);

let passed = 0;
let failed = 0;

function check(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ ${msg}`);
    passed++;
  } else {
    console.log(`  ❌ ${msg}`);
    failed++;
  }
}

console.log('\n=== Course Parser Test ===\n');

console.log('--- Basic Fields ---');
check(result.title === 'Master React & Node.js', `Title: "${result.title}"`);
check(result.description.startsWith('Learn full-stack'), `Description starts correctly`);
check(result.category === 'Development', `Category: ${result.category}`);
check(result.level === 'Intermediate', `Level: ${result.level}`);
check(result.errors.length === 0, `No errors (got ${result.errors.length})`);

console.log('\n--- Modules ---');
check(result.modules.length === 2, `2 modules (got ${result.modules.length})`);

if (result.modules.length >= 1) {
  check(result.modules[0].title === 'React Fundamentals', `Module 1 title: "${result.modules[0].title}"`);
  check(result.modules[0].description === 'Learn the core concepts of React', `Module 1 description`);
}

if (result.modules.length >= 2) {
  check(result.modules[1].title === 'Node.js Backend', `Module 2 title: "${result.modules[1].title}"`);
}

console.log('\n--- Lessons in Module 1 ---');
const mod1 = result.modules[0];
check(mod1.lessons.length === 3, `3 lessons (got ${mod1.lessons.length})`);

if (mod1.lessons.length >= 3) {
  check(mod1.lessons[0].title === 'Introduction to React', `Lesson 1.1 title`);
  check(mod1.lessons[0].duration === 15, `Lesson 1.1 duration: ${mod1.lessons[0].duration}`);
  check(mod1.lessons[0].type === 'video', `Lesson 1.1 type: ${mod1.lessons[0].type}`);
  check(mod1.lessons[0].content.includes('JavaScript library'), `Lesson 1.1 has content`);
  
  check(mod1.lessons[1].title === 'Components & Props', `Lesson 1.2 title`);
  
  check(mod1.lessons[2].title === 'State Management Quiz', `Lesson 1.3 title`);
  check(mod1.lessons[2].type === 'quiz', `Lesson 1.3 type: ${mod1.lessons[2].type}`);
}

console.log('\n--- Lessons in Module 2 ---');
const mod2 = result.modules[1];
check(mod2.lessons.length === 2, `2 lessons (got ${mod2.lessons.length})`);

if (mod2.lessons.length >= 2) {
  check(mod2.lessons[0].title === 'Setting Up Express', `Lesson 2.1 title`);
  check(mod2.lessons[0].type === 'video', `Lesson 2.1 type: ${mod2.lessons[0].type}`);
  
  check(mod2.lessons[1].title === 'Database Integration', `Lesson 2.2 title`);
  check(mod2.lessons[1].type === 'assignment', `Lesson 2.2 type: ${mod2.lessons[1].type}`);
  check(mod2.lessons[1].content.includes('MongoDB'), `Lesson 2.2 has content`);
}

console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed === 0) {
  console.log('✅ ALL TESTS PASSED!\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED!\n');
  process.exit(1);
}
