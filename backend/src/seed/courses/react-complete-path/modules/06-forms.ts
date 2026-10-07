import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 6,
  slug: 'forms',
  title: 'Forms and Controlled Inputs',
  goal: 'Build forms where React state controls every input and handles submit.',
  estimatedMinutes: 110,
  projectSlug: null,
  videos: [
    {
      kind: 'full',
      title: 'Full React Tutorial #27 - Controlled Inputs (forms)',
      channel: 'Net Ninja',
      youtubeUrl: 'https://www.youtube.com/watch?v=IkMND33x0qQ',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'full',
      title: 'ReactJS Tutorial - 21 - Basics of Form Handling',
      channel: 'Codevolution',
      youtubeUrl: 'https://www.youtube.com/watch?v=7Vo_VCcWupQ',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'short',
      title: null,
      channel: null,
      youtubeUrl: null,
      searchQuery: 'React controlled input form beginner short',
      durationSeconds: null,
      fit: null,
      note: 'Topic has full videos but no Short yet.',
    },
  ],
  scriptFallback: [
    { onScreen: 'A paper form next to a React input tied to state with a string.', voiceover: 'A controlled input is tied to state. What you type goes into memory first.' },
    { onScreen: 'Typing in the box; the state value updates letter by letter.', voiceover: 'Every keystroke updates state, and state feeds the box back. Nothing gets lost.' },
    { onScreen: 'Pressing Submit; the page does not reload, a message appears.', voiceover: 'On submit, stop the page reload, read the state, and show a message.' },
    { onScreen: 'Empty submit blocked with a red hint under the box.', voiceover: 'Check the state before you accept it. Empty name? Ask again nicely.' },
  ],
  learn: [
    'Think of a hotel check-in desk. The clerk writes your name on a card before giving you a key. A controlled input works the same way. Every letter you type goes into React state first. The box on the screen only shows what state holds. A new term: controlled input. It is an input whose value comes from state.',
    'You connect the two sides with two props. Value={name} shows the state. onChange updates it: onChange={(e) => setName(e.target.value)}. The e is the event — it carries what the user just typed. Forget either side and the box breaks: no value means React is blind, no onChange means the box is frozen.',
    'Submit is handled with onSubmit on the form. Browsers reload the page on submit by default, which wipes your state. So you call e.preventDefault() first — it means "browser, do nothing, I handle this". Then you read state and show a message.',
    'Validation means checking the data before you accept it. Is the name empty? Is the email missing an @? Check state, keep an error message in state too, and show it under the box. Small checks now save angry users later.',
  ],
  codeExample: {
    title: 'Name form with submit and validation',
    language: 'jsx',
    code: 'import { useState } from "react";\n\nfunction NameForm() {\n  const [name, setName] = useState("");\n  const [error, setError] = useState("");\n\n  function handleSubmit(e) {\n    e.preventDefault();\n    if (name.trim() === "") {\n      setError("Please type your name.");\n      return;\n    }\n    setError("");\n    alert(`Welcome, ${name}!`);\n  }\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <input\n        value={name}\n        onChange={(e) => setName(e.target.value)}\n        placeholder="Your name"\n      />\n      {error && <p>{error}</p>}\n      <button type="submit">Join</button>\n    </form>\n  );\n}',
    note: 'Value shows state, onChange feeds it, submit checks it.',
  },
  realExample:
    'Login pages, signup pages, and checkout forms are all controlled inputs. The app checks your email and password from state before sending anything. Search boxes filter results live because every keystroke already sits in state.',
  logicTraining: {
    thinkFirst: [
      'What field does this form collect, and what state holds each one?',
      'What is the starting value of each field?',
      'What counts as valid — and what error shows for each bad case?',
      'What must happen on submit, and what must NOT happen (reload)?',
      'What does the screen show while the user is still typing?',
    ],
    predictTheOutput: [
      {
        code: 'function F() {\n  const [name, setName] = useState("Jo");\n  return <input value={name} onChange={(e) => setName(e.target.value)} />;\n}',
        question: 'The box shows "Jo". You type "n". What does the box show?',
        answer: '"Jon".',
        explanation: 'Each keystroke updates state, and value shows the new state.',
      },
      {
        code: 'function F() {\n  const [name] = useState("Jo");\n  return <input value={name} />;\n}',
        question: 'You try to type in this box. What happens?',
        answer: 'Nothing — the box stays "Jo" and feels frozen.',
        explanation: 'Without onChange, state never updates so the box cannot change.',
      },
    ],
    findTheBug: {
      code: 'function F() {\n  const [email, setEmail] = useState("");\n  function submit() {\n    alert(`Sent to ${email}`);\n  }\n  return <form onSubmit={submit}><input value={email} onChange={(e) => setEmail(e.target.value)} /></form>;\n}',
      hint: 'Clicking submit flashes the message, then the whole page restarts.',
      fixedCode: 'function F() {\n  const [email, setEmail] = useState("");\n  function submit(e) {\n    e.preventDefault();\n    alert(`Sent to ${email}`);\n  }\n  return <form onSubmit={submit}><input value={email} onChange={(e) => setEmail(e.target.value)} /></form>;\n}',
      explanation: 'Forms reload the page on submit unless you call e.preventDefault().',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Live mirror',
        brief: 'Build an input whose text appears below it live as you type.',
        acceptanceCriteria: ['Typing updates the text below at once', 'Starting value is empty'],
        hints: ['One state holds the text.', 'Show it in a p under the input.', 'Both sides bind to the same state.'],
        solutionOutline: ['Create text state', 'Bind value and onChange', 'Render the state below'],
      },
      {
        level: 'medium',
        title: 'Signup with checks',
        brief: 'Build name + email signup: block empty names and emails without @, show one error at a time.',
        acceptanceCriteria: ['Empty name shows a name error', 'Bad email shows an email error', 'Good data shows a welcome message'],
        hints: ['Check name first, then email.', 'One error state is enough.', 'Clear the error on success.'],
        solutionOutline: ['Add name, email, error state', 'Validate in order inside submit', 'Show error or welcome'],
      },
      {
        level: 'hard',
        title: 'Password with rules',
        brief: 'Add a password field with three live rules: 8+ characters, one number, passwords match.',
        acceptanceCriteria: ['Each rule shows pass/fail live', 'Submit blocked until all rules pass', 'No rule logic is stored in state, only password text'],
        hints: ['Rules are computed from state, not stored.', 'password.length and checks like /[0-9]/.test(password) help.', 'Disable the button until everything passes.'],
        solutionOutline: ['Store password and confirm only', 'Compute each rule during render', 'Gate submit on all rules'],
      },
    ],
  },
  practiceLinks: [
    { label: 'React docs: forms (controlled components)', url: 'https://react.dev/reference/react-dom/components/input' },
    { label: 'MDN: form validation concepts', url: 'https://developer.mozilla.org/en-US/docs/Learn/Forms' },
  ],
  quiz: [
    {
      question: 'What is a controlled input?',
      options: ['An input whose value comes from React state', 'An input only teachers can type in', 'An input that works without any code', 'An input that deletes itself'],
      correctIndex: 0,
      explanation: 'State owns the value; the box only displays it.',
    },
    {
      question: 'An input has value but no onChange. What happens?',
      options: ['The box freezes — you cannot type in it', 'It types twice as fast', 'It deletes the whole form', 'It sends an email per letter'],
      correctIndex: 0,
      explanation: 'State never updates, so the displayed value never changes.',
    },
    {
      question: 'Why call e.preventDefault() in onSubmit?',
      options: ['To stop the browser reloading the page and wiping state', 'To make the text bold', 'To close the browser window', 'To print the form on paper'],
      correctIndex: 0,
      explanation: 'Native submit reloads the page; React wants to handle data itself.',
    },
    {
      question: 'Where does the typed text live in a controlled input?',
      options: ['In the event object: e.target.value', 'In the screen pixels', 'In the Wi-Fi router', 'Nowhere, it disappears'],
      correctIndex: 0,
      explanation: 'The change event carries the fresh text to your setter.',
    },
  ],
};

export default mod;
