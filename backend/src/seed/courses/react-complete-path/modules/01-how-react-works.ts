import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 1,
  slug: 'how-react-works',
  title: 'How React Works: Thinking in Components',
  goal: 'Explain any web page as small reusable components and describe how React updates the screen.',
  estimatedMinutes: 60,
  projectSlug: null,
  videos: [
    {
      kind: 'short-clip',
      title: 'React - Short Overview [Dev Concepts #17]',
      channel: 'Code with Nakov | SoftUni Global',
      youtubeUrl: 'https://www.youtube.com/watch?v=gEbHl9EhwoI',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'full',
      title: 'React JS Crash Course',
      channel: 'Traversy Media',
      youtubeUrl: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
      durationSeconds: null,
      fit: 'partial',
      note: 'Long crash course. Use the first part for the big picture.',
    },
    {
      kind: 'short',
      title: null,
      channel: null,
      youtubeUrl: null,
      searchQuery: 'React components explained for beginners shorts',
      durationSeconds: null,
      fit: null,
      note: 'Topic has full videos but no Short yet.',
    },
  ],
  scriptFallback: [
    { onScreen: 'A shop page next to boxes labeled Header, Product, Button.', voiceover: 'A web page is a set of boxes. React calls each box a component.' },
    { onScreen: 'One Product box copied three times with different names and prices.', voiceover: 'One component can show many products. You reuse it with different data.' },
    { onScreen: 'A price tag changes; only that tag flashes and updates.', voiceover: 'When data changes, React updates only that small part of the screen.' },
    { onScreen: 'Smiling learner next to the three boxes.', voiceover: 'Think in components, and React starts to feel simple.' },
  ],
  learn: [
    'Think of a web page like a house made of LEGO bricks. Each brick is one small part: a title, a button, a picture. In React each brick is called a component. A component is a small piece of the screen with its own job.',
    'You build big pages by putting small components together. A Shop page holds a Header, a ProductList, and a Footer. The ProductList holds many Product cards. Each card is the same component showing different data.',
    'React watches your data. When data changes, React redraws only the small part that must change. The rest of the page stays the same. This is why React apps feel fast.',
    'A new term: render. Render means React draws your component on the screen. React renders once at the start, then re-renders a component only when its data changes.',
  ],
  codeExample: {
    title: 'Your first component',
    language: 'jsx',
    code: 'function Hello() {\n  return <h1>Hello, learner!</h1>;\n}\n\nfunction App() {\n  return (\n    <div>\n      <Hello />\n      <Hello />\n    </div>\n  );\n}',
    note: 'The same Hello component is reused twice, like two LEGO bricks.',
  },
  realExample:
    'Shops like online stores show the same product card hundreds of times with different names and prices. Each card is one reusable component. News sites reuse one article card for every story.',
  logicTraining: {
    thinkFirst: [
      'What small parts do I see on this page?',
      'Which parts repeat with different data?',
      'What data does each part need to do its job?',
      'What changes over time, and which part must update?',
      'Can I name each part with one clear word?',
    ],
    predictTheOutput: [
      {
        code: 'function Hello() {\n  return <h1>Hi!</h1>;\n}\nfunction App() {\n  return <Hello />;\n}',
        question: 'What shows on the screen?',
        answer: 'One heading that says Hi!',
        explanation: 'App renders Hello once, so one heading appears.',
      },
      {
        code: 'function Hello() {\n  return <h1>Hi!</h1>;\n}\nfunction App() {\n  return (\n    <div>\n      <Hello />\n      <Hello />\n    </div>\n  );\n}',
        question: 'How many headings show now?',
        answer: 'Two headings, both saying Hi!',
        explanation: 'Each use of Hello renders one more copy.',
      },
    ],
    findTheBug: {
      code: 'function hello() {\n  return <h1>Hi!</h1>;\n}\nfunction App() {\n  return <hello />;\n}',
      hint: 'React tells components and normal HTML tags apart by one small letter rule.',
      fixedCode: 'function Hello() {\n  return <h1>Hi!</h1>;\n}\nfunction App() {\n  return <Hello />;\n}',
      explanation: 'Component names must start with a capital letter, or React treats them as plain HTML tags.',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Draw the boxes',
        brief: 'Pick any simple website page and draw boxes around each part that could be a component.',
        acceptanceCriteria: ['At least 5 boxes are drawn and named', 'Repeated parts share one name'],
        hints: ['Start with the header, the main part, and the footer.', 'Two cards that look the same are one component.', 'Name each box with one word like Button or Card.'],
        solutionOutline: ['Open any simple page', 'Draw a box around each visual part', 'Give repeated parts the same name'],
      },
      {
        level: 'medium',
        title: 'Component tree on paper',
        brief: 'Turn your boxes into a family tree on paper: App at the top, smaller parts below it.',
        acceptanceCriteria: ['App is at the top', 'Every box from the drawing appears once in the tree', 'Repeated parts appear under their parent'],
        hints: ['Ask: which box holds which other box?', 'A list holds many cards.', 'The tree has no code, only names and lines.'],
        solutionOutline: ['Write App at the top', 'Add one line for each big part', 'Hang small repeated parts under their parent'],
      },
      {
        level: 'hard',
        title: 'What changes?',
        brief: 'For your tree, write what data each part shows and what could change while you watch the page.',
        acceptanceCriteria: ['Each part lists the data it shows', 'At least two things-that-change are named', 'Each change points to the part that must update'],
        hints: ['Data is the words and numbers on the screen.', 'A cart count can go up. A name can change.', 'Only the part that shows the data needs to update.'],
        solutionOutline: ['List the data under each part name', 'Circle the data that can change', 'Draw an arrow from each change to its part'],
      },
    ],
  },
  practiceLinks: [
    { label: 'React docs: Thinking in React', url: 'https://react.dev/learn/thinking-in-react' },
    { label: 'React docs: Your first component', url: 'https://react.dev/learn/your-first-component' },
  ],
  quiz: [
    {
      question: 'What is a component in React?',
      options: ['A small reusable piece of the screen with its own job', 'A new programming language for the web', 'A database where React saves files', 'A tool that makes the internet faster'],
      correctIndex: 0,
      explanation: 'A component is one small building block of the page, like a LEGO brick.',
    },
    {
      question: 'What does "render" mean?',
      options: ['React draws the component on the screen', 'React deletes the component forever', 'React sends an email to the user', 'React turns off the computer'],
      correctIndex: 0,
      explanation: 'To render is to draw; re-render is to draw again after data changes.',
    },
    {
      question: 'Why must a component name start with a capital letter?',
      options: ['So React knows it is a component, not a plain HTML tag', 'So the code runs ten times faster', 'So only computers can read it', 'So the color of the text changes'],
      correctIndex: 0,
      explanation: 'Lowercase names are treated as plain HTML tags like div or p.',
    },
    {
      question: 'When data changes, what does React update?',
      options: ['Only the small part of the screen that must change', 'The whole internet at once', 'Nothing, the page stays frozen', 'Only the page title'],
      correctIndex: 0,
      explanation: 'React re-renders just the affected part, which keeps apps fast.',
    },
  ],
};

export default mod;
