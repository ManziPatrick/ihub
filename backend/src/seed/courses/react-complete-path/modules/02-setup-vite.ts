import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 2,
  slug: 'setup-vite',
  title: 'Setup: Node, VS Code, Vite, First App',
  goal: 'Install the tools and create your first running React app with Vite.',
  estimatedMinutes: 75,
  projectSlug: null,
  videos: [
    {
      kind: 'short',
      title: 'Vite with React | Frontend development #shorts #software #malayalamtutorials #coding',
      channel: 'Debug Media',
      youtubeUrl: 'https://www.youtube.com/shorts/UK4j4bYJDv4',
      durationSeconds: null,
      fit: 'strong',
      note: 'Hashtag suggests the voice may be Malayalam. Check the language before using.',
    },
    {
      kind: 'full',
      title: 'React Installation using Vite | Install React Step by Step | React Tutorial for Beginners',
      channel: 'Programming with Harsh',
      youtubeUrl: 'https://www.youtube.com/watch?v=d_CYjSvdVaQ',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
  ],
  scriptFallback: [
    { onScreen: 'Terminal showing node -v printing a version number.', voiceover: 'First check Node is installed. Node lets your computer run JavaScript tools.' },
    { onScreen: 'Typing npm create vite@latest my-first-app and choosing React.', voiceover: 'One command creates a ready-made React project. That starter kit is called Vite.' },
    { onScreen: 'Browser opens localhost with the Vite + React welcome page.', voiceover: 'Start the dev server, open the page, and you have your first React app.' },
    { onScreen: 'VS Code with App.jsx, changing text and saving.', voiceover: 'Open it in VS Code, change one word, save, and watch the page update instantly.' },
  ],
  learn: [
    'Think of building a house. You need tools before bricks. For React you need three tools: Node, a code editor called VS Code, and a starter kit called Vite. Node runs JavaScript tools on your computer. VS Code is where you type code. Vite builds a fresh React project in seconds.',
    'A new term: terminal. The terminal is a small window where you type text commands instead of clicking buttons. You will type three commands: one to check Node, one to create the app, one to start it.',
    'A dev server is a small helper on your own computer. It shows your app in the browser and refreshes the page each time you save. You open it at an address like localhost:5173. Localhost means "this computer".',
    'If something fails, read the last red line slowly. Most setup errors are one of three things: Node is missing, the folder name has a space, or you are in the wrong folder. Fix that one thing and try again.',
  ],
  codeExample: {
    title: 'Commands to create and run your first app',
    language: 'bash',
    code: 'node -v\nnpm create vite@latest my-first-app -- --template react\ncd my-first-app\nnpm install\nnpm run dev',
    note: 'Type these five lines one by one. The last one starts your app.',
  },
  realExample:
    'Almost every React tutorial and startup project starts with Vite today because it is fast and simple. Companies use the same create, install, and dev-server steps before writing any real feature.',
  logicTraining: {
    thinkFirst: [
      'Is Node installed? What version prints?',
      'Which folder am I in right now?',
      'What name do I give my app (no spaces)?',
      'What will I check in the browser to know it worked?',
      'If red text appears, what is the LAST line saying?',
    ],
    predictTheOutput: [
      {
        code: 'node -v',
        question: 'You type this and Node is installed. What happens?',
        answer: 'A version number prints, like v20.11.0.',
        explanation: 'The -v flag asks Node to report its own version.',
      },
      {
        code: 'npm run dev',
        question: 'You run this inside your new app folder. What happens next?',
        answer: 'A local address like localhost:5173 appears, showing your app.',
        explanation: 'The dev server starts and serves your app on your own computer.',
      },
    ],
    findTheBug: {
      code: 'npm run dev\n# error: "Could not read package.json"',
      hint: 'The command is fine. The place you typed it is wrong.',
      fixedCode: 'cd my-first-app\nnpm run dev',
      explanation: 'You must be inside the app folder, where package.json lives.',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Hello in the browser',
        brief: 'Create the app, start it, and change the welcome text to your own name.',
        acceptanceCriteria: ['The app opens in the browser', 'Your name shows on the page after saving'],
        hints: ['The text lives in src/App.jsx.', 'Save the file and look at the browser.', 'No need to restart the server after saving.'],
        solutionOutline: ['Create and start the app', 'Open src/App.jsx in VS Code', 'Change one word, save, check the browser'],
      },
      {
        level: 'medium',
        title: 'Break it and fix it',
        brief: 'On purpose, start the server from the wrong folder, read the error, then fix it.',
        acceptanceCriteria: ['You can explain what the error meant', 'The app runs again after the fix'],
        hints: ['Go one folder up, then run npm run dev.', 'Read only the last two lines of red text.', 'The fix is one cd command.'],
        solutionOutline: ['Leave the app folder and run the command', 'Read and note the error', 'Go back inside and start again'],
      },
      {
        level: 'hard',
        title: 'Clean starter',
        brief: 'Delete the demo styles and starter code you do not need, until only your own Hello remains and the app still runs.',
        acceptanceCriteria: ['App still runs with no errors', 'Page shows only your own content', 'No unused starter files are imported'],
        hints: ['Remove the App.css import first, then the file.', 'Delete logos and files you no longer use.', 'After each delete, check the browser for errors.'],
        solutionOutline: ['List files the starter imports', 'Remove them one by one', 'Verify the page after each removal'],
      },
    ],
  },
  practiceLinks: [
    { label: 'Vite docs: getting started', url: 'https://vite.dev/guide/' },
    { label: 'React docs: start a new project', url: 'https://react.dev/learn/start-a-new-react-project' },
  ],
  quiz: [
    {
      question: 'What is Vite in this course?',
      options: ['A starter kit that creates a fresh React project in seconds', 'A new computer brand for developers', 'A website that hosts your photos', 'A virus checker for Node'],
      correctIndex: 0,
      explanation: 'Vite scaffolds the project files and gives you a fast dev server.',
    },
    {
      question: 'What does the dev server do?',
      options: ['Shows your app in the browser and refreshes it when you save', 'Uploads your app to the internet forever', 'Deletes old files to save space', 'Installs VS Code for you'],
      correctIndex: 0,
      explanation: 'It serves your app locally and reloads on every save.',
    },
    {
      question: 'What does "localhost" mean?',
      options: ['Your own computer', 'A computer in another country', 'The YouTube server', 'A shared school printer'],
      correctIndex: 0,
      explanation: 'Localhost is an address that points back to your machine.',
    },
    {
      question: 'You see "Could not read package.json" after npm run dev. What is wrong?',
      options: ['You are in the wrong folder, not inside your app', 'Your screen is too small', 'The internet is too slow', 'React is not popular anymore'],
      correctIndex: 0,
      explanation: 'The command must run where package.json lives — inside the app folder.',
    },
  ],
};

export default mod;
