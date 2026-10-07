import type { SeedModuleInput } from '../../../types';

const mod: SeedModuleInput = {
  order: 12,
  slug: 'react-router',
  title: 'React Router: Pages, Params, Protected Routes',
  goal: 'Build a multi-page app with nested routes, URL params, and login guards.',
  estimatedMinutes: 130,
  projectSlug: 'multi-page-shop',
  videos: [
    {
      kind: 'full',
      title: 'Learn React Router v6 In 45 Minutes',
      channel: 'Web Dev Simplified',
      youtubeUrl: 'https://www.youtube.com/watch?v=Ul3y1LXxzdU',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'full',
      title: 'React Router V6 Tutorial - Routes, Redirecting, UseNavigate, UseParams...',
      channel: 'PedroTech',
      youtubeUrl: 'https://www.youtube.com/watch?v=UjHT_NKR_gU',
      durationSeconds: null,
      fit: 'strong',
      note: null,
    },
    {
      kind: 'short',
      title: null,
      channel: null,
      youtubeUrl: null,
      searchQuery: 'React Router protected routes short',
      durationSeconds: null,
      fit: null,
      note: 'No Short for protected routes yet.',
    },
  ],
  scriptFallback: [
    { onScreen: 'A book with tabs: Home, Shop, Cart. Clicking a tab flips the page.', voiceover: 'React Router turns one page into a book with many pages. The URL is the tab.' },
    { onScreen: 'URL /product/7 highlighted; the page shows product 7.', voiceover: 'Parts of the URL can carry data. Seven here means show product number seven.' },
    { onScreen: 'A locked VIP room; a guard checks a badge before entry.', voiceover: 'Protected routes are VIP rooms. No login badge? The guard sends you to login.' },
    { onScreen: 'A layout with a menu that stays while pages change below.', voiceover: 'Nested routes share one frame. The menu stays; only the inside page changes.' },
  ],
  learn: [
    'Think of your app as a book. Each page is a route, and the URL is the tab that opens it. / is Home, /shop is the shop, /cart is the cart. React Router watches the address bar and shows the matching page — without reloading the whole book.',
    'Links move between pages. Use <Link to="/shop"> instead of <a href>. A normal anchor reloads everything and wipes your state. A Link swaps only the page content. A new term: route params. A param is data hidden inside the URL, like the 7 in /product/7, read with useParams.',
    'Nested routes share a frame. A Layout with the menu renders an <Outlet> — a hole where the child page appears. The menu stays still while Home, Shop, and Cart take turns in the hole. One frame, many pages.',
    'Protected routes guard VIP pages. A guard component checks "is the user logged in?" If yes, it shows the page. If no, it sends them to /login with <Navigate to="/login">. After login, useNavigate() walks them back to where they wanted to go.',
  ],
  codeExample: {
    title: 'Shop with layout, product params, and a guard',
    language: 'jsx',
    code: 'import { BrowserRouter, Routes, Route, Link, Outlet, useParams, Navigate } from "react-router-dom";\n\nfunction Layout() {\n  return (\n    <div>\n      <nav><Link to="/">Home</Link> | <Link to="/product/7">Product 7</Link></nav>\n      <Outlet />\n    </div>\n  );\n}\n\nfunction Product() {\n  const { id } = useParams();\n  return <h2>Product {id}</h2>;\n}\n\nfunction Guard({ loggedIn, children }) {\n  if (!loggedIn) return <Navigate to="/login" />;\n  return children;\n}\n\nfunction App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n        <Route element={<Layout />}>\n          <Route path="/" element={<h2>Home</h2>} />\n          <Route path="/product/:id" element={<Guard loggedIn={true}><Product /></Guard>} />\n        </Route>\n      </Routes>\n    </BrowserRouter>\n  );\n}',
    note: ':id catches the number; Guard blocks guests; Outlet holds the child page.',
  },
  realExample:
    'Every shop, blog, and dashboard uses routes: product pages carry ids in the URL, admin pages hide behind login guards, and menus stay fixed while content swaps. Shareable links work because the URL IS the page address.',
  logicTraining: {
    thinkFirst: [
      'What pages exist, and what URL opens each one?',
      'Which pages share a layout (menu stays, content swaps)?',
      'Which URLs carry data (params) — and what if the id does not exist?',
      'Which pages need login, and where do guests go?',
      'After login, where should the user land back?',
    ],
    predictTheOutput: [
      {
        code: '<Route path="/product/:id" element={<Product />} />\n// browser shows /product/7',
        question: 'What does useParams() return in Product?',
        answer: '{ id: "7" } (a string).',
        explanation: 'The :id slot captures that URL segment as text.',
      },
      {
        code: 'function Guard({ loggedIn, children }) {\n  if (!loggedIn) return <Navigate to="/login" />;\n  return children;\n}\n// loggedIn = false',
        question: 'A guest visits the guarded page. What happens?',
        answer: 'They are sent to /login.',
        explanation: 'Navigate swaps the URL, and the login route renders instead.',
      },
    ],
    findTheBug: {
      code: '<a href="/shop">Shop</a>',
      hint: 'Clicking works, but the cart empties and the page flashes white.',
      fixedCode: 'import { Link } from "react-router-dom";\n<Link to="/shop">Shop</Link>',
      explanation: 'Plain anchors reload the app and wipe state; Link navigates inside it.',
    },
    challenges: [
      {
        level: 'easy',
        title: 'Three pages',
        brief: 'Build Home, About, and Contact pages with a menu that never reloads.',
        acceptanceCriteria: ['Menu links switch pages', 'No full-page flash on click', 'Unknown URL shows a 404 page'],
        hints: ['Wrap everything in BrowserRouter.', 'Use Link, never a.', 'Add path="*" for the 404.'],
        solutionOutline: ['Create three page components', 'Add Routes with three paths', 'Add the catch-all 404 route'],
      },
      {
        level: 'medium',
        title: 'Multi-page shop project',
        brief: 'Build a shop: layout with menu, product list, product detail via :id, and cart page.',
        acceptanceCriteria: ['Menu stays while pages swap', '/product/3 shows product 3', 'Bad id shows "not found"'],
        hints: ['Outlet holds the child page.', 'Find the product by the param id.', 'Handle the missing-product case.'],
        solutionOutline: ['Create layout with Outlet', 'Add list and :id detail routes', 'Guard the bad-id case'],
      },
      {
        level: 'hard',
        title: 'Login guard flow',
        brief: 'Protect /checkout: guests detour to /login, then return to checkout after login.',
        acceptanceCriteria: ['Guest lands on login, not checkout', 'Login returns them to checkout', 'Logout blocks checkout again'],
        hints: ['Remember where they came from.', 'useNavigate moves them after login.', 'Keep loggedIn in context or state.'],
        solutionOutline: ['Build Guard with redirect', 'Store the wished-for page', 'Navigate back after login'],
      },
    ],
  },
  practiceLinks: [
    { label: 'React Router docs', url: 'https://reactrouter.com/' },
    { label: 'React Router: getting started', url: 'https://reactrouter.com/start/declarative/installation' },
  ],
  quiz: [
    {
      question: 'Why use Link instead of a plain <a> tag?',
      options: ['Link swaps the page without reloading and keeps state', 'Link makes text rainbow colored', 'Link works without internet', 'Link is shorter to type'],
      correctIndex: 0,
      explanation: 'Anchors reload the whole app; Links navigate inside it.',
    },
    {
      question: 'In /product/:id, what is :id?',
      options: ['A route param — data captured from that URL part', 'A secret password', 'The page number in Google', 'The price of the product'],
      correctIndex: 0,
      explanation: 'Params carry data inside the URL, read with useParams.',
    },
    {
      question: 'What does <Outlet /> do?',
      options: ['Marks where the child route page appears inside a layout', 'Logs the user out', 'Deletes the menu', 'Prints the page on paper'],
      correctIndex: 0,
      explanation: 'The layout frame stays; the outlet hole shows each child page.',
    },
    {
      question: 'How does a protected route handle a guest?',
      options: ['Sends them to /login with Navigate', 'Deletes their account', 'Shows a blank black screen forever', 'Gives them admin rights'],
      correctIndex: 0,
      explanation: 'The guard checks login and redirects guests to sign in.',
    },
  ],
};

export default mod;
