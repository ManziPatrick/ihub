import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 11,
  slug: 'redux-toolkit',
  title: 'Redux Toolkit: Store, Slices, createAsyncThunk',
  goal: 'Manage big-app state with a Redux store, slices, and async thunks.',
  estimatedMinutes: 150,
  projectSlug: 'expense-tracker',
  videos: [
    {
      kind: 'short-clip',
      title: 'Redux in 100 Seconds',
      channel: 'Fireship',
      youtubeUrl: 'https://www.youtube.com/watch?v=_shA5Xwe8_4',
      durationSeconds: 100,
      fit: 'partial',
      note: 'Explains Redux ideas, not Redux Toolkit code.',
    },
    {
      kind: 'full',
      title: 'React with Redux Toolkit 🔥 | Complete Tutorial with Project | CodeWithAswin | Tamil',
      channel: 'CodeWithAswin',
      youtubeUrl: 'https://www.youtube.com/watch?v=bQVWrIlxPf0',
      durationSeconds: null,
      fit: 'strong',
      note: 'Tamil language. Use only if you want it, or find an English one.',
    },
    {
      kind: 'short',
      title: null,
      channel: null,
      youtubeUrl: null,
      searchQuery: 'Redux Toolkit createSlice createAsyncThunk English tutorial under 10 minutes',
      durationSeconds: null,
      fit: null,
      note: 'No English short video for Toolkit code yet.',
    },
  ],
  scriptFallback: [
    { onScreen: 'A city warehouse with one guarded front desk.', voiceover: 'Redux is one big warehouse for your data. The store holds everything in one place.' },
    { onScreen: 'A slice labeled expenses with add and remove buttons.', voiceover: 'A slice is one shelf: its own data plus the functions allowed to change it.' },
    { onScreen: 'A delivery truck (thunk) bringing server data to the shelf.', voiceover: 'A thunk fetches from the server and reports loading, success, or error.' },
    { onScreen: 'A component reading the shelf with a selector.', voiceover: 'Components read with selectors and order changes with dispatch. No prop drilling.' },
  ],
  learn: [
    'Think of a city warehouse. Every shop keeps stock in ONE guarded building instead of its own back room. The Redux store is that warehouse: one object holding the whole app state. Components read from it and send change requests — never touching the shelves directly.',
    'A slice is one shelf plus its rules. createSlice takes a name, starting state, and reducers (small update functions). It auto-creates action creators like addExpense(expense). A new term: dispatch. Dispatch means sending an action to the store, like handing an order ticket to the desk.',
    'Server data arrives through createAsyncThunk. A thunk is a delivery truck: it drives to the API and reports three news flashes — pending (loading), fulfilled (data arrived), rejected (failed). Your slice listens to each flash and updates state.',
    'Components connect with two hooks. useSelector reads one shelf item, like state.expenses.items. useDispatch sends tickets. Rule: only read what you need — reading the whole warehouse re-renders you on every tiny change.',
  ],
  codeExample: {
    title: 'Expenses slice with an async fetch thunk',
    language: 'jsx',
    code: 'import { createSlice, createAsyncThunk, configureStore } from "@reduxjs/toolkit";\n\nexport const fetchExpenses = createAsyncThunk("expenses/fetch", async () => {\n  const res = await fetch("/api/expenses");\n  return res.json();\n});\n\nconst slice = createSlice({\n  name: "expenses",\n  initialState: { items: [], loading: false },\n  reducers: {\n    addExpense: (state, action) => { state.items.push(action.payload); },\n  },\n  extraReducers: (b) => {\n    b.addCase(fetchExpenses.pending, (s) => { s.loading = true; });\n    b.addCase(fetchExpenses.fulfilled, (s, a) => { s.items = a.payload; s.loading = false; });\n  },\n});\n\nexport const { addExpense } = slice.actions;\nexport const store = configureStore({ reducer: { expenses: slice.reducer } });',
    note: 'Slice owns the shelf; the thunk drives to the server and back.',
  },
  realExample:
    'Big dashboards, shops with carts, and multi-page apps use Redux Toolkit when context starts to tangle. The expense tracker, bank dashboards, and admin panels keep money, users, and settings in one predictable store.',
  logicTraining: {
    thinkFirst: [
      'Is my state truly global (many pages) or local (one component)?',
      'What slices do I need — one per topic (expenses, user)?',
      'What actions change each slice, and what data does each carry?',
      'Which data comes from the server (thunk) vs typed by the user (reducer)?',
      'What does each screen select — the smallest piece possible?',
    ],
    predictTheOutput: [
      {
        code: 'reducers: { add: (state, action) => { state.items.push(action.payload); } }\n// dispatch(add("rice")) on items: ["beans"]',
        question: 'What is items after dispatch?',
        answer: '["beans", "rice"].',
        explanation: 'The reducer appends the action payload to the shelf.',
      },
      {
        code: '// thunk lifecycle for fetchExpenses, request fails',
        question: 'Which extraReducer cases run, in order?',
        answer: 'pending first, then rejected.',
        explanation: 'Pending fires at launch; failure lands on the rejected flash.',
      },
    ],
    findTheBug: {
      code: 'const total = useSelector((state) => state);',
      hint: 'The total re-renders on EVERY store change, even unrelated ones.',
      fixedCode: 'const items = useSelector((state) => state.expenses.items);\nconst total = items.reduce((sum, i) => sum + i.amount, 0);',
      explanation: 'Select the smallest slice piece you need, then compute from it.',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Counter slice',
        brief: 'Build a counter slice with plus and minus, and show it in a component.',
        acceptanceCriteria: ['Plus and minus update through dispatch', 'Component reads with useSelector'],
        hints: ['createSlice with name, initialState, reducers.', 'Export the actions it creates.', 'Give the store to the app with Provider.'],
        solutionOutline: ['Create the counter slice', 'Wire the store with Provider', 'Dispatch from buttons'],
      },
      {
        level: 'medium',
        title: 'Expense tracker project',
        brief: 'Track expenses (add + list + total) in a slice, with categories and delete.',
        acceptanceCriteria: ['Add, list, delete all work', 'Total is always correct', 'State lives only in the store'],
        hints: ['Item: { id, title, amount, category }.', 'Total is computed with reduce.', 'Delete filters by id.'],
        solutionOutline: ['Design the expense slice', 'Build add form and list from the store', 'Compute and show the total'],
      },
      {
        level: 'hard',
        title: 'Async expenses',
        brief: 'Load starter expenses with createAsyncThunk: spinner while pending, error message on failure.',
        acceptanceCriteria: ['Pending shows loading', 'Fulfilled fills the list', 'Rejected shows a retry'],
        hints: ['Handle pending, fulfilled, rejected in extraReducers.', 'Dispatch the thunk once in useEffect.', 'Retry dispatches the same thunk again.'],
        solutionOutline: ['Write the fetch thunk', 'Handle all three flashes', 'Render loading, error, and list'],
      },
    ],
  },
  practiceLinks: [
    { label: 'Redux Toolkit docs: quick start', url: 'https://redux-toolkit.js.org/tutorials/quick-start' },
    { label: 'Redux Toolkit docs: createAsyncThunk', url: 'https://redux-toolkit.js.org/api/createAsyncThunk' },
  ],
  quiz: [
    {
      question: 'What is the Redux store?',
      options: ['One guarded place holding the whole app state', 'A shop that sells computers', 'A folder for pictures', 'A backup battery'],
      correctIndex: 0,
      explanation: 'The store is the single warehouse every component reads from.',
    },
    {
      question: 'What does a slice contain?',
      options: ['One topic of state plus the reducers allowed to change it', 'A piece of pizza for the team', 'Only CSS styles', 'The Wi-Fi password'],
      correctIndex: 0,
      explanation: 'A slice bundles data with its own update rules.',
    },
    {
      question: 'What is createAsyncThunk for?',
      options: ['Fetching server data while reporting pending, fulfilled, or rejected', 'Making buttons bigger', 'Deleting the store', 'Playing videos'],
      correctIndex: 0,
      explanation: 'Thunks are delivery trucks with three status flashes.',
    },
    {
      question: 'How does a component read store data?',
      options: ['useSelector picking the smallest piece it needs', 'Reading the hard drive directly', 'Guessing the value', 'Asking the user to type it again'],
      correctIndex: 0,
      explanation: 'Selectors subscribe the component to exactly the shelf it reads.',
    },
  ],
};

export default mod;
