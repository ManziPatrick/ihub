import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 4,
  slug: 'state-and-events',
  title: 'State and Events (useState)',
  goal: 'Make the screen react to clicks and typing using useState and events.',
  estimatedMinutes: 120,
  projectSlug: 'tip-calculator',
  videos: [
    {
      kind: 'short',
      title: 'useState | Simple React Hooks #shorts',
      channel: 'Cosden Solutions',
      youtubeUrl: 'https://www.youtube.com/shorts/F_OT4Y4eIjw',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'full',
      title: 'Learn useState in 10 Minutes | Beginners React Hooks Tutorial',
      channel: 'Code Complete',
      youtubeUrl: 'https://www.youtube.com/watch?v=2wKS55_rkqI',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'full',
      title: 'Beginner React Tutorial #6 - Manage State (useState hook)',
      channel: 'Code With Hichem',
      youtubeUrl: 'https://www.youtube.com/watch?v=WK95CVKXiFw',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
  ],
  scriptFallback: [
    { onScreen: 'A light switch next to a counter showing 0.', voiceover: 'Props never change. But a counter must change. That changing memory is called state.' },
    { onScreen: 'Code: const [count, setCount] = useState(0).', voiceover: 'useState gives you two things: the current value, and a setter to change it.' },
    { onScreen: 'Clicking a button; the number grows and the screen updates.', voiceover: 'Click the button, call the setter, and React redraws the screen for you.' },
    { onScreen: 'A normal variable change that does nothing on screen.', voiceover: 'A normal variable changes quietly. State changes loudly, on the screen.' },
  ],
  learn: [
    'Think of a light switch. It remembers if it is ON or OFF. Props cannot remember anything — they are fixed orders from the parent. State is the memory of one component. A new term: state. State is data a component owns and can change over time.',
    'The useState hook creates state. A hook is a special React function that gives your component a superpower — here, memory. You write const [count, setCount] = useState(0). Count is the value today. setCount is the only way to change it. Zero is the starting value.',
    'An event is something the user does: a click, a type, a press. You answer events with functions like onClick={addOne}. When the event fires, you call setCount(count + 1). Then React re-renders, and the new number appears.',
    'Never change state directly with count = count + 1. That is like moving the hands of a clock and expecting time to change. Always call the setter so React notices and updates the screen.',
  ],
  codeExample: {
    title: 'A counter that reacts to clicks',
    language: 'jsx',
    code: 'import { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  function addOne() {\n    setCount(count + 1);\n  }\n\n  return (\n    <div>\n      <p>Clicks: {count}</p>\n      <button onClick={addOne}>Add one</button>\n      <button onClick={() => setCount(0)}>Reset</button>\n    </div>\n  );\n}',
    note: 'Every click calls the setter, and React redraws the new count.',
  },
  realExample:
    'Like buttons, shopping-cart counts, and dark-mode switches are all tiny pieces of state. You click, a setter runs, and only that number or color updates. The rest of the page does not move.',
  logicTraining: {
    thinkFirst: [
      'What data changes when the user acts?',
      'What is the starting value before anything happens?',
      'Which event (click? type?) triggers the change?',
      'What must the screen show before AND after the event?',
      'What happens if the user repeats the action ten times?',
      'Can this value be computed from other state instead of stored?',
    ],
    predictTheOutput: [
      {
        code: 'function Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}',
        question: 'The button shows 0. You click it twice. What does it show?',
        answer: '2.',
        explanation: 'Each click adds one to the previous state value.',
      },
      {
        code: 'function Name() {\n  const [name, setName] = useState("Ana");\n  return <p>{name}</p>;\n}',
        question: 'Nobody clicks or types anything. What shows on the screen?',
        answer: 'Ana.',
        explanation: 'Without events, state keeps its starting value.',
      },
    ],
    findTheBug: {
      code: 'function Counter() {\n  let count = 0;\n  return <button onClick={() => { count = count + 1; }}>{count}</button>;\n}',
      hint: 'The variable changes, but the screen never hears about it.',
      fixedCode: 'import { useState } from "react";\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}',
      explanation: 'Only the state setter tells React to re-render the screen.',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Click counter',
        brief: 'Build the counter from the example with Add one and Reset buttons.',
        acceptanceCriteria: ['Clicks increase the number', 'Reset returns it to 0'],
        hints: ['Start state at 0 with useState.', 'Reset calls setCount(0).', 'Show count inside braces.'],
        solutionOutline: ['Create count state starting at 0', 'Add a button that adds one', 'Add a reset button'],
      },
      {
        level: 'medium',
        title: 'Tip calculator project',
        brief: 'Type a bill amount, pick a tip percent with buttons, and show the total.',
        acceptanceCriteria: ['Typing the bill updates the total at once', 'Tip buttons 10%, 15%, 20% all work', 'Empty input shows 0, never NaN'],
        hints: ['Store bill and tip in two pieces of state.', 'Total is computed, not stored: bill + bill * tip.', 'Convert the text input to a number before math.'],
        solutionOutline: ['Add bill and tip state', 'Compute total during render', 'Handle empty input as zero'],
      },
      {
        level: 'hard',
        title: 'Guard the counter',
        brief: 'Extend the counter so it cannot go below 0 or above 10, and the buttons disable at the limits.',
        acceptanceCriteria: ['Count stays between 0 and 10', 'Minus disables at 0, plus disables at 10', 'A message explains each limit'],
        hints: ['Check the value before calling the setter.', 'disabled is a prop that takes true or false.', 'The message itself depends on count.'],
        solutionOutline: ['Add minus and plus with guards', 'Disable buttons at the edges', 'Show a message for each edge'],
      },
    ],
  },
  practiceLinks: [
    { label: 'React docs: state, a component memory', url: 'https://react.dev/learn/state-a-components-memory' },
    { label: 'React docs: responding to events', url: 'https://react.dev/learn/responding-to-events' },
  ],
  quiz: [
    {
      question: 'What is state?',
      options: ['Data a component owns and can change over time', 'A country where the app runs', 'The color of the page background', 'A file saved on the hard drive'],
      correctIndex: 0,
      explanation: 'State is the memory of one component; changing it updates the screen.',
    },
    {
      question: 'What does useState(0) return?',
      options: ['The current value and a setter function to change it', 'Two random numbers', 'A button and a web page', 'Nothing, it only prints 0'],
      correctIndex: 0,
      explanation: 'You get the value today plus the only function allowed to change it.',
    },
    {
      question: 'Why does count = count + 1 fail to update the screen?',
      options: ['React only re-renders when the state setter is called', 'Numbers cannot grow in JavaScript', 'Buttons block all math', 'The screen updates only after one hour'],
      correctIndex: 0,
      explanation: 'Direct assignment skips React, so no re-render happens.',
    },
    {
      question: 'Where does the click handler go on a button?',
      options: ['onClick={addOne}', 'onclick="addOne()"', 'click: addOne', 'href={addOne}'],
      correctIndex: 0,
      explanation: 'React uses camelCase onClick with a function, not a string.',
    },
  ],
};

export default mod;
