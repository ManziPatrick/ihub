import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 7,
  slug: 'effects-and-fetching',
  title: 'useEffect and Fetching Data',
  goal: 'Load data from the internet with loading, error, and success states plus cleanup.',
  estimatedMinutes: 130,
  projectSlug: 'currency-converter',
  videos: [
    {
      kind: 'short',
      title: 'useEffect Explained in 20 Seconds ✨ | React useEffect for Beginners #shorts #react',
      channel: 'CodeBoss',
      youtubeUrl: 'https://www.youtube.com/shorts/8GM_3eWA2_I',
      durationSeconds: 20,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'full',
      title: 'Fetching Data in React - Complete Tutorial',
      channel: 'Cosden Solutions',
      youtubeUrl: 'https://www.youtube.com/watch?v=00lxm_doFYw',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
  ],
  scriptFallback: [
    { onScreen: 'A waiter taking an order to the kitchen while the table waits.', voiceover: 'Some work happens outside your component, like asking a server for data. That is called a side effect.' },
    { onScreen: 'Code: useEffect(() => { fetch... }, []) with the empty brackets circled.', voiceover: 'useEffect runs your side job after render. Empty brackets mean run it once, at the start.' },
    { onScreen: 'Three screens: spinner, error message, and the data list.', voiceover: 'Fetching has three states: loading, error, and success. Plan all three before you code.' },
    { onScreen: 'A cancelled request when the component leaves the screen.', voiceover: 'Clean up after yourself, so old requests never update a screen that is gone.' },
  ],
  learn: [
    'Think of ordering food. You ask the kitchen (the server), you wait (loading), and the food arrives (success) — or the kitchen is closed (error). Your component cannot cook the data itself; it must ask the internet. A new term: side effect. It is any work your component does with the outside world: fetching data, timers, saving.',
    'The useEffect hook runs side jobs after React draws the screen. You write useEffect(() => { /* fetch here */ }, []). The second part, called the dependency array, controls WHEN it runs. Empty brackets [] mean "run once when the component first appears". A name inside like [userId] means "run again each time userId changes".',
    'Fetching needs three pieces of state: data, loading, and error. Start with loading true and a spinner on screen. When data arrives, store it and switch loading off. When it fails, store the error and show a friendly message with a retry button. Never show a blank page.',
    'Cleanup stops ghost updates. If the user leaves the page while a request is still flying, the answer must not touch the gone screen. The function you return from useEffect is the cleanup crew — it cancels timers and aborts requests.',
  ],
  codeExample: {
    title: 'Fetch with loading, error, success, and cleanup',
    language: 'jsx',
    code: 'import { useState, useEffect } from "react";\n\nfunction Rates() {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    const ctrl = new AbortController();\n    fetch("https://api.exchangerate.host/latest?base=USD", { signal: ctrl.signal })\n      .then((res) => {\n        if (!res.ok) throw new Error("Bad response");\n        return res.json();\n      })\n      .then((json) => setData(json))\n      .catch((e) => { if (e.name !== "AbortError") setError(e.message); })\n      .finally(() => setLoading(false));\n    return () => ctrl.abort();\n  }, []);\n\n  if (loading) return <p>Loading…</p>;\n  if (error) return <p>Failed: {error}</p>;\n  return <p>EUR rate: {data.rates.EUR}</p>;\n}',
    note: 'Three states cover every case; the cleanup aborts a late request.',
  },
  realExample:
    'Weather apps, currency converters, and movie search pages all fetch from an API. They show a spinner first, the data next, and a retry button when the network fails. Every professional app plans all three screens.',
  logicTraining: {
    thinkFirst: [
      'What URL gives me the data, and what shape is the answer?',
      'What shows while loading, on error, and on success?',
      'When must the fetch run again — once, or when some value changes?',
      'What cleanup stops a late answer from touching a gone screen?',
      'What can go wrong (no internet, bad URL, empty result)?',
    ],
    predictTheOutput: [
      {
        code: 'function A() {\n  useEffect(() => { console.log("hi"); }, []);\n  return <p>Yo</p>;\n}',
        question: 'The component appears once. How many times does "hi" print?',
        answer: 'Once.',
        explanation: 'The empty array means the effect runs only on first appearance.',
      },
      {
        code: 'function A({ id }) {\n  useEffect(() => { console.log("fetch " + id); }, [id]);\n  return <p>{id}</p>;\n}',
        question: 'id changes from 1 to 2. What prints?',
        answer: '"fetch 1" first, then "fetch 2".',
        explanation: 'The effect re-runs every time a dependency changes.',
      },
    ],
    findTheBug: {
      code: 'function A() {\n  const [data, setData] = useState(null);\n  useEffect(() => {\n    fetch("/api/data").then((r) => r.json()).then(setData);\n  });\n  return <p>{data ? "done" : "loading"}</p>;\n}',
      hint: 'The network tab shows the same request firing again and again, forever.',
      fixedCode: 'function A() {\n  const [data, setData] = useState(null);\n  useEffect(() => {\n    fetch("/api/data").then((r) => r.json()).then(setData);\n  }, []);\n  return <p>{data ? "done" : "loading"}</p>;\n}',
      explanation: 'Without a dependency array the effect runs after every render — fetching sets state, which renders, which fetches again.',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Three screens',
        brief: 'Fetch any public JSON URL and show Loading… then the data or a friendly error.',
        acceptanceCriteria: ['Spinner shows while loading', 'Data shows on success', 'Error message shows on failure'],
        hints: ['Start with loading true.', 'Use .catch to store the error.', 'Return early for loading and error.'],
        solutionOutline: ['Create data, loading, error state', 'Fetch once in useEffect', 'Render one screen per state'],
      },
      {
        level: 'medium',
        title: 'Currency converter project',
        brief: 'Fetch exchange rates once, type an amount in USD, and convert to EUR and RWF.',
        acceptanceCriteria: ['Rates load once with a spinner', 'Typing updates converted values at once', 'Failed fetch shows a retry button'],
        hints: ['Store rates in state after fetching.', 'Converted values are computed, not fetched again.', 'Retry repeats the same fetch function.'],
        solutionOutline: ['Fetch rates on mount with three states', 'Add amount input state', 'Compute conversions during render'],
      },
      {
        level: 'hard',
        title: 'Race-proof search',
        brief: 'Fetch results as the user types, but guarantee an old slow answer never overwrites a newer one.',
        acceptanceCriteria: ['Results always match the latest typed text', 'Leaving the page causes no warnings', 'Rapid typing fires no stale updates'],
        hints: ['Depend the effect on the query text.', 'Abort the previous request in cleanup.', 'Ignore AbortError in the catch.'],
        solutionOutline: ['Add query state and effect on query', 'Abort previous fetch on cleanup', 'Verify fast typing shows latest results'],
      },
    ],
  },
  practiceLinks: [
    { label: 'React docs: fetching data with effects', url: 'https://react.dev/learn/synchronizing-with-effects#fetching-data' },
    { label: 'MDN: using the Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' },
  ],
  quiz: [
    {
      question: 'What is a side effect?',
      options: ['Work a component does with the outside world, like fetching data', 'A mistake that deletes the app', 'A special color for buttons', 'A second computer screen'],
      correctIndex: 0,
      explanation: 'Fetching, timers, and saving are jobs outside rendering.',
    },
    {
      question: 'What does useEffect(fn, []) do?',
      options: ['Runs fn once after the first render', 'Runs fn before every click', 'Deletes the component', 'Never runs fn at all'],
      correctIndex: 0,
      explanation: 'The empty array means no dependencies, so it runs a single time.',
    },
    {
      question: 'The effect has no dependency array at all. What happens?',
      options: ['It runs after every render — often an endless fetch loop', 'It runs exactly once', 'It never runs', 'It runs only on Mondays'],
      correctIndex: 0,
      explanation: 'No array means "after each render", and fetch-then-set-state loops forever.',
    },
    {
      question: 'What is the cleanup function for?',
      options: ['To cancel late work so it never touches a screen that is gone', 'To delete the source code', 'To make the app louder', 'To log users out'],
      correctIndex: 0,
      explanation: 'The returned function aborts requests and timers on unmount or re-run.',
    },
  ],
};

export default mod;
