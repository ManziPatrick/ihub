# Online Code Compiler - Implementation Plan

## Overview
Add an online code compiler/editor to lessons so students can write code, see output, and pass tests to proceed. Works like Udacity's interactive coding challenges and JSchallenger's fill-in-the-blank exercises.

## Architecture

### Data Model (Backend `Course.ts`)
Add `codeExercises` array to the lesson schema:
```ts
codeExercises: [{
  _id: false,
  id: String,
  title: String,
  description: String,          // What the student needs to do
  language: { type: String, enum: ['javascript', 'python', 'html', 'css'], default: 'javascript' },
  initialCode: String,           // Starter code shown in editor
  solutionCode: String,          // Correct solution (hidden from student)
  testCode: String,              // Test code to validate the solution
  type: { type: String, enum: ['fill-in', 'write', 'fix', 'test'], default: 'write' },
  hiddenTests: [String],         // Additional hidden test cases
  setupCode: String,             // Code that runs before tests (setup)
  expectedOutput: String,        // Expected output for simple output matching
}]
```

### Backend Code Execution
Create a new REST endpoint `/api/compile` that:
1. Accepts `{ code, language, testCode, exerciseType }`
2. Uses Node.js `vm` module to execute JavaScript safely
3. Returns `{ output, passed, testResults, error }`
4. Can also use the existing AI service for code evaluation

### GraphQL Changes
1. **typeDefs**: Add `CodeExercise` type, `CodeExecResult` type
2. **Mutation**: `runCode(code: String!, language: String!, testCode: String): CodeExecResult!`
3. **LessonInput**: Add `codeExercises` field

### Frontend Components

#### 1. `CodeExercise.tsx` (NEW)
- Code editor with syntax highlighting
- "Run Code" button
- Output display panel
- Test results display (pass/fail per test)
- Progress tracking (must pass all tests to proceed)
- Supports fill-in-the-blank mode
- Built using a lightweight code editor (CodeMirror)

#### 2. `CodeExerciseQuiz.tsx` (NEW)
- Wraps CodeExercise in a quiz flow
- Shows explanation after successful run
- Tracks attempts

#### 3. Integration into `LessonQuiz.tsx`
- Add code exercise type to quiz questions
- When a question has codeExercises, show the code editor instead of multiple choice

#### 4. Integration into `CourseDetail.tsx`
- When lesson has codeExercises, show them inline with lesson content
- Must pass to proceed

#### 5. Integration into `AssignmentExamView.tsx`
- Add code exercise questions to exams

#### 6. Course Builder
- Add code exercise UI to `AddLessonDialog.tsx` and `ManageQuestionsDialog.tsx`

## Implementation Steps

### Step 1: Backend - Code Execution Service
- Create `backend/src/services/compiler.service.ts`
- Use Node.js `vm` module for safe JavaScript execution
- Create REST endpoint `/api/compile`
- Add GraphQL mutation `runCode`

### Step 2: Backend - Data Model Changes
- Add `codeExercises` to lesson schema in `Course.ts`
- Add types to `typeDefs.ts`
- Add resolvers for `runCode`

### Step 3: Frontend - CodeExercise Component
- Install `@codemirror/view`, `@codemirror/state`, `@codemirror/lang-javascript`
- Create `CodeExercise.tsx` with:
  - CodeMirror editor
  - Run button
  - Output panel
  - Test result display
  - Fill-in-the-blank mode
  - Multiple attempts tracking

### Step 4: Frontend - Integrate into Lesson Flow
- Update `CourseDetail.tsx` to render code exercises
- Update `LessonQuiz.tsx` to support code exercise questions
- Update `AssignmentExamView.tsx` to support code exercises

### Step 5: Frontend - Course Builder
- Update `ManageQuestionsDialog.tsx` to support code exercises
- Update `AddLessonDialog.tsx` for code exercise fields

### Step 6: GraphQL Sync
- Update queries and mutations files

## Files to Modify
1. `backend/src/models/Course.ts` - Add codeExercises schema
2. `backend/src/graphql/typeDefs.ts` - Add types
3. `backend/src/graphql/resolvers.ts` - Add runCode resolver
4. `backend/src/index.ts` - Add compile route
5. `frontend/src/components/portal/CodeExercise.tsx` - NEW
6. `frontend/src/pages/portal/student/CourseDetail.tsx` - Integration
7. `frontend/src/components/portal/LessonQuiz.tsx` - Integration
8. `frontend/src/components/portal/AssignmentExamView.tsx` - Integration
9. `frontend/src/components/portal/dialogs/ManageQuestionsDialog.tsx` - Course builder
10. `frontend/src/lib/graphql/queries.ts` - GraphQL updates
11. `frontend/src/lib/graphql/mutations.ts` - GraphQL updates
12. `frontend/package.json` - Add CodeMirror deps

## Verification
1. Build the frontend to check for type errors: `cd frontend && npm run build`
2. Test the backend compilation: `cd backend && npm run dev` then POST to `/api/compile`
3. Manual test: Create a lesson with a code exercise, verify it appears in the student view
4. Manual test: Write code, run it, verify output shows and tests pass/fail correctly
