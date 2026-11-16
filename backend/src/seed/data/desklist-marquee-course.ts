/**
 * One student course for the Desklist + Marquee labs.
 * Screenshots are the target. Short YouTube clips explain the idea.
 * Finished function bodies stay out of this file and off GitHub.
 */

export const DESKLIST_REPO = 'https://github.com/Codding-School-mahama-1/Todo-app-debug';
export const MARQUEE_REPO = 'https://github.com/Codding-School-mahama-1/Ledger-catalog-lab';

const DESK_SHOT = (file: string) =>
  `https://raw.githubusercontent.com/Codding-School-mahama-1/Todo-app-debug/main/assignment/expected-output/${file}`;
const MARQ_SHOT = (file: string) =>
  `https://raw.githubusercontent.com/Codding-School-mahama-1/Ledger-catalog-lab/main/assignment/expected-output/${file}`;

const YT = {
  react: 'https://www.youtube.com/watch?v=gEbHl9EhwoI',
  vite: 'https://www.youtube.com/shorts/UK4j4bYJDv4',
  useState: 'https://www.youtube.com/shorts/F_OT4Y4eIjw',
  components: 'https://www.youtube.com/shorts/4mnRWymMP2g',
  useEffect: 'https://www.youtube.com/shorts/8GM_3eWA2_I',
  hooks: 'https://www.youtube.com/watch?v=6ThXsUwLWvc',
  router: 'https://www.youtube.com/watch?v=UjHT_NKR_gU',
} as const;

export const LABS_COURSE_TITLE = 'Desklist and Marquee: React Labs';

type LabLesson = {
  title: string;
  duration: number;
  type: 'video' | 'article' | 'quiz';
  videoUrl?: string;
  videoTitle?: string;
  content: string;
  githubClassroomLink?: string;
  quizQuestions?: Array<{
    questionText: string;
    type: 'multiple_choice';
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  }>;
};

