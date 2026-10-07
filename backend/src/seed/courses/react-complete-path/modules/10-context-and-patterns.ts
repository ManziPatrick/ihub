import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 10,
  slug: 'context-and-patterns',
  title: 'Lifting State, Context API, Reducer + Context',
  goal: 'Share state across many screens with lifted state, Context, and reducer + context.',
  estimatedMinutes: 125,
  projectSlug: 'pizza-menu-cart',
  videos: [
    {
      kind: 'short',
      title: 'React Prop Drilling Explained (And How Context API Solves It) #shorts',
      channel: 'Code with Ahsan',
      youtubeUrl: 'https://www.youtube.com/shorts/3-Z0SHJG0d8',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'full',
      title: 'Learn React Hooks: useContext - Simply Explained!',
      channel: 'Cosden Solutions',
      youtubeUrl: 'https://www.youtube.com/watch?v=HYKDUF8X3qI',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
  ],
  scriptFallback: [
    { onScreen: 'Two sibling boxes both needing the same toy held by their parent.', voiceover: 'When two children need the same data, lift it up to their shared parent.' },
    { onScreen: 'A family tree with a radio station broadcasting to all rooms.', voiceover: 'Context is a broadcast. The provider sends it; any room can tune in.' },
    { onScreen: 'A reducer kitchen connected to the broadcast wires.', voiceover: 'Reducer plus context is a shared kitchen for the whole house: one state, many eaters.' },
    { onScreen: 'A small cart count updating in the header from a deep page.', voiceover: 'The header shows the cart without receiving a single prop. That is the power.' },
  ],
  learn: [
    'Think of two siblings sharing one toy. The toy must live with the parent, where both children can reach it. In React this is called lifting state up: when two components need the same data, move it to their closest shared parent and pass it down to both.',
    'Lifting works for small families. For a big house, Context is better. Think of a radio station: the Provider component broadcasts a value, and any component inside can listen with useContext — no matter how deep. No more carrying props through rooms you never enter.',
    'A new term: provider. The provider is the component that holds and shares the value, like <CartProvider>. Everything wrapped inside it can read the cart. Everything outside cannot. Always wrap exactly the part of the app that needs the data — not more.',
    'Reducer + context is the professional combo. The reducer (one cook, order tickets) manages the state. Context (the broadcast) delivers it. Together they run a whole cart, theme, or login session without prop drilling and without extra libraries.',
  ],
  codeExample: {
    title: 'Theme broadcast with context',
    language: 'jsx',
    code: 'import { createContext, useContext, useState } from "react";\n\nconst ThemeContext = createContext("light");\n\nfunction Button() {\n  const theme = useContext(ThemeContext);\n  return <button className={theme}>Buy</button>;\n}\n\nfunction App() {\n  const [theme, setTheme] = useState("light");\n  return (\n    <ThemeContext.Provider value={theme}>\n      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>\n        Switch\n      </button>\n      <Button />\n    </ThemeContext.Provider>\n  );\n}',
    note: 'Button reads the theme with zero props passed to it.',
  },
  realExample:
    'Login sessions, themes, languages, and shopping carts live in context. The header shows your name, deep pages check your login, and the cart count updates everywhere — all from one broadcast, zero prop drilling.',
  logicTraining: {
    thinkFirst: [
      'Which components need this data — siblings, or the whole app?',
      'Can I lift state to the shared parent, or is context cleaner?',
      'What is the smallest value to broadcast (data + updater, nothing more)?',
      'Which part of the tree must the provider wrap?',
      'Is the state tangled enough to need a reducer inside?',
    ],
    predictTheOutput: [
      {
        code: 'const C = createContext("a");\nfunction Show() {\n  return <p>{useContext(C)}</p>;\n}\nfunction App() {\n  return <C.Provider value="b"><Show /></C.Provider>;\n}',
        question: 'What shows on the screen?',
        answer: '"b".',
        explanation: 'The nearest provider value wins over the default.',
      },
      {
        code: 'const C = createContext("a");\nfunction Show() {\n  return <p>{useContext(C)}</p>;\n}\nfunction App() {\n  return <Show />;\n}',
        question: 'No provider this time. What shows?',
        answer: '"a".',
        explanation: 'Without a provider, context falls back to its default value.',
      },
    ],
    findTheBug: {
      code: 'const CartContext = createContext();\nfunction Header() {\n  const { count } = useContext(CartContext);\n  return <p>{count}</p>;\n}\nfunction App() {\n  return <Header />;\n}',
      hint: 'The header crashes: it tries to read count from something missing.',
      fixedCode: 'const CartContext = createContext();\nfunction Header() {\n  const { count } = useContext(CartContext);\n  return <p>{count}</p>;\n}\nfunction App() {\n  return (\n    <CartContext.Provider value={{ count: 3 }}>\n      <Header />\n    </CartContext.Provider>\n  );\n}',
      explanation: 'useContext without a provider reads the default (undefined) — wrap readers in a provider with a value.',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Lift the toy',
        brief: 'Two counters must always show the same number. Lift the state to their parent.',
        acceptanceCriteria: ['Both counters show the same number', 'Either button updates both at once'],
        hints: ['Move useState to the parent.', 'Pass count and setter to both children.', 'Children hold no state of their own.'],
        solutionOutline: ['Create parent with the state', 'Render two children with props', 'Verify both update together'],
      },
      {
        level: 'medium',
        title: 'Pizza menu with cart project',
        brief: 'Build a menu page and a header cart count sharing one cart context (add items, see count).',
        acceptanceCriteria: ['Menu adds pizzas to a shared cart', 'Header shows the live count with no props', 'Cart survives moving between sections'],
        hints: ['CartProvider holds items state.', 'Expose items plus an add function.', 'Wrap menu and header inside the provider.'],
        solutionOutline: ['Create cart context and provider', 'Build menu adding through context', 'Show live count in the header'],
      },
      {
        level: 'hard',
        title: 'Reducer-powered cart',
        brief: 'Upgrade the cart to reducer + context with add, remove, and clear actions plus a total.',
        acceptanceCriteria: ['Three actions work from any component', 'Total is always correct', 'No cart props pass through any component'],
        hints: ['State: { items: [] }. Actions carry the pizza.', 'Total is computed from items.', 'Expose { state, dispatch } in context.'],
        solutionOutline: ['Write cart reducer with three actions', 'Provide state and dispatch via context', 'Build menu, list, and total from context'],
      },
    ],
  },
  practiceLinks: [
    { label: 'React docs: passing data deeply with context', url: 'https://react.dev/learn/passing-data-deeply-with-context' },
    { label: 'React docs: scaling up with reducer and context', url: 'https://react.dev/learn/scaling-up-with-reducer-and-context' },
  ],
  quiz: [
    {
      question: 'When do you lift state up?',
      options: ['When two components need the same data — move it to their shared parent', 'When the app needs more colors', 'When the internet is slow', 'Every time you save a file'],
      correctIndex: 0,
      explanation: 'Shared data lives with the closest parent both children can reach.',
    },
    {
      question: 'What does a Context Provider do?',
      options: ['Broadcasts a value to every component wrapped inside it', 'Deletes all the state in the app', 'Makes the page load twice', 'Sends emails to users'],
      correctIndex: 0,
      explanation: 'It is a radio station; wrapped components can tune in with useContext.',
    },
    {
      question: 'A component uses useContext but shows undefined. Likely cause?',
      options: ['No provider wraps it, so it reads the empty default', 'The screen is too dark', 'React is not installed', 'The variable name is too short'],
      correctIndex: 0,
      explanation: 'Without a provider above it, context falls back to its default.',
    },
    {
      question: 'Why combine reducer with context?',
      options: ['One cook manages tangled state; the broadcast delivers it everywhere', 'It makes the code shorter by deleting tests', 'It removes the need for components', 'It doubles the internet speed'],
      correctIndex: 0,
      explanation: 'Reducer organizes updates; context shares them without drilling.',
    },
  ],
};

export default mod;
