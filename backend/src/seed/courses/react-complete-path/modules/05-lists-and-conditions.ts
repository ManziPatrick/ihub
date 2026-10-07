import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 5,
  slug: 'lists-and-conditions',
  title: 'Lists, Keys and Conditional Rendering',
  goal: 'Render lists from arrays with keys and show different content with conditions.',
  estimatedMinutes: 100,
  projectSlug: 'packing-list',
  videos: [
    {
      kind: 'short',
      title: null,
      channel: null,
      youtubeUrl: null,
      searchQuery: 'React map list keys conditional rendering beginner short',
      durationSeconds: null,
      fit: null,
      note: 'No verified video for this topic yet.',
    },
  ],
  scriptFallback: [
    { onScreen: 'A shopping list on paper next to an array of three words in code.', voiceover: 'An array is a shopping list for your code. Map turns each item into a component.' },
    { onScreen: 'Three list rows; each row gets a small key tag with a number.', voiceover: 'Each row needs a stable key, like a name tag, so React can find it again.' },
    { onScreen: 'A packed checkbox: ticked items turn grey with a check mark.', voiceover: 'A condition shows one thing or another. Packed item? Show a check. Not packed? Show plain text.' },
    { onScreen: 'Item added and removed; only that row moves.', voiceover: 'With good keys, React moves only the changed row instead of redrawing everything.' },
  ],
  learn: [
    'Think of a teacher calling names from a class list. The list of names is an array. Calling each name one by one is what map does: it takes every item and returns a component for it. One array in, many rows out.',
    'Each row needs a key. A key is a stable name tag that never changes for that item, usually its id. React uses keys to know which row is which when items move, get added, or get deleted. A new term: key. It is a special prop that helps React track list items.',
    'Never use the position (index 0, 1, 2) as the key when the list can change. Positions shift when you delete item one, and React mixes up the rows. Use a real id from your data instead.',
    'Conditional rendering means showing different things in different cases. The && operator shows something only when a condition is true. The ? : operator (called ternary) picks between two things. Packed ? "✅" : " ". One condition, two possible screens.',
  ],
  codeExample: {
    title: 'A packing list with keys and conditions',
    language: 'jsx',
    code: 'const items = [\n  { id: 1, name: "Socks", packed: true },\n  { id: 2, name: "Hat", packed: false },\n  { id: 3, name: "Soap", packed: false },\n];\n\nfunction PackingList() {\n  return (\n    <ul>\n      {items.map((item) => (\n        <li key={item.id}>\n          {item.packed ? "✅ " : ""}{item.name}\n        </li>\n      ))}\n    </ul>\n  );\n}',
    note: 'Map builds the rows, key tracks them, and the ternary picks the mark.',
  },
  realExample:
    'Feeds, chats, and shopping carts are all lists from arrays. Each message or product has an id used as the key. Unread chats show a bold dot (a condition), read ones do not — same list, different rendering per item.',
  logicTraining: {
    thinkFirst: [
      'Where does my array data come from?',
      'Does every item have a stable, unique id for the key?',
      'What must each row show in each case (packed/unpacked, read/unread)?',
      'What happens to the list when I add, delete, or reorder an item?',
      'Can the list be empty — and what should the screen show then?',
    ],
    predictTheOutput: [
      {
        code: 'const items = [{ id: 1, name: "A" }, { id: 2, name: "B" }];\nfunction L() {\n  return <ul>{items.map((i) => <li key={i.id}>{i.name}</li>)}</ul>;\n}',
        question: 'What shows on the screen?',
        answer: 'A list with two rows: A and B.',
        explanation: 'Map creates one li per item, and the key keeps them tracked.',
      },
      {
        code: 'function Badge({ packed }) {\n  return <span>{packed ? "✅" : "❌"}</span>;\n}\nfunction App() {\n  return <Badge packed={false} />;\n}',
        question: 'What shows on the screen?',
        answer: 'A ❌ mark.',
        explanation: 'The ternary picks the second option when packed is false.',
      },
    ],
    findTheBug: {
      code: 'function L({ items }) {\n  return <ul>{items.map((item, index) => <li key={index}>{item.name}</li>)}</ul>;\n}',
      hint: 'Deleting the first row scrambles the others. The name tags move with positions.',
      fixedCode: 'function L({ items }) {\n  return <ul>{items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>;\n}',
      explanation: 'Use a stable item id as key, never the shifting index.',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Fruit list',
        brief: 'Render a list of four fruits from an array, each with its own key.',
        acceptanceCriteria: ['Four rows appear', 'Each row has a stable key, not the index'],
        hints: ['Give each fruit an id in the data.', 'Use map inside curly braces.', 'Put key on the li, using the id.'],
        solutionOutline: ['Write the fruits array with ids', 'Map it to li elements', 'Add key={fruit.id} to each row'],
      },
      {
        level: 'medium',
        title: 'Packing list project',
        brief: 'Build the packing list with packed checkboxes: ticked items show ✅ and grey text.',
        acceptanceCriteria: ['List renders from an array with keys', 'Packed items look different from unpacked ones', 'Empty list shows a friendly message'],
        hints: ['Store packed as true or false per item.', 'Use a ternary for the check mark.', 'Check items.length === 0 for the empty message.'],
        solutionOutline: ['Create items with id, name, packed', 'Render rows with map and conditions', 'Add the empty-list message'],
      },
      {
        level: 'hard',
        title: 'Delete without scrambling',
        brief: 'Add a delete button per row and prove the list stays correct after deleting the first item.',
        acceptanceCriteria: ['Deleting any row removes exactly that row', 'No other row changes its content', 'Keys use ids, not indexes'],
        hints: ['Keep items in state so deletes re-render.', 'Filter out the clicked id.', 'Watch what happens with index keys first, then fix.'],
        solutionOutline: ['Move items into useState', 'Add delete buttons that filter by id', 'Verify keys use the id after deleting row one'],
      },
    ],
  },
  practiceLinks: [
    { label: 'React docs: rendering lists', url: 'https://react.dev/learn/rendering-lists' },
    { label: 'React docs: conditional rendering', url: 'https://react.dev/learn/conditional-rendering' },
  ],
  quiz: [
    {
      question: 'What does map do with an array in React?',
      options: ['Turns each item into a component, so one array becomes many rows', 'Sorts your emails by date', 'Deletes the last item forever', 'Sends the array to a printer'],
      correctIndex: 0,
      explanation: 'Map transforms every item into rendered output, one per item.',
    },
    {
      question: 'What is a key for?',
      options: ['A stable tag so React can track each row when the list changes', 'A password that locks the list', 'A shortcut to close the browser', 'The price of each item'],
      correctIndex: 0,
      explanation: 'Keys let React match rows across renders when items move or delete.',
    },
    {
      question: 'Why avoid the array index as key in a changing list?',
      options: ['Positions shift on delete, so React mixes up the rows', 'Indexes are too long to type', 'Indexes only work for numbers', 'React cannot read the number 0'],
      correctIndex: 0,
      explanation: 'Index keys move with positions; stable ids stay with their item.',
    },
    {
      question: 'packed ? "✅" : "" shows what when packed is false?',
      options: ['An empty string (no mark)', 'A ✅ mark', 'An error that crashes the app', 'Two check marks'],
      correctIndex: 0,
      explanation: 'The ternary picks the second branch when the condition is false.',
    },
  ],
};

export default mod;