type LabModule = {
  title: string;
  description: string;
  learningOutcome: string;
  hoursAllocated: number;
  lessons: LabLesson[];
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function p(text: string) {
  return `<p>${esc(text)}</p>`;
}

function h3(text: string) {
  return `<h3>${esc(text)}</h3>`;
}

function ul(items: string[]) {
  return `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
}

function link(href: string, label: string) {
  return `<p><a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a></p>`;
}

function shot(src: string, alt: string, caption: string) {
  return [
    '<figure>',
    `<img src="${esc(src)}" alt="${esc(alt)}" style="width:100%;max-width:860px;height:auto;border-radius:12px;border:1px solid rgba(0,0,0,.12)" />`,
    `<figcaption><em>${esc(caption)}</em></figcaption>`,
    '</figure>',
  ].join('');
}

function quiz(
  question: string,
  options: string[],
  answerIndex: number,
  explanation: string
): NonNullable<LabLesson['quizQuestions']>[number] {
  return {
    questionText: question,
    type: 'multiple_choice',
    options,
    correctOptionIndex: answerIndex,
    explanation,
  };
}

export const LABS_COURSE = {
  title: LABS_COURSE_TITLE,
  description:
    'One course for two React assignments. Desklist is a todo page that fails until you match eight screens. Marquee is a static show table you turn into a live catalog of 100 shows, ten per page. Short videos explain the idea. Screenshots are the target. Write your own notes. Do not paste the project into an AI.',
  category: 'Programming',
  thumbnail:
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
  modules: [
    {
      title: 'How this course works',
      description: 'Two GitHub labs, one path. Clone, run, match the screens, write your notes.',
      learningOutcome: 'Students can open both labs and know what done looks like.',
      hoursAllocated: 1,
      lessons: [
        {
          title: 'Two labs, one path',
          duration: 8,
          type: 'video',
          videoUrl: YT.react,
          videoTitle: 'React — short overview',
          githubClassroomLink: DESKLIST_REPO,
          content: [
            p('This course explains the codebase for two assignments. Watch the short video, then open the repositories. The pictures later in this course are the finished apps.'),
            h3('The two repositories'),
            link(DESKLIST_REPO, 'Desklist — the debugging todo lab'),
            link(MARQUEE_REPO, 'Marquee — the live catalog lab'),
            p('Clone a repository, run npm install, then npm run dev. Desklist is usually http://localhost:5173. Marquee is usually http://localhost:5175.'),
            h3('Module order'),
            ul([
              'Desklist. A todo page that fails. Repair it until it matches eight screens.',
              'Marquee. A static show table. Turn it into 100 live shows, ten per page.',
              'Routing. The next assignment. The catalog stays. A show, the add form, and a missing address each get their own page.',
            ]),
            h3('How you work'),
            ul([
              'Read the first error, fix that, and run the page again.',
              'Match the screenshots in the repository. Those same pictures are in this course.',
              'Write your own notes: what was missing, what you added, why, and how you checked it.',
              'Do not ask an AI to find the bugs, write the fixes, or write your journal.',
            ]),
            h3('What this course will not give you'),
            p('The finished function bodies for the student work stay off this course and off GitHub. The lesson names the files so you can see the shape of the system. You write the missing code.'),
          ].join('\n'),
        },
      ],
    },
    {
      title: 'Desklist',
      description: 'A React todo list. Debug until the page matches the eight screens.',
      learningOutcome: 'Students can name each Desklist file and match the eight screens.',
      hoursAllocated: 4,
      lessons: [
        {
          title: 'How the Desklist page is built',
          duration: 10,
          type: 'video',
          videoUrl: YT.vite,
          videoTitle: 'Vite with React',
          githubClassroomLink: DESKLIST_REPO,
          content: [
            p('Open the Desklist repository. The short video is how a Vite React app starts. Then walk the files on this page.'),
            link(DESKLIST_REPO, 'Clone Desklist'),
            h3('Startup'),
            ul([
              'index.html is the shell.',
              'src/main.jsx starts React.',
              'src/App.jsx draws the card: the title, the new-task field, the filter chips, the search box, the list, and the clear button.',
            ]),
            h3('The pieces of the card'),
            ul([
              'src/components/TodoForm.jsx is the field where you type a new task.',
              'src/components/TodoFilters.jsx is All, Active, and Completed.',
              'src/components/TodoList.jsx holds the rows.',
              'src/components/TodoItem.jsx is one task: checkbox, name, and delete.',
            ]),
            h3('The list itself'),
            ul([
              'src/useTodos.js is where add, complete, rename, delete, and clear live.',
              'src/storage.js loads and saves the list.',
              'src/data.js is the five starter tasks.',
              'src/index.css and src/App.css are the paper background and the card.',
            ]),
            h3('What you practice'),
            ul([
              'Reading the first error, fixing that, and running the page again.',
              'React state: the list, the filter, the search text, and the task being renamed.',
              'Events: submit, change, click, Enter, and Escape.',
              'A list that survives refresh.',
              'A journal entry in DEBUG_JOURNAL.md for every file you change.',
            ]),
            p('Repair the files that are already here. Do not rewrite the app, and do not remove a feature to hide an error.'),
          ].join('\n'),
        },
        {
          title: 'Desklist screens: start, filters, rename',
          duration: 12,
          type: 'video',
          videoUrl: YT.useState,
          videoTitle: 'useState in a short clip',
          content: [
            p('Put these pictures next to your running app. All is selected on a fresh browser. Five starter tasks. Three are still open.'),
            h3('1. Starting list'),
            p('All is selected. Five tasks. Three are still open, so the bottom line says 3 items left. Book the library study room and Water the office plant are crossed out. The card sits on warm paper. Add is terracotta.'),
            shot(DESK_SHOT('01-all-tasks.png'), 'Desklist starting list', 'Starting list. All selected, three tasks still open.'),
            h3('2. Active'),
            p('Only the open tasks stay. The chip numbers still describe the whole list, and items left is still 3.'),
            shot(DESK_SHOT('02-active.png'), 'Desklist Active filter', 'Active filter. Three open tasks.'),
            h3('3. Completed'),
            p('Only the two finished tasks. They stay crossed out.'),
            shot(DESK_SHOT('03-completed.png'), 'Desklist Completed filter', 'Completed filter. Two finished tasks.'),
            h3('4. Rename'),
            p('Click a name and that row becomes a text box. Enter saves. Escape puts the old name back. This shot is the Friday quiz open for editing, before Enter.'),
            shot(DESK_SHOT('04-editing.png'), 'Desklist rename', 'The quiz task open for renaming.'),
          ].join('\n'),
        },
        {
          title: 'Desklist screens: search, add, clear, empty',
          duration: 12,
          type: 'video',
          videoUrl: YT.components,
          videoTitle: 'React components in a short clip',
          content: [
            p('The same list, four more checks. Search ignores capital letters. A blank task, including spaces only, is ignored.'),
            h3('5. Search'),
            p('PLANT still finds Water the office plant. The chip numbers stay 5, 3, and 2.'),
            shot(DESK_SHOT('05-search.png'), 'Desklist search for PLANT', 'Search for PLANT.'),
            h3('6. A new task'),
            p('Send the grade sheet was added at the top. Six tasks, four open, four items left.'),
            shot(DESK_SHOT('06-new-task.png'), 'Desklist new task at the top', 'New task at the top of the list.'),
            h3('7. Clear completed'),
            p('Clear completed removes every finished task. After that the button is disabled, because nothing is finished.'),
            shot(DESK_SHOT('07-clear-completed.png'), 'Desklist after clearing completed', 'List after clearing completed tasks.'),
            h3('8. Empty'),
            p('Deleting every task leaves the empty message. A filter or a search with no matches has its own message.'),
            shot(DESK_SHOT('08-empty.png'), 'Empty Desklist', 'Empty Desklist.'),
            h3('Done when'),
            ul([
              'The page matches the eight screens.',
              'Refresh keeps the list.',
              'The console has no errors from this app.',
              'DEBUG_JOURNAL.md is filled in your own words, one entry per file you changed.',
            ]),
          ].join('\n'),
        },
        {
          title: 'Check: Desklist files and screens',
          duration: 5,
          type: 'quiz',
          content: p('A short check before Marquee. These questions are about the files and the screens, not about a hidden answer key.'),
          quizQuestions: [
            quiz(
              'Which file starts React for Desklist?',
              ['src/App.css', 'src/main.jsx', 'src/data.js', 'DEBUG_JOURNAL.md'],
              1,
              'src/main.jsx starts React. App.jsx then draws the card.'
            ),
            quiz(
              'Where do add, complete, rename, delete, and clear live?',
              ['TodoFilters.jsx', 'index.html', 'src/useTodos.js', 'src/App.css'],
              2,
              'src/useTodos.js holds those list actions. The components draw them.'
            ),
            quiz(
              'On a fresh starting list, how many items should still be open?',
              ['Five', 'Two', 'Three', 'Zero'],
              2,
              'Five starter tasks. Two are already finished. Three are still open.'
            ),
            quiz(
              'Search for PLANT should find which task?',
              ['Draft the lab instructions', 'Water the office plant', 'Prepare the Friday quiz', 'Nothing'],
              1,
              'Search ignores capital letters. PLANT still finds Water the office plant.'
            ),
          ],
        },
      ],
    },
    {
      title: 'Marquee files and functions',
      description: 'How the catalog is split, and what each function is for.',
      learningOutcome: 'Students can follow data from App through the hooks to the table.',
      hoursAllocated: 2,
      lessons: [
        {
          title: 'How Marquee is assembled',
          duration: 12,
          type: 'video',
          videoUrl: YT.hooks,
          videoTitle: 'Custom hooks in about ten minutes',
          githubClassroomLink: MARQUEE_REPO,
          content: [
            p('A function is a named piece of work. A React component is a function that returns markup. App is the function that calls the others and passes data down. Data moves in one direction: a hook prepares a list, App receives it, a component draws it.'),
            link(MARQUEE_REPO, 'Clone Marquee'),
            p('Open the page with npm run dev. The lessons in the repository start at lessons/module-1-open-the-page.md.'),
            h3('Startup'),
            ul([
              'index.html holds div#root and loads src/main.jsx. The fonts are Newsreader for titles and Figtree for the rest.',
              'src/main.jsx calls createRoot on #root and renders App inside StrictMode.',
              'src/styles/global.css is the dark masthead, the cream page, the table, the posters, and the green chips.',
              'vite.config.js starts the dev server on port 5175.',
            ]),
            h3('The data path'),
            p('App calls useCatalog, then useSort(products), then usePaging(sorted). useCatalog is meant to hold the 100 shows. useSort is meant to order that list. usePaging is meant to hand the table only ten rows. loaded is true only when products is an array. Until then StaticPreview shows the three sample rows.'),
            h3('Functions that already draw the page'),
            ul([
              'AppShell wraps the page.',
              'SiteHeader draws the dark Marquee bar. SiteFooter draws the line under the page.',
              'StaticPreview draws the three sample shows from SAMPLE_ROWS.',
              'MovieRow draws one row: Poster, a title button, a 140-character summary, year, genres, rating, and Edit.',
              'MovieDetail draws the large poster and the full description. It returns nothing when no show is open.',
              'Poster draws the image, or the first letter when the address is empty.',
              'TableHead draws Poster, Show, Year, Genres, Rating.',
              'CatalogToolbar draws Name and Rating. Clicking one calls onChoose with "title" or "rating".',
              'PaginationBar builds the page numbers in a loop, then map turns each number into a button.',
              'ErrorNote shows the red message when error is not empty.',
              'pageSize.jsx exports PAGE_SIZE, which is 10.',
            ]),
          ].join('\n'),
        },
        {
          title: 'The work that is still yours',
          duration: 8,
          type: 'article',
          content: [
            p('These files are in the repository on purpose with the work left open. This lesson names them so you can see the shape of the system. The finished bodies are not here and they are not on GitHub.'),
            h3('Functions that are still your work'),
            ul([
              'loadCatalog is the function that should return the 100 shows.',
              'useCatalog should run that load when the page opens and store the list, or store the error message.',
              'useSort should return a copy of the list ordered by the chosen key.',
              'usePaging should return the page count and only the ten rows for the current page.',
              'CatalogTable should draw one MovieRow for each of those rows.',
              'CategoryStats should count genres across the whole ordered list.',
              'addMovie should put a new show at the front of the list.',
              'saveMovie should change the title, rating, and description of one show and leave its poster alone.',
            ]),
            h3('The show shape'),
            p('A row the table already understands has id, title, year, genres, rating, image, imageLarge, summary, runtime, status, and language. The three sample rows use that shape. The API uses different names. You decide the conversion and record it in WORK_LOG.md.'),
            h3('What you research'),
            p('Use the free TVMaze API. Find the endpoint yourself. Read its documentation and match the live rows to the sample rows already on the page. A failed request should not crash the page. ErrorNote already renders the message in the red box.'),
          ].join('\n'),
        },
      ],
    },
    {
      title: 'Functions, map, sort, and pages',
      description: 'The ideas Marquee asks you to practice. The examples are generic. They are not the catalog answer.',
      learningOutcome: 'Students can explain map, sort of a copy, and pages of ten.',
      hoursAllocated: 2,
      lessons: [
        {
          title: 'Function, map, sort, pages of 10',
          duration: 15,
          type: 'article',
          content: [
            h3('Function'),
            p('A function packages work under a name. You call it with arguments. It can return a value. MovieRow is a function. App calls it and passes one show in as movie. Inside MovieRow, the genres are joined into one string, and the summary is cut at 140 characters.'),
            p('A small example, not from the lab:'),
            '<pre><code>function label(title) {\n  return title.toUpperCase();\n}</code></pre>',
            h3('map'),
            p('map walks a list and builds a new list of the same length. It does not change the original. Use it when each item should become one piece of the page.'),
            p('PaginationBar already does this. It has an array of page numbers. pages.map turns each number into a button. key={number} tells React which button is which when the page changes. The click calls onPage(number).'),
            p('The live table needs the same idea: one MovieRow for each show, with the show id as the key. That row function is still yours to write.'),
            h3('sort'),
            p('sort puts items in an order. Name order compares titles with localeCompare, so A comes before B. Rating order compares numbers and puts the larger number first. A missing rating should land at the end, not in the middle of the high scores.'),
            p('Sort a copy. If the original list is sorted in place, the unsorted list is gone and other parts of the page change with it. The Name and Rating buttons only store which key was chosen. They do not order the shows. That order is your function.'),
            h3('Pages of 10'),
            p('PAGE_SIZE is 10. One hundred shows make ten pages. Page 1 is items 0 through 9. Page 2 is items 10 through 19. The start index is (page - 1) times 10. The end index is the start plus 10.'),
            p('PaginationBar already draws Previous, the numbers, and Next. Previous is disabled when the page is 1. Next is disabled on the last page. The function that cuts the ordered list down to those ten rows is still open.'),
            h3('forEach'),
            p('forEach walks a list to do work with each item. It does not build a new list. map builds a new list, so map is for rows. forEach is for a count. A show can have several genres, so a genre count walks shows, and inside each show walks that show\'s genres.'),
            h3('async, await, and throw'),
            p('A request to another site takes time. async marks a function that can wait. await pauses inside that function until the response arrives. The rest of the page does not freeze, because React keeps the current screen until set state runs.'),
            p('throw reports a failure. The caller can catch it and pass error.message to setError. ErrorNote already renders that string in the red box. A bad response should land there, not as a blank crash.'),
            p('useEffect is how a component starts work after it appears. The catalog load belongs there, once, when the page opens. The effect in the student project is still yours to write.'),
            h3('What you write down'),
            p('WORK_LOG.md asks for one entry per gap: what was missing, what you added, why that was the right change, and how you checked it. The check is the screenshot.'),
          ].join('\n'),
        },
        {
          title: 'Check: map, sort, and pages',
          duration: 5,
          type: 'quiz',
          content: p('Check the ideas before you match the Marquee screens.'),
          quizQuestions: [
            quiz(
              'Why does PaginationBar use map?',
              [
                'To count genres',
                'To turn each page number into a button',
                'To sort titles A to Z',
                'To load the API',
              ],
              1,
              'map walks the page numbers and builds one button for each.'
            ),
            quiz(
              'If PAGE_SIZE is 10, which items are on page 2?',
              ['Items 0 through 9', 'Items 2 through 11', 'Items 10 through 19', 'Items 1 through 10'],
              2,
              'The start index is (page - 1) times 10. Page 2 starts at 10.'
            ),
            quiz(
              'Why sort a copy of the list, not the original?',
              [
                'Copies are faster',
                'The API requires a copy',
                'Sorting in place loses the unsorted list and other parts of the page change with it',
                'React forbids sort',
              ],
              2,
              'Sort a copy so genre counts, the other sort, and later pages still have the original order available.'
            ),
            quiz(
              'What should happen when the request to the show API fails?',
              [
                'The page should crash',
                'The red ErrorNote should show the message',
                'The table should invent 100 rows',
                'The browser should reload',
              ],
              1,
              'throw reports the failure. ErrorNote already draws that string.'
            ),
          ],
        },
      ],
    },
    {
      title: 'Marquee screens',
      description: 'What each finished picture is showing.',
      learningOutcome: 'Students can match the live table, the full record, page 2, and rating sort.',
      hoursAllocated: 3,
      lessons: [
        {
          title: 'Live table and full record',
          duration: 12,
          type: 'video',
          videoUrl: YT.useEffect,
          videoTitle: 'useEffect in about 20 seconds',
          content: [
            p('On first open the masthead says Marquee. The title says one hundred shows, ten per page. Three sample shows are drawn in the page: Under the Dome, Person of Interest, and Bitten. The live heading says the shows are waiting. Genre counts are not there yet. Previous, 1, and Next are the only page buttons, and Previous and Next are disabled.'),
            h3('Name sort, page 1'),
            p('One hundred shows have loaded. Name is the green chip, so titles start at A. A to Z is first, then America\'s Next Top Model, then American Horror Story. Each row has a poster, a short description, the year, the genres, and the rating. The chips above the table are genre counts for all 100 shows. Drama is the largest group on this data.'),
            shot(MARQ_SHOT('01-live-table.png'), 'Marquee live table sorted by name', 'Live table, sorted by name, page 1.'),
            h3('Full record'),
            p('Clicking Arrow opens the full record above the table. The poster is the large image. The line under the title reads 2012, 60 min, Ended, English. The next line is Drama, Action, Science-Fiction, rating 7.4. The paragraph is the full description, not the 140-character preview. Close hides the record.'),
            shot(MARQ_SHOT('02-full-record.png'), 'Marquee full record for Arrow', 'Arrow, large poster and full description.'),
          ].join('\n'),
        },
        {
          title: 'Page 2, rating sort, add and edit',
          duration: 12,
          type: 'article',
          content: [
            h3('Page 2'),
            p('Page 2 of the name sort leaves A behind. Bones is the first row, then Brooklyn Nine-Nine, Californication, and Castle. The genre counts do not change, because they describe the whole list. Under the table, Previous is available, 2 is the green button, and the numbers run through 10.'),
            shot(MARQ_SHOT('03-page-two.png'), 'Marquee page 2 still sorted by name', 'Page 2, still sorted by name.'),
            h3('Rating sort'),
            p('Rating is the green chip. The highest scores are first. Game of Thrones is 8.9, Person of Interest is 8.8, Death Note is 8.8, then Vikings, Fargo, and Orphan Black at 8.6. The same ten-per-page buttons still move through the ordered list.'),
            shot(MARQ_SHOT('04-rating.png'), 'Marquee catalog sorted by rating', 'The same catalog sorted by rating.'),
            h3('Add and edit'),
            p('The New show form sits under the table: title, year, genres, rating, poster address, and description. A finished add puts that show first. A finished edit changes only the open show\'s title, rating, and description. The poster stays. Refresh does not need to keep those local edits, because the API will not store them. The list on the page does.'),
            h3('Done when'),
            ul([
              'Name sort starts at A. Page 2 continues the alphabet.',
              'Rating starts at the highest score.',
              'A title opens the large poster.',
              'Add puts a row at the top. Edit keeps the poster.',
              'WORK_LOG.md has one entry per gap, in your own words.',
            ]),
          ].join('\n'),
        },
      ],
    },
    {
      title: 'Next: routing',
      description: 'The catalog stays. Moving around the app becomes a set of addresses.',
      learningOutcome: 'Students can name the pages routing will add before that assignment is handed out.',
      hoursAllocated: 1,
      lessons: [
        {
          title: 'Each place gets an address',
          duration: 15,
          type: 'video',
          videoUrl: YT.router,
          videoTitle: 'React Router: routes, links, and params',
          content: [
            p('Watch the first part of the video: routes, Link, and useParams. You do not need protected routes for this assignment. Screenshots for this module will be added when the assignment is handed out.'),
            h3('What changes'),
            p('Marquee currently opens a show and the edit dialog on the same page. The address bar never changes. Refreshing always returns to the catalog, even if a show was open. Routing gives each of those places its own address.'),
            h3('The pages'),
            ul([
              'The home address is the catalog: the table, the sort, the genre counts, and ten shows per page.',
              'Each show has its own address that includes the show id. Refreshing that address still shows that show\'s poster and full description.',
              'Add show is its own page, with a way back to the catalog.',
              'The header links show which page is current.',
              'An address that does not exist shows a not-found page with a link home.',
              'The browser Back button returns to the page you came from.',
            ]),
            h3('The ideas'),
            ul([
              'A router watches the address bar.',
              'A route pairs one address with one page component.',
              'A link changes the address without asking the browser to reload the whole site.',
              'A parameter is the part of the address that changes per show, such as the id.',
              'After a successful add, the page sends you back to the catalog.',
              'A catch-all route is the not-found page.',
            ]),
            h3('What stays from Marquee'),
            p('The 100 shows, the posters, the descriptions, the name sort, the rating sort, and the pages of ten all stay. You still write a work log: what was missing, what you added, and why.'),
          ].join('\n'),
        },
      ],
    },
  ] as LabModule[],
};
