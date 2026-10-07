import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 3,
  slug: 'jsx-components-props',
  title: 'JSX, Components and Props',
  goal: 'Build small components with JSX and pass them data using props.',
  estimatedMinutes: 120,
  projectSlug: 'profile-card',
  videos: [
    {
      kind: 'short',
      title: 'How JSX Really Works in React | Core React Concepts Explained #shorts',
      channel: 'Code with Ahsan',
      youtubeUrl: 'https://www.youtube.com/shorts/Shree4nVeCQ',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'full',
      title: 'React JS Tutorial for Beginners | JSX',
      channel: 'Web Tech Talk',
      youtubeUrl: 'https://www.youtube.com/watch?v=hUi5Mp-CR2o',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'short',
      title: 'props in react.js full explanation with examples #shorts #reactjs @CodeWithHarry',
      channel: 'codebypc',
      youtubeUrl: 'https://www.youtube.com/shorts/4mnRWymMP2g',
      durationSeconds: null,
      fit: 'strong',
      note: 'May be in Hindi. Check the language.',
    },
    {
      kind: 'short',
      title: 'What is Props in React? #coding #programming #webdevelopment',
      channel: 'easy, honestly',
      youtubeUrl: 'https://www.youtube.com/shorts/kVuOAqyZqFA',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'full',
      title: 'React.js for beginners - Learn React and Redux [2024]',
      channel: 'Viducation 101',
      youtubeUrl: 'https://www.youtube.com/watch?v=J69bfV38Fh8',
      durationSeconds: null,
      fit: 'partial',
      note: 'Very long course (about 2.3 hours). Chapter list comes from Perplexity and is not verified. Link to a start time.',
    },
  ],
  scriptFallback: [
    { onScreen: 'HTML next to JSX; the JSX line uses a variable inside curly braces.', voiceover: 'JSX looks like HTML, but it lives inside JavaScript, so it can use variables.' },
    { onScreen: 'A Card function receiving a name prop and showing it.', voiceover: 'A component is a function. Props are the inputs you hand to it.' },
    { onScreen: 'Same Card used twice with two different names.', voiceover: 'Same component, different props, different result on screen.' },
    { onScreen: 'Curly braces highlighted around a name and a number.', voiceover: 'Curly braces are the door between your code and your screen.' },
  ],
  learn: [
    'Think of a component as a kitchen machine. You put ingredients in, and food comes out. In React, the ingredients are called props. Props is short for properties. They are the data a parent hands to a child component.',
    'JSX is the language you write components in. It looks like HTML, but it runs inside JavaScript. That is why you can mix code and screen: <h1>Hello, {name}</h1> shows the value of the name variable. A new term: curly braces { }. They are the door between JavaScript and the screen.',
    'Two JSX rules to memorize. One: return a single parent — wrap everything in one div or an empty pair of tags <>. Two: use className instead of class, because class is already a JavaScript word.',
    'Props flow in one direction: down, from parent to child. The child must never change its own props, like a cook who must not rewrite the order ticket. The parent owns the data; the child only shows it.',
  ],
  codeExample: {
    title: 'One Card component, used twice with different props',
    language: 'jsx',
    code: 'function Card({ name, job }) {\n  return (\n    <div>\n      <h2>{name}</h2>\n      <p>{job}</p>\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <div>\n      <Card name="Aline" job="Designer" />\n      <Card name="Eric" job="Driver" />\n    </div>\n  );\n}',
    note: 'Card does not own the names. App passes them down as props.',
  },
  realExample:
    'Every social app shows profile cards, message bubbles, and buttons that all look the same but carry different names and texts. Each one is a single component fed by props. Change the props, and the whole list updates.',
  logicTraining: {
    thinkFirst: [
      'What data does this component need from its parent?',
      'What should the screen show if a prop is missing?',
      'Which parts repeat, so they deserve their own component?',
      'Does data flow down only, or am I tempted to push it up?',
      'Can I give each prop a clear, short name?',
    ],
    predictTheOutput: [
      {
        code: 'function Card({ name }) {\n  return <h2>{name}</h2>;\n}\nfunction App() {\n  return <Card name="Aline" />;\n}',
        question: 'What shows on the screen?',
        answer: 'One heading saying Aline.',
        explanation: 'The name prop arrives as "Aline" and the braces print it.',
      },
      {
        code: 'function Card({ name }) {\n  return <h2>Hello, {name}!</h2>;\n}\nfunction App() {\n  return (\n    <div>\n      <Card name="Aline" />\n      <Card name="Eric" />\n    </div>\n  );\n}',
        question: 'What shows on the screen?',
        answer: 'Two headings: Hello, Aline! and Hello, Eric!',
        explanation: 'Each Card gets its own props and renders its own text.',
      },
    ],
    findTheBug: {
      code: 'function App() {\n  return (\n    <h1>Hi</h1>\n    <p>Welcome</p>\n  );\n}',
      hint: 'A component may return many things, but they need one shared wrapper.',
      fixedCode: 'function App() {\n  return (\n    <>\n      <h1>Hi</h1>\n      <p>Welcome</p>\n    </>\n  );\n}',
      explanation: 'JSX must return a single parent element, like an empty <> pair.',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Greeting card',
        brief: 'Make a Greeting component that takes a name prop and shows Hello plus that name.',
        acceptanceCriteria: ['Greeting shows the passed name', 'Using it twice shows two different names'],
        hints: ['Write function Greeting({ name }).', 'Print the name inside curly braces.', 'Call it twice from App with different names.'],
        solutionOutline: ['Create the Greeting function with a name prop', 'Return a heading with the name in braces', 'Render it twice in App'],
      },
      {
        level: 'medium',
        title: 'Profile card project',
        brief: 'Build a ProfileCard with name, job, and photo props, and show three different people.',
        acceptanceCriteria: ['Three cards show three different people', 'No data is written twice inside ProfileCard', 'Missing photo still looks fine'],
        hints: ['Destructure all three props in the function.', 'Render the same component three times in App.', 'Add a fallback letter when the photo prop is missing.'],
        solutionOutline: ['Design ProfileCard with three props', 'Render three copies with different data', 'Handle the missing-photo case'],
      },
      {
        level: 'hard',
        title: 'Props detective',
        brief: 'Take a page with repeated cards and split it into components so no text is repeated in code.',
        acceptanceCriteria: ['Each repeated part is its own component', 'All texts arrive through props', 'App holds all the data in one place'],
        hints: ['Circle every repeated block first.', 'Move one repeated block into its own function.', 'Pass each changing word as a prop.'],
        solutionOutline: ['Find the repeated blocks', 'Extract one Card component', 'Replace repeats with the component plus props'],
      },
    ],
  },
  practiceLinks: [
    { label: 'React docs: passing props', url: 'https://react.dev/learn/passing-props-to-a-component' },
    { label: 'React docs: writing markup with JSX', url: 'https://react.dev/learn/writing-markup-with-jsx' },
  ],
  quiz: [
    {
      question: 'What are props?',
      options: ['Data a parent passes down to a child component', 'Secret passwords for the database', 'Pictures saved inside the browser', 'Errors that stop the app'],
      correctIndex: 0,
      explanation: 'Props are inputs handed from parent to child, like ingredients to a machine.',
    },
    {
      question: 'What do curly braces { } do in JSX?',
      options: ['They let you show a JavaScript value on the screen', 'They delete the line they are on', 'They make text red and bold', 'They save the file for you'],
      correctIndex: 0,
      explanation: 'Braces are the door between your JavaScript code and the screen.',
    },
    {
      question: 'A component returns <h1> and <p> side by side with no wrapper. What happens?',
      options: ['React shows an error — JSX needs one single parent', 'It works fine and runs faster', 'Only the h1 shows on the screen', 'The page prints twice'],
      correctIndex: 0,
      explanation: 'Every component must return exactly one parent element.',
    },
    {
      question: 'In JSX, how do you set a CSS class on an element?',
      options: ['className="card"', 'class="card"', 'css="card"', 'style-class="card"'],
      correctIndex: 0,
      explanation: 'class is a JavaScript word, so JSX uses className instead.',
    },
  ],
};

export default mod;
