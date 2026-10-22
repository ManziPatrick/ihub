/** Short, free AI/internet safety courses. Media is still to be reviewed. */

export type SafetyLesson = {
  title: string;
  hook: string;
  keyPoints: string[];
  example: string;
  actions: string[];
  takeaway: string;
  sources: string[];
  quiz: { question: string; options: string[]; answerIndex: number };
};

export type SafetyCourse = {
  title: string;
  category: string;
  audience: string;
  description: string;
  lessons: SafetyLesson[];
};

export const SAFETY_COURSES: SafetyCourse[] = [
  {
    title: 'Kids and Parents: Managing the Internet and AI',
    category: 'Digital Safety',
    audience: 'Parents and guardians',
    description:
      'Step-by-step guide for parents to manage children’s internet and AI use. Short lessons, one action each time.',
    lessons: [
      {
        title: 'Learn it yourself first',
        hook: "You can't protect what you've never opened.",
        keyPoints: [
          "Spend 20 minutes in your child's apps",
          'Find age rules, privacy settings and the report button',
        ],
        example: 'AI products often reach children faster than parents learn the apps.',
        actions: ['Open each app your child uses', 'Write down the age rule and report steps'],
        takeaway: 'Learn first, then teach.',
        sources: ['https://www.internetmatters.org/resources/ai-chatbots-and-virtual-friends-how-parents-can-keep-children-safe/'],
        quiz: {
          question: 'What should a parent do before setting rules?',
          options: ['Ban everything', 'Explore the apps themselves', 'Wait for a problem'],
          answerIndex: 1,
        },
      },
      {
        title: 'Make a family tech agreement',
        hook: 'Rules work best when your child helps write them.',
        keyPoints: ['5 to 7 simple rules', 'Shared rooms, screen-free bedtime hour', 'Review every few months'],
        example: 'Safety groups advise agreeing when and where AI chatbots may be used.',
        actions: ['Write the rules together', 'Post them at home', 'Review them every term'],
        takeaway: 'Rules you build together get followed.',
        sources: ['https://www.internetmatters.org/resources/ai-chatbots-and-virtual-friends-how-parents-can-keep-children-safe/'],
        quiz: {
          question: 'Who should help write the family agreement?',
          options: ['Only the parent', 'Parent and child together', 'The school'],
          answerIndex: 1,
        },
      },
      {
        title: 'Set up devices and accounts',
        hook: 'Five minutes of setup removes hours of worry.',
        keyPoints: ['Child or teen profiles', 'App approval and content filters', 'Parent email and a password manager'],
        example: 'Family tools exist on most devices but a parent must switch them on.',
        actions: ['Create a child profile', 'Turn on app approval', 'Turn on safe search'],
        takeaway: 'Turn the tools on; they are off by default.',
        sources: ['https://support.apple.com/en-us/HT201304', 'https://families.google.com/familylink/'],
        quiz: {
          question: "Which account email should a child's accounts use?",
          options: ["The child's own", "A parent's", 'A random one'],
          answerIndex: 1,
        },
      },
      {
        title: 'Choose AI tools by traffic light',
        hook: 'Not every AI app is for kids.',
        keyPoints: [
          'Green: school-approved helpers with a parent nearby',
          'Yellow: general chatbots with linked parent accounts',
          'Red: AI companions and tools with no parental controls',
        ],
        example: 'Some AI toys and companion apps have weak or no parent controls.',
        actions: ["Sort your child's apps into green, yellow, red", 'Remove the red ones'],
        takeaway: 'A talking toy is not automatically a safe toy.',
        sources: ['https://www.internetmatters.org/resources/ai-chatbots-and-virtual-friends-how-parents-can-keep-children-safe/'],
        quiz: {
          question: 'Which is a red-light AI product?',
          options: ['School homework helper', 'AI companion app with no controls', 'Linked teen chatbot'],
          answerIndex: 1,
        },
      },
      {
        title: 'Turn on AI parental controls',
        hook: 'Controls are a seatbelt, not a driver.',
        keyPoints: [
          'Link accounts together',
          'Quiet hours, voice and image off, safety alerts',
          'Some controls do not show chat content',
        ],
        example: 'Linked parent controls can set quiet hours and alerts without reading every chat.',
        actions: ['Link accounts with your teen', 'Set quiet hours', 'Turn on alerts'],
        takeaway: 'Settings help; conversation protects.',
        sources: ['https://help.openai.com/en/articles/10500962-parental-controls-in-chatgpt'],
        quiz: {
          question: 'Can linked controls replace talking to your teen?',
          options: ['Yes', 'No', 'Only for under-13s'],
          answerIndex: 1,
        },
      },
      {
        title: 'Teach the 5 AI rules',
        hook: 'Five rules your child can remember.',
        keyPoints: [
          'AI can be wrong',
          'Never share personal details',
          'AI is a tool, not a friend',
          'Never fake real people',
          'Tell a parent, no punishment',
        ],
        example: 'Teach children to question AI answers and not treat chatbots as friends.',
        actions: ['Teach one rule per day', 'Quiz them at dinner'],
        takeaway: 'Five rules, one safe habit.',
        sources: ['https://www.internetmatters.org/resources/ai-chatbots-and-virtual-friends-how-parents-can-keep-children-safe/'],
        quiz: {
          question: 'Which is one of the 5 rules?',
          options: ['Share your school name', 'AI can be wrong', 'AI is your best friend'],
          answerIndex: 1,
        },
      },
      {
        title: 'Practice scenarios and a family safe word',
        hook: "Practice before it's real.",
        keyPoints: ['Role-play 3 scenarios', 'Agree a family safe word', 'Hang up and call back directly'],
        example: 'Criminals clone voices to pressure families into sending money. A shared code word helps.',
        actions: ['Pick a safe word today', 'Share it with grandparents'],
        takeaway: 'Two minutes now can save savings later.',
        sources: ['https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2023/03/scammers-use-ai-enhance-their-family-emergency-schemes'],
        quiz: {
          question: 'A caller sounds like your child begging for money. First step?',
          options: ['Send money', 'Hang up and call them directly', 'Post online'],
          answerIndex: 1,
        },
      },
      {
        title: 'Check in weekly, not spy daily',
        hook: 'Open questions beat secret monitoring.',
        keyPoints: [
          'Ask what was fun, strange or confusing',
          'Ask to see something they made',
          'Watch for secrecy or mood change',
        ],
        example: 'Investigators of school image-abuse cases say children need a safe adult they can tell.',
        actions: ['Pick a weekly time', 'Ask three open questions'],
        takeaway: 'Make telling you the safest thing to do.',
        sources: ['https://www.internetmatters.org/hub/guidance/talking-to-your-child-about-online-safety/'],
        quiz: {
          question: 'Best weekly approach?',
          options: ['Secret spying', 'Open questions', 'Ignore it'],
          answerIndex: 1,
        },
      },
      {
        title: 'What to do if something goes wrong',
        hook: 'Stay calm, save evidence, get help.',
        keyPoints: [
          'Thank your child for telling you',
          'Save screenshots; do not forward harmful images',
          'Report to the app, school and police when needed',
        ],
        example: 'If someone shares a harmful fake image of a child, preserve evidence and report. Do not spread it.',
        actions: ['Screenshot, do not share', 'Report to the platform and school', 'Get counselling support'],
        takeaway: 'Help first, blame never.',
        sources: ['https://www.iwf.org.uk/report/', 'https://www.missingkids.org/gethelpnow/cybertipline'],
        quiz: {
          question: 'What do you do with a harmful image of a classmate?',
          options: ['Forward it to warn others', 'Save evidence and report it', 'Delete everything and say nothing'],
          answerIndex: 1,
        },
      },
    ],
  },
  {
    title: 'Everyday People: AI Scams, Money and Privacy',
    category: 'Digital Safety',
    audience: 'Everyday adults',
    description: 'How ordinary people avoid AI-powered scams and protect their data.',
    lessons: [
      {
        title: 'Cloned-voice scams',
        hook: "That's not your daughter's voice.",
        keyPoints: ['A few seconds of audio can be cloned', 'Urgency is the trick', 'Hang up, call back, use a safe word'],
        example: 'Families have been tricked by calls that sounded exactly like a loved one.',
        actions: ['Set a family safe word', 'Never pay under pressure'],
        takeaway: 'Verify before you pay.',
        sources: ['https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2023/03/scammers-use-ai-enhance-their-family-emergency-schemes'],
        quiz: {
          question: 'First move on an urgent money call?',
          options: ['Pay', 'Hang up and call back', 'Send gift cards'],
          answerIndex: 1,
        },
      },
      {
        title: 'The 5-second rule',
        hook: 'Stop. Hang up. Verify. Never pay under pressure.',
        keyPoints: ['Slow down', 'Use a number you already know', 'Ask for the safe word'],
        example: 'AI-assisted scams rely on panic. Time is your defence.',
        actions: ['Practice the 4 steps with family'],
        takeaway: 'Pressure is the warning sign.',
        sources: ['https://www.ic3.gov/'],
        quiz: {
          question: 'Which is a scam warning sign?',
          options: ['Calm tone', 'Extreme urgency', 'Polite greeting'],
          answerIndex: 1,
        },
      },
      {
        title: 'What never to type into AI',
        hook: 'Treat a chatbot like a stranger with a good memory.',
        keyPoints: ['No ID or bank numbers', 'No medical records', 'No passwords'],
        example: 'Chats may be stored. Privacy settings matter.',
        actions: ['Review your chatbot privacy settings', 'Turn off training where possible'],
        takeaway: "If you wouldn't post it, don't paste it.",
        sources: ['https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance'],
        quiz: {
          question: 'Safe to paste?',
          options: ['Bank PIN', 'A recipe', 'Passport number'],
          answerIndex: 1,
        },
      },
      {
        title: 'Spot AI fakes',
        hook: 'Seeing is no longer believing.',
        keyPoints: ['Check the source', 'Look for odd hands, text, lighting', 'Search the claim on trusted outlets'],
        example: 'Fake images travel fast on social feeds. Check before you share.',
        actions: ['Reverse-search images', 'Check two trusted sources'],
        takeaway: 'Check before you share.',
        sources: ['https://www.bbc.com/news/reality_check'],
        quiz: {
          question: 'Before sharing a shocking video?',
          options: ['Share fast', 'Check the source', 'Add comments'],
          answerIndex: 1,
        },
      },
      {
        title: 'Test yourself: is this call real?',
        hook: 'Three calls. Which one is real?',
        keyPoints: ['Use a safe word', 'Call back', 'Never pay under pressure'],
        example: 'Practice with family using a cloned-voice story as the reveal.',
        actions: ['Run the quiz with family'],
        takeaway: 'Practice builds reflex.',
        sources: ['https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2023/03/scammers-use-ai-enhance-their-family-emergency-schemes'],
        quiz: {
          question: "Best proof it's really them?",
          options: ['Their voice', 'A pre-agreed safe word', 'Their number on caller ID'],
          answerIndex: 1,
        },
      },
    ],
  },
  {
    title: 'Companies: Safe AI at Work',
    category: 'Workplace AI',
    audience: 'Owners, managers and staff',
    description: 'Policies and drills for teams using AI tools without leaking company data.',
    lessons: [
      {
        title: 'Shadow AI at work',
        hook: 'Your staff are already using AI. Do you know which?',
        keyPoints: ['Personal accounts leak data', 'Approve a short list of tools', 'Say what data is off-limits'],
        example: 'Hosted tools can store keys and files if staff paste work into personal accounts.',
        actions: ['Survey staff AI use', 'Publish the approved list'],
        takeaway: "Approve tools, don't just ban them.",
        sources: ['https://www.ncsc.gov.uk/guidance/considerations-for-organisations-using-ai'],
        quiz: {
          question: 'What is shadow AI?',
          options: ['Unapproved AI use at work', 'A dark-mode app', 'A backup tool'],
          answerIndex: 0,
        },
      },
      {
        title: 'When API keys leak',
        hook: 'One stolen key can spend real money.',
        keyPoints: ['Keys are like credit cards', 'Set spending caps per key', 'Rotate after any breach notice'],
        example: 'Breaches of AI coding consoles have led to unauthorised charges on user accounts.',
        actions: ['Set spend limits', 'Rotate exposed keys'],
        takeaway: 'A leaked key is a stolen credit card.',
        sources: ['https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html'],
        quiz: {
          question: 'Best first action after a key-leak notice?',
          options: ['Ignore', 'Rotate keys and set limits', 'Wait a month'],
          answerIndex: 1,
        },
      },
      {
        title: 'One-page AI use policy',
        hook: 'A policy people will actually read.',
        keyPoints: ['What is allowed', 'What data is banned', 'Who to ask'],
        example: 'Short policies get followed. Long PDFs do not.',
        actions: ['Draft on one page', 'Train staff in 15 minutes'],
        takeaway: 'Short policies get followed.',
        sources: ['https://www.ncsc.gov.uk/guidance/considerations-for-organisations-using-ai'],
        quiz: {
          question: 'Best policy length?',
          options: ['40 pages', 'One page', 'None'],
          answerIndex: 1,
        },
      },
      {
        title: 'Questions for any AI vendor',
        hook: 'Ask before you buy.',
        keyPoints: ['Where is data stored?', 'Is it used for training?', 'How fast do you notify breaches?'],
        example: 'Slow breach notices leave you paying for someone else’s delay.',
        actions: ['Send the 3 questions to vendors'],
        takeaway: 'Good vendors answer quickly.',
        sources: ['https://www.ncsc.gov.uk/collection/cloud-security'],
        quiz: {
          question: 'Key vendor question?',
          options: ['Logo colour', 'Breach notification time', 'Office size'],
          answerIndex: 1,
        },
      },
      {
        title: '10-minute incident drill',
        hook: 'A key leaked. Go.',
        keyPoints: ['Who decides', 'Rotate and revoke', 'Tell affected people'],
        example: 'Run a tabletop: stolen API key, unauthorised spend, who calls whom.',
        actions: ['Run the drill twice a year'],
        takeaway: 'Practice beats panic.',
        sources: ['https://www.cisa.gov/resources-tools/resources/cybersecurity-incident-response-playbook'],
        quiz: {
          question: 'Who should lead an incident?',
          options: ['Nobody', 'A named owner', 'Everyone at once'],
          answerIndex: 1,
        },
      },
    ],
  },
  {
    title: 'Tech People: Keys, Patches and Trust',
    category: 'Cybersecurity',
    audience: 'Developers, IT and security staff',
    description: 'Hands-on hygiene: keys, patches, certificate trust and least privilege for agents. Patching only — no exploit steps.',
    lessons: [
      {
        title: 'Key hygiene',
        hook: 'API keys are passwords with a credit card attached.',
        keyPoints: ['Per-key spend caps', 'Scope and rotate keys', 'Never store keys in third-party consoles without limits'],
        example: 'Stolen provider keys have billed teams hundreds or thousands of dollars.',
        actions: ['Set a cap on each key', 'Rotate quarterly'],
        takeaway: 'Assume keys leak; limit the damage.',
        sources: ['https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html'],
        quiz: {
          question: 'What limits damage from a stolen key?',
          options: ['Long names', 'Provider spend caps', 'Dark mode'],
          answerIndex: 1,
        },
      },
      {
        title: 'Patch day (PHP and everything else)',
        hook: 'Know your versions before the news breaks.',
        keyPoints: [
          'Inventory internet-facing runtimes',
          'Apply vendor patches; upgrade end-of-life branches',
          'Review logs after a critical advisory',
        ],
        example: 'When PHP or any core runtime ships an emergency fix, patch supported versions and plan upgrades for EOL ones. Do not hunt for exploit details.',
        actions: ['Inventory versions', 'Patch or upgrade', 'Review logs'],
        takeaway: 'Primary vendor advisories first; then patch.',
        sources: ['https://www.php.net/downloads.php', 'https://cert.europa.eu/'],
        quiz: {
          question: 'What should you do with an end-of-life runtime after a critical advisory?',
          options: ['Ignore it', 'Upgrade off that branch', 'Post the exploit'],
          answerIndex: 1,
        },
      },
      {
        title: 'When a certificate authority fails',
        hook: 'Trust anchors can fail too.',
        keyPoints: ['Update browsers, Go, and CA bundles', 'Rebuild pinned binaries', 'Watch vendor distrust lists'],
        example: 'Browsers have blocked compromised CA intermediates. Update trust stores.',
        actions: ['Rebuild Go binaries', 'Update CA bundles'],
        takeaway: 'Keep trust stores current.',
        sources: ['https://wiki.mozilla.org/CA'],
        quiz: {
          question: 'Why might browsers distrust a CA?',
          options: ['Weak or compromised keys', 'Keys that are too long', 'Certificates that expired last week'],
          answerIndex: 0,
        },
      },
      {
        title: 'Read advisories like a pro',
        hook: 'Confirmed, reported, or rumour?',
        keyPoints: ['Disclosed is not patched', 'Check exploited in the wild', 'Prefer vendor advisories'],
        example: 'Early social posts often disagree with the vendor. Wait for the advisory.',
        actions: ['Use four questions: affected? fixed? exploited? what now?'],
        takeaway: 'Primary sources first.',
        sources: ['https://nvd.nist.gov/', 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog'],
        quiz: {
          question: 'Best source?',
          options: ['Social post', 'Vendor advisory', 'Screenshot'],
          answerIndex: 1,
        },
      },
      {
        title: 'Agents and automation safety',
        hook: 'Give agents the smallest keys possible.',
        keyPoints: ['Least privilege', 'Scoped tokens', 'Log every action'],
        example: 'AI agents with admin keys can spend money or change prod as fast as a human attacker.',
        actions: ['Audit agent permissions'],
        takeaway: 'Small keys, small damage.',
        sources: ['https://owasp.org/www-project-top-10-for-large-language-model-applications/'],
        quiz: {
          question: 'Agent access should be?',
          options: ['Admin', 'Least privilege', 'Shared'],
          answerIndex: 1,
        },
      },
    ],
  },
];
