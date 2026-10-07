import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 13,
  slug: 'performance',
  title: 'Performance: memo, Lazy Loading, Suspense',
  goal: 'Find slow renders and fix them with memo, lazy loading, and Suspense.',
  estimatedMinutes: 120,
  projectSlug: 'fast-dashboard',
  videos: [
    {
      kind: 'full',
      title: 'Speed Up Your React Apps With Code Splitting',
      channel: 'Web Dev Simplified',
      youtubeUrl: 'https://www.youtube.com/watch?v=JU6sl_yyZqs',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'full',
      title: 'React Performance : useMemo & useCallback vs useReducer & Dispatch',
      channel: 'Eulier Gonzalez',
      youtubeUrl: 'https://www.youtube.com/watch?v=q8YRXThYOlY',
      durationSeconds: null,
      fit: 'partial',
      note: null,
    },
    {
      kind: 'short',
      title: null,
      channel: null,
      youtubeUrl: null,
      searchQuery: 'React.memo avoid re-renders explained short',
      durationSeconds: null,
      fit: null,
      note: 'No Short for React.memo yet.',
    },
  ],
  scriptFallback: [
    { onScreen: 'A kitchen remaking every dish when only one order changes.', voiceover: 'A re-render is React redrawing a component. Too many redraws make apps feel slow.' },
    { onScreen: 'A sleepy guard (memo) waving through unchanged props.', voiceover: 'React.memo is a guard: same props as last time? Skip the redraw.' },
    { onScreen: 'A heavy Reports page loaded only when its tab opens.', voiceover: 'Lazy loading downloads heavy pages only when opened, so the start stays fast.' },
    { onScreen: 'A spinner (Suspense) holding the place of the loading page.', voiceover: 'Suspense shows a fallback while the lazy page travels over the network.' },
  ],
  learn: [
    'Think of a restaurant kitchen. A good kitchen remakes only the dish that changed. A bad kitchen remakes every dish for every order. React re-renders a component when its state, props, or parent changes. Small redraws are cheap; redrawing hundreds of rows per keystroke is the slowness users feel.',
    'React.memo is a guard at the door. It compares new props with old props. Same props? Skip the render and reuse last time’s result. Wrap calm display components like rows and cards: const Row = memo(function Row({ item }) { ... }). A new term: re-render. It means React runs your component again to refresh its output.',
    'Lazy loading splits your app into smaller bags. const Reports = lazy(() => import("./Reports")). The Reports code downloads ONLY when first shown. Suspense is the waiting room: <Suspense fallback={<p>Loading…</p>}> shows the fallback until the bag arrives.',
    'Measure before you fix. React DevTools Profiler records which components render and how long each takes. Fix the slowest first. Common real fixes: memo on rows, moving state down so big lists do not redraw, and lazy-loading heavy pages. Memo everywhere without measuring only adds comparison work.',
  ],
  codeExample: {
    title: 'Memoized row plus a lazy page with Suspense',
    language: 'jsx',
    code: 'import { memo, lazy, Suspense } from "react";\n\nconst Row = memo(function Row({ name }) {\n  return <li>{name}</li>;\n});\n\nconst Reports = lazy(() => import("./Reports"));\n\nfunction Dashboard({ names, showReports }) {\n  return (\n    <div>\n      <ul>{names.map((n) => <Row key={n.id} name={n.name} />)}</ul>\n      {showReports && (\n        <Suspense fallback={<p>Loading reports…</p>}>\n          <Reports />\n        </Suspense>\n      )}\n    </div>\n  );\n}',
    note: 'Rows skip useless redraws; Reports downloads only when opened.',
  },
  realExample:
    'Dashboards with hundreds of rows memoize each row so typing in a search box stays smooth. Big admin panels lazy-load Reports, Settings, and Charts pages. Users get a fast start and spinners only where they wait.',
  logicTraining: {
    thinkFirst: [
      'What feels slow — start time, typing, or scrolling?',
      'Which components re-render, and how often (check the Profiler)?',
      'Are props stable, or recreated every render (inline objects/functions)?',
      'Which heavy pages can load later instead of at start?',
      'Did I measure before AND after the fix?',
    ],
    predictTheOutput: [
      {
        code: 'const Row = memo(function Row({ name }) {\n  console.log("row");\n  return <li>{name}</li>;\n});\nfunction A() {\n  const [n, setN] = useState(0);\n  return <div><button onClick={() => setN(n + 1)}>{n}</button><Row name="x" /></div>;\n}',
        question: 'You click the button twice. How many times does "row" print?',
        answer: 'Once (only the first render).',
        explanation: 'Row props never change, so memo skips every re-render.',
      },
      {
        code: 'function A() {\n  const [n, setN] = useState(0);\n  return <div><button onClick={() => setN(n + 1)}>{n}</button><Row data={{ name: "x" }} /></div>;\n}\n// Row is memoized',
        question: 'You click twice. Row receives a fresh object each time. How many renders?',
        answer: 'Three (first plus one per click).',
        explanation: 'A new object breaks the props comparison, so memo cannot skip.',
      },
    ],
    findTheBug: {
      code: 'const Reports = lazy(() => import("./Reports"));\nfunction A() {\n  return <div>{show && <Reports />}</div>;\n}',
      hint: 'Opening Reports crashes with a Suspense error instead of showing a spinner.',
      fixedCode: 'import { lazy, Suspense } from "react";\nconst Reports = lazy(() => import("./Reports"));\nfunction A() {\n  return <div>{show && (<Suspense fallback={<p>Loading…</p>}><Reports /></Suspense>)}</div>;\n}',
      explanation: 'Every lazy component must render inside a Suspense waiting room.',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Spot the redraws',
        brief: 'Add a console.log to each component of a small app and count renders per click.',
        acceptanceCriteria: ['You can name which components render per click', 'Counts are written down, not guessed'],
        hints: ['Log inside each component body.', 'Click once and read the console.', 'Parent renders do not always mean child work.'],
        solutionOutline: ['Add logs to all components', 'Interact and count', 'List the render path per action'],
      },
      {
        level: 'medium',
        title: 'Fast dashboard project',
        brief: 'Take a slow dashboard (500 rows + heavy chart page) and make typing smooth with memo + lazy.',
        acceptanceCriteria: ['Typing filters without lag', 'Chart page loads only when opened', 'Profiler shows fewer row renders'],
        hints: ['Memo the row component.', 'Stabilize props (no inline objects).', 'Lazy-load the chart page with Suspense.'],
        solutionOutline: ['Profile the slow app first', 'Memo rows and stabilize props', 'Lazy-load the heavy page'],
      },
      {
        level: 'hard',
        title: 'State surgery',
        brief: 'Move a search-box state down so typing no longer re-renders the whole dashboard.',
        acceptanceCriteria: ['Typing re-renders only list + input', 'Header and sidebar stay still', 'You can prove it with the Profiler'],
        hints: ['State re-renders its owner and children.', 'Move state to the lowest shared parent.', 'Compare Profiler before and after.'],
        solutionOutline: ['Find the state owner', 'Move state closer to its users', 'Verify with the Profiler'],
      },
    ],
  },
  practiceLinks: [
    { label: 'React docs: memo', url: 'https://react.dev/reference/react/memo' },
    { label: 'React docs: lazy', url: 'https://react.dev/reference/react/lazy' },
  ],
  quiz: [
    {
      question: 'What is a re-render?',
      options: ['React running your component again to refresh its output', 'Deleting the component forever', 'Restarting the computer', 'Printing the page on paper'],
      correctIndex: 0,
      explanation: 'State, props, or parent changes make React redraw that component.',
    },
    {
      question: 'What does React.memo do?',
      options: ['Skips rendering when props are the same as last time', 'Deletes all props', 'Makes the app work offline', 'Hides the component forever'],
      correctIndex: 0,
      explanation: 'Memo is a guard comparing new props against old ones.',
    },
    {
      question: 'Why must lazy components sit inside Suspense?',
      options: ['Suspense shows a fallback while the code downloads', 'Suspense makes downloads louder', 'Suspense deletes old pages', 'Suspense is required by law'],
      correctIndex: 0,
      explanation: 'Lazy code travels over the network; users need a waiting screen.',
    },
    {
      question: 'What should you do before optimizing?',
      options: ['Measure with the Profiler to find the real slow part', 'Wrap every component in memo at once', 'Delete half the features', 'Buy a faster computer'],
      correctIndex: 0,
      explanation: 'Guessing wastes effort; the Profiler points at the true bottleneck.',
    },
  ],
};

export default mod;
