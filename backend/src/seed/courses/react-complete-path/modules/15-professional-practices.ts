import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 15,
  slug: 'professional-practices',
  title: 'Professional Practices: Structure, Safety, Testing, Access',
  goal: 'Ship professional apps with clean folders, error safety, tests, and accessibility.',
  estimatedMinutes: 140,
  projectSlug: null,
  videos: [
    {
      kind: 'full',
      title: 'Master ErrorBoundary Tests in React #ReactTesting',
      channel: 'Borstch',
      youtubeUrl: 'https://www.youtube.com/watch?v=HzLERBs8wGs',
      durationSeconds: null,
      fit: 'weak',
      note: 'About testing error boundaries, not an introduction.',
    },
    {
      kind: 'full',
      title: 'Testing a Next.js App with React Testing Library & Jest',
      channel: 'Dave Gray',
      youtubeUrl: 'https://www.youtube.com/watch?v=XTNqyEBPAFw',
      durationSeconds: null,
      fit: 'partial',
      note: null,
    },
    {
      kind: 'short',
      title: null,
      channel: null,
      youtubeUrl: null,
      searchQuery: 'React error boundary explained beginner',
      durationSeconds: null,
      fit: null,
      note: 'No introduction video for error boundaries yet.',
    },
    {
      kind: 'short',
      title: null,
      channel: null,
      youtubeUrl: null,
      searchQuery: 'React Testing Library basics beginner',
      durationSeconds: null,
      fit: null,
      note: 'No Short for testing basics yet.',
    },
  ],
  scriptFallback: [
    { onScreen: 'A messy drawer vs a labeled toolbox with folders.', voiceover: 'Professionals sort code into labeled folders: components, pages, hooks, and services.' },
    { onScreen: 'A cracked widget caught by a safety net; the rest of the page survives.', voiceover: 'An error boundary is a safety net. One broken widget shows a fallback instead of killing the page.' },
    { onScreen: 'A robot clicking a button and checking the text.', voiceover: 'Tests are robot users. They click and check, so refactors cannot silently break features.' },
    { onScreen: 'A page used with keyboard only and a screen reader.', voiceover: 'Accessibility means everyone can use your app: keyboard, labels, and contrast.' },
  ],
  learn: [
    'Think of a toolbox. A professional keeps screws, nails, and tools in labeled boxes — not one messy drawer. React apps do the same: components/ for reusable pieces, pages/ for routes, hooks/ for shared logic, services/ for API calls. Anyone opening the project finds things in seconds.',
    'Apps crash. An error boundary is a safety net component that catches crashes in the pages below it and shows a friendly fallback ("Something broke — try again") instead of a white screen. A new term: error boundary. It is a class component with special crash-catching powers that wraps risky parts like widgets and feeds.',
    'Testing means hiring robot users. Testing Library renders your component, clicks buttons the way a human would, and checks the screen. One good first test: "typing a name and clicking Join shows Welcome". Tests do not prove perfection — they catch accidents when you change code later.',
    'Accessibility (called a11y) means everyone can use your app, including keyboard-only and screen-reader users. Use real <button> elements, label every input, keep text contrast strong, and test your whole app with only the Tab and Enter keys.',
  ],
  codeExample: {
    title: 'Error boundary safety net',
    language: 'jsx',
    code: 'import { Component } from "react";\n\nclass SafetyNet extends Component {\n  state = { broken: false };\n\n  static getDerivedStateFromError() {\n    return { broken: true };\n  }\n\n  render() {\n    if (this.state.broken) {\n      return <p>Something broke here. The rest of the app still works.</p>;\n    }\n    return this.props.children;\n  }\n}\n\nfunction App() {\n  return (\n    <SafetyNet>\n      <RiskyWidget />\n    </SafetyNet>\n  );\n}',
    note: 'Wrap risky widgets; one crash shows a fallback, not a white screen.',
  },
  realExample:
    'Teams keep components, pages, hooks, and API code in separate folders so new developers onboard fast. Banks wrap risky widgets in error boundaries so one failure never blanks the dashboard. Shops test checkout buttons with robot clicks before every release.',
  logicTraining: {
    thinkFirst: [
      'Where does each new file belong (component, page, hook, service)?',
      'Which parts are risky enough to deserve a safety net?',
      'What is the ONE user flow that must never break (test it first)?',
      'Can I use this app with keyboard only?',
      'Does every input have a label a screen reader can read?',
    ],
    predictTheOutput: [
      {
        code: '<SafetyNet><RiskyWidget /></SafetyNet>\n// RiskyWidget throws during render',
        question: 'What shows where RiskyWidget was?',
        answer: 'The fallback message, while the rest of the app keeps working.',
        explanation: 'The boundary catches the crash and renders its fallback instead.',
      },
      {
        code: '// test: render(<Join />); click "Join" with empty name',
        question: 'The app shows "Please type your name." What does the test check?',
        answer: 'That the error text appears on the screen.',
        explanation: 'Tests assert what a human would see after the same clicks.',
      },
    ],
    findTheBug: {
      code: 'function App() {\n  return (\n    <div>\n      <img src="/pic.jpg" />\n      <div onClick={submit}>Send</div>\n      <input placeholder="Email" />\n    </div>\n  );\n}',
      hint: 'Keyboard users and screen readers are locked out three times here.',
      fixedCode: 'function App() {\n  return (\n    <div>\n      <img src="/pic.jpg" alt="Team photo" />\n      <button onClick={submit}>Send</button>\n      <label>Email<input placeholder="Email" /></label>\n    </div>\n  );\n}',
      explanation: 'Real buttons, image alt text, and labels open the app to everyone.',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Sort the toolbox',
        brief: 'Reorganize any course project into components, pages, hooks, and services folders.',
        acceptanceCriteria: ['Every file sits in the right folder', 'App still runs with no broken imports'],
        hints: ['Move one folder at a time.', 'Fix import paths after each move.', 'API calls go to services.'],
        solutionOutline: ['Create the four folders', 'Move files group by group', 'Run the app after each move'],
      },
      {
        level: 'medium',
        title: 'Net the risky widget',
        brief: 'Wrap a data-fetching widget in an error boundary with a retry button.',
        acceptanceCriteria: ['Crash shows fallback, page survives', 'Retry resets the boundary'],
        hints: ['Boundary needs resettable state.', 'Retry clears the broken flag.', 'Test by throwing on purpose.'],
        solutionOutline: ['Write the SafetyNet class', 'Wrap the widget', 'Add and test retry'],
      },
      {
        level: 'hard',
        title: 'Robot-test the signup',
        brief: 'Write two Testing Library tests: empty submit shows an error; good data shows welcome.',
        acceptanceCriteria: ['Both tests pass', 'Tests click like a human (no direct state pokes)'],
        hints: ['Render, type, click, assert text.', 'Query by label and button text.', 'One behavior per test.'],
        solutionOutline: ['Set up the test file', 'Write the empty-submit test', 'Write the happy-path test'],
      },
    ],
  },
  practiceLinks: [
    { label: 'React docs: error boundaries', url: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary' },
    { label: 'Testing Library docs', url: 'https://testing-library.com/docs/' },
    { label: 'MDN: accessibility basics', url: 'https://developer.mozilla.org/en-US/docs/Learn/Accessibility' },
  ],
  quiz: [
    {
      question: 'Where do API calls belong in a clean project?',
      options: ['In services/ — one labeled place for server talk', 'Mixed inside every button file', 'In the pictures folder', 'Nowhere, apps need no data'],
      correctIndex: 0,
      explanation: 'Labeled folders let anyone find code in seconds.',
    },
    {
      question: 'What does an error boundary do?',
      options: ['Catches a crash below it and shows a friendly fallback', 'Prevents all bugs from ever happening', 'Speeds up the internet', 'Deletes broken files'],
      correctIndex: 0,
      explanation: 'It is a safety net: one widget fails, the page survives.',
    },
    {
      question: 'What is a good FIRST test to write?',
      options: ['The one user flow that must never break, like signup', 'Testing that 1 + 1 equals 2', 'Testing the color of the logo', 'Testing nothing at all'],
      correctIndex: 0,
      explanation: 'Robot users guard the critical path against future accidents.',
    },
    {
      question: 'Which choice is accessible?',
      options: ['A real <button> with text plus labeled inputs', 'A div with onClick and no labels', 'Grey text on a white background', 'An image with no alt text'],
      correctIndex: 0,
      explanation: 'Real buttons, labels, and contrast open the app to everyone.',
    },
  ],
};

export default mod;
