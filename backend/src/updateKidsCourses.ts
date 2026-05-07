import dotenv from 'dotenv';
import { Course } from './models/Course';
import connectDB from './config/db';
dotenv.config();

const mkLesson = (title: string, videoUrl: string, duration: number, animationType = '2D Animation') => ({
  title, type: 'video', videoUrl, duration, animationType, ageCategory: 'Children under 10'
});

const mkQuiz = (title: string, questions: any[]) => ({
  title, type: 'quiz', isAssignment: true, assignmentQuestions: questions
});

const mkMcq = (q: string, opts: string[], correct: number) => ({
  questionText: q, type: 'mcq', options: opts, correctOptionIndex: correct, points: 10
});

const mkExam = (title: string, questions: any[]) => ({
  title, type: 'assignment', isAssignment: true, requiredAssignment: true,
  assignmentConfig: { mode: 'exam', timeLimit: 45, disableRightClick: true },
  assignmentQuestions: questions
});

const updates: { title: string; modules: any[] }[] = [
  {
    title: 'English Foundation',
    modules: [
      {
        title: 'MODULE 1: Alphabet & Phonics',
        lessons: [
          mkLesson('Lesson 1: Alphabet A–Z', 'https://www.youtube.com/watch?v=75p-N9YKqNo', 3),
          mkLesson('Lesson 2: Letter Sounds', 'https://www.youtube.com/watch?v=ffeZXPtTGC4', 4, 'Cartoon'),
          mkLesson('Lesson 3: Vowels and Consonants', 'https://www.youtube.com/watch?v=arQxkdRYY_U', 3),
          mkLesson('Lesson 4: Simple Words (3-letter)', 'https://www.youtube.com/watch?v=BELlZKpi1Zs', 4),
          mkLesson('Lesson 5: Reading Short Sentences', 'https://www.youtube.com/watch?v=OFLmFQRDTjo', 3),
          mkQuiz('Module 1 Quiz: Phonics', [
            mkMcq("Which letter comes after 'B'?", ['A','C','D','E'], 1),
            mkMcq("Which of these is a vowel?", ['B','C','A','D'], 2),
            mkMcq("The word 'cat' has how many letters?", ['2','3','4','5'], 1),
            mkMcq("Which word rhymes with 'dog'?", ['cat','log','hat','sit'], 1),
          ])
        ]
      },
      {
        title: 'MODULE 2: Grammar Basics',
        lessons: [
          mkLesson('Nouns: Naming Things', 'https://www.youtube.com/watch?v=8mS5Ssh536w', 3),
          mkLesson('Verbs: Action Words', 'https://www.youtube.com/watch?v=ineCCpqpJrM', 4),
          mkLesson('Adjectives: Describing Words', 'https://www.youtube.com/watch?v=6f3aPjKBaRY', 3),
          mkLesson('Pronouns: He, She, They', 'https://www.youtube.com/watch?v=leTozEqSyF4', 3),
          mkLesson('Simple Sentences', 'https://www.youtube.com/watch?v=yRb_CtFQMlY', 4),
          mkQuiz('Module 2 Quiz: Grammar', [
            mkMcq("Which is a noun?", ['run','happy','dog','quickly'], 2),
            mkMcq("Which is a verb?", ['apple','jump','blue','house'], 1),
            mkMcq("'She is ___ girl.' Fill in the blank.", ['a','an','the','good'], 0),
            mkMcq("Which is an adjective?", ['run','cat','big','go'], 2),
          ])
        ]
      },
      {
        title: 'FINAL EXAM: English Foundation',
        lessons: [
          mkExam('Final Exam (30 Questions)', [
            mkMcq("What is the first letter of the alphabet?", ['B','A','C','D'], 1),
            mkMcq("How many vowels are there in English?", ['3','4','5','6'], 2),
            mkMcq("Which word is a verb?", ['cat','big','run','apple'], 2),
            mkMcq("'The cat is ___.' (describe)", ['run','sat','big','go'], 2),
            mkMcq("Which word rhymes with 'hat'?", ['dog','cat','sit','cup'], 1),
            ...Array(25).fill(null).map((_, i) => mkMcq(`Reading question ${i+6}: Choose correct option.`, ['Option A','Option B','Option C','Option D'], i % 4))
          ])
        ]
      }
    ]
  },
  {
    title: 'Mathematics Foundation',
    modules: [
      {
        title: 'MODULE 1: Numbers & Counting',
        lessons: [
          mkLesson('Counting 1–10', 'https://www.youtube.com/watch?v=D0Ajq682yrA', 2),
          mkLesson('Counting 1–100', 'https://www.youtube.com/watch?v=1TBRuBEb7dM', 4),
          mkLesson('Number Recognition', 'https://www.youtube.com/watch?v=e0dJWfQHF8Y', 3),
          mkLesson('Bigger and Smaller', 'https://www.youtube.com/watch?v=gQ6GE3TQMWI', 3),
          mkLesson('Odd and Even Numbers', 'https://www.youtube.com/watch?v=WuLSzJR5-MA', 4),
          mkQuiz('Module 1 Quiz: Numbers', [
            mkMcq("What comes after 5?", ['4','6','7','3'], 1),
            mkMcq("Which number is bigger: 8 or 3?", ['3','8','5','1'], 1),
            mkMcq("Is 4 odd or even?", ['Odd','Even','Neither','Both'], 1),
            mkMcq("Count the stars: ⭐⭐⭐", ['2','3','4','5'], 1),
          ])
        ]
      },
      {
        title: 'MODULE 2: Addition & Subtraction',
        lessons: [
          mkLesson('Simple Addition', 'https://www.youtube.com/watch?v=uK7YmBOC92A', 4),
          mkLesson('Simple Subtraction', 'https://www.youtube.com/watch?v=tVDKPe7LwTU', 3),
          mkLesson('Number Line', 'https://www.youtube.com/watch?v=PfBRxGuvOhI', 3),
          mkLesson('Word Problems', 'https://www.youtube.com/watch?v=xge9_LfK_6c', 4),
          mkLesson('Mental Maths', 'https://www.youtube.com/watch?v=GEzYaUEqNdE', 3),
          mkQuiz('Module 2 Quiz: Add & Subtract', [
            mkMcq("2 + 3 = ?", ['4','5','6','3'], 1),
            mkMcq("5 - 2 = ?", ['2','3','4','1'], 1),
            mkMcq("1 + 1 = ?", ['1','2','3','4'], 1),
            mkMcq("10 - 5 = ?", ['4','6','5','3'], 2),
          ])
        ]
      },
      {
        title: 'MODULE 3: Shapes & Geometry',
        lessons: [
          mkLesson('2D Shapes', 'https://www.youtube.com/watch?v=OV2Ojm_QhJg', 3),
          mkLesson('3D Shapes', 'https://www.youtube.com/watch?v=jMp5vPpKJns', 4),
          mkLesson('Patterns', 'https://www.youtube.com/watch?v=9VbMC0v6j4o', 3),
          mkLesson('Symmetry', 'https://www.youtube.com/watch?v=lMGAP_1R5WM', 3),
          mkQuiz('Module 3 Quiz: Shapes', [
            mkMcq("A circle has how many sides?", ['0','1','2','3'], 0),
            mkMcq("Which shape has 4 equal sides?", ['Triangle','Circle','Square','Pentagon'], 2),
            mkMcq("A ball is a ___ shape.", ['2D','3D','flat','line'], 1),
          ])
        ]
      },
      {
        title: 'MODULE 4: Time & Measurement',
        lessons: [
          mkLesson('Days of the Week', 'https://www.youtube.com/watch?v=mXMofxtDPUQ', 3),
          mkLesson('Months of the Year', 'https://www.youtube.com/watch?v=Fe9bnYRaooY', 4),
          mkLesson('Telling Time', 'https://www.youtube.com/watch?v=XVXJXbPMt4A', 4),
          mkLesson('Length & Weight', 'https://www.youtube.com/watch?v=3JLFGkLj7p0', 3),
          mkLesson('Money Basics', 'https://www.youtube.com/watch?v=wQ_q3uJKLkQ', 4),
          mkQuiz('Module 4 Quiz: Time', [
            mkMcq("How many days are in a week?", ['5','6','7','8'], 2),
            mkMcq("How many months in a year?", ['10','11','12','13'], 2),
            mkMcq("Which comes first: Monday or Friday?", ['Friday','Monday','Sunday','Wednesday'], 1),
          ])
        ]
      },
      {
        title: 'FINAL EXAM: Mathematics Foundation',
        lessons: [
          mkExam('Final Maths Exam (30 Questions)', [
            mkMcq("3 + 4 = ?", ['6','7','8','5'], 1),
            mkMcq("How many sides does a triangle have?", ['2','3','4','5'], 1),
            mkMcq("10 - 3 = ?", ['6','7','8','5'], 1),
            ...Array(27).fill(null).map((_, i) => mkMcq(`Maths question ${i+4}`, ['A','B','C','D'], i % 4))
          ])
        ]
      }
    ]
  },
  {
    title: 'Science Explorers',
    modules: [
      {
        title: 'MODULE 1: Living Things',
        lessons: [
          mkLesson('Animals Around Us', 'https://www.youtube.com/watch?v=wCfWmlnJl-A', 4),
          mkLesson('All About Plants', 'https://www.youtube.com/watch?v=dQu-LWMSZvM', 3),
          mkLesson('The Human Body', 'https://www.youtube.com/watch?v=xGILgV8VrVE', 4),
          mkLesson('Habitats', 'https://www.youtube.com/watch?v=0vGaB_qOjGI', 3),
          mkLesson('The Food Chain', 'https://www.youtube.com/watch?v=O-zoMGSEjO0', 4),
          mkQuiz('Module 1 Quiz: Living Things', [
            mkMcq("Which of these is a mammal?", ['Snake','Eagle','Dog','Fish'], 2),
            mkMcq("Plants make food using ___.", ['Water','Sunlight','Both','Neither'], 2),
            mkMcq("Where do fish live?", ['Desert','Forest','Ocean','Sky'], 2),
          ])
        ]
      },
      {
        title: 'MODULE 2: Earth & Space',
        lessons: [
          mkLesson('Weather', 'https://www.youtube.com/watch?v=YbAWny7FV3w', 3),
          mkLesson('Seasons', 'https://www.youtube.com/watch?v=kBMoBX_2W3k', 4),
          mkLesson('Day and Night', 'https://www.youtube.com/watch?v=KNZ_2VGVFoQ', 3),
          mkLesson('Solar System', 'https://www.youtube.com/watch?v=libKVRa01L8', 4),
          mkLesson('Earth Basics', 'https://www.youtube.com/watch?v=YBEFfnNZOhI', 3),
          mkQuiz('Module 2 Quiz: Earth & Space', [
            mkMcq("How many planets are in our solar system?", ['7','8','9','10'], 1),
            mkMcq("The Sun is a ___.", ['Planet','Star','Moon','Comet'], 1),
            mkMcq("Which season is hottest?", ['Winter','Autumn','Summer','Spring'], 2),
          ])
        ]
      },
      {
        title: 'MODULE 3: Materials & Energy',
        lessons: [
          mkLesson('Solid, Liquid, Gas', 'https://www.youtube.com/watch?v=AN4cCgKgCb4', 4),
          mkLesson('Light', 'https://www.youtube.com/watch?v=QjIcOQbS3JE', 3),
          mkLesson('Sound', 'https://www.youtube.com/watch?v=KXMG_WQGkko', 4),
          mkLesson('Heat', 'https://www.youtube.com/watch?v=vBc7bDJTEmY', 3),
          mkLesson('The Water Cycle', 'https://www.youtube.com/watch?v=al-do-HGuIk', 4),
          mkQuiz('Module 3 Quiz: Materials', [
            mkMcq("Ice is a ___.", ['Gas','Liquid','Solid','Energy'], 2),
            mkMcq("Sound travels through ___.", ['Nothing','Air','Space only','Light'], 1),
            mkMcq("Water turns to steam when ___.", ['Frozen','Heated','Mixed','Colored'], 1),
          ])
        ]
      },
      {
        title: 'FINAL EXAM: Science Explorers',
        lessons: [
          mkExam('Final Science Exam (30 Questions)', [
            mkMcq("Which animal lays eggs?", ['Cat','Dog','Chicken','Cow'], 2),
            mkMcq("Earth orbits the ___.", ['Moon','Sun','Mars','Stars'], 1),
            mkMcq("Water is a ___.", ['Solid','Gas','Liquid','Energy'], 2),
            ...Array(27).fill(null).map((_, i) => mkMcq(`Science question ${i+4}`, ['A','B','C','D'], i % 4))
          ])
        ]
      }
    ]
  },
  {
    title: 'Digital & Creative Skills',
    modules: [
      {
        title: 'MODULE 1: Computer Basics',
        lessons: [
          mkLesson('Parts of a Computer', 'https://www.youtube.com/watch?v=Akfi90lS60k', 3),
          mkLesson('Mouse Skills', 'https://www.youtube.com/watch?v=6ArOCOo0v2c', 3),
          mkLesson('Keyboard Basics', 'https://www.youtube.com/watch?v=GbFZtUQVTnU', 4),
          mkLesson('Typing Practice', 'https://www.youtube.com/watch?v=F-EakLnHGAI', 4),
          mkLesson('Opening Applications', 'https://www.youtube.com/watch?v=QQRRzmyAFkE', 3),
          mkQuiz('Module 1 Quiz: Computer Basics', [
            mkMcq("What is used to type on a computer?", ['Mouse','Screen','Keyboard','Speaker'], 2),
            mkMcq("What does a monitor display?", ['Sound','Images','Data','Files'], 1),
            mkMcq("What is used to click on screen items?", ['Keyboard','Mouse','Printer','Speaker'], 1),
          ])
        ]
      },
      {
        title: 'MODULE 2: Internet Safety',
        lessons: [
          mkLesson('Safe Internet Use', 'https://www.youtube.com/watch?v=YekFOcCFVBo', 3),
          mkLesson('Strong Passwords', 'https://www.youtube.com/watch?v=aEmXR3DY2qQ', 3),
          mkLesson('Stranger Danger Online', 'https://www.youtube.com/watch?v=1yI3OqF_b8k', 4),
          mkLesson('Safe Websites', 'https://www.youtube.com/watch?v=l1mAS1sS1sE', 3),
          mkLesson('Asking Parents for Help', 'https://www.youtube.com/watch?v=3pSFAbJFhyg', 3),
          mkQuiz('Module 2 Quiz: Internet Safety', [
            mkMcq("Should you share your password?", ['Yes','No','Sometimes','Always'], 1),
            mkMcq("If a stranger messages you online, you should ___.", ['Reply','Ignore and tell a parent','Share info','Meet them'], 1),
          ])
        ]
      },
      {
        title: 'MODULE 3: Creativity & Coding Logic',
        lessons: [
          mkLesson('Drawing Shapes Digitally', 'https://www.youtube.com/watch?v=QOxY3Lk3P-4', 3),
          mkLesson('Patterns & Sequences', 'https://www.youtube.com/watch?v=9VbMC0v6j4o', 3),
          mkLesson('Directions & Algorithms', 'https://www.youtube.com/watch?v=OAx_6-wdslM', 4),
          mkLesson('Logic Games', 'https://www.youtube.com/watch?v=m_CWhfu5PqQ', 3),
          mkQuiz('Module 3 Quiz: Coding Logic', [
            mkMcq("An algorithm is a ___.", ['Drawing','Set of steps','Color','Number'], 1),
            mkMcq("Which comes first in a sequence: Step 1 or Step 3?", ['Step 3','Step 1','Neither','Both'], 1),
          ])
        ]
      },
      {
        title: 'FINAL EXAM: Digital & Creative Skills',
        lessons: [
          mkExam('Final Digital Exam (30 Questions)', [
            mkMcq("What part of a computer displays images?", ['Keyboard','Monitor','Mouse','Speaker'], 1),
            mkMcq("Should you talk to strangers online?", ['Yes','No','Maybe','Always'], 1),
            mkMcq("An algorithm is a list of ___.", ['Colors','Steps','Numbers','Games'], 1),
            ...Array(27).fill(null).map((_, i) => mkMcq(`Digital question ${i+4}`, ['A','B','C','D'], i % 4))
          ])
        ]
      }
    ]
  },
  {
    title: 'Emotional Wellness & Stress Management',
    modules: [
      {
        title: 'MODULE 1: Understanding Feelings',
        lessons: [
          mkLesson('Happy, Sad, Angry, Excited', 'https://www.youtube.com/watch?v=ZxfJicfyCdg', 3),
          mkLesson('Understanding Emotions', 'https://www.youtube.com/watch?v=nKH7WC3-7D4', 4),
          mkLesson('Talking About Feelings', 'https://www.youtube.com/watch?v=iW0SsM5IC4g', 3),
          mkLesson('Being Kind to Others', 'https://www.youtube.com/watch?v=1kUy0wBZ1-w', 3),
          mkLesson('Understanding Friendship', 'https://www.youtube.com/watch?v=8f9K8gj0dKo', 4),
          mkQuiz('Module 1 Quiz: Feelings', [
            mkMcq("How do you feel when you get a gift?", ['Sad','Angry','Happy','Scared'], 2),
            mkMcq("Being kind to others means ___.", ['Hitting them','Helping them','Ignoring them','Laughing at them'], 1),
          ])
        ]
      },
      {
        title: 'MODULE 2: Calmness & Stress Basics',
        lessons: [
          mkLesson('What Makes Us Worried', 'https://www.youtube.com/watch?v=2fqV8zJNLWs', 3),
          mkLesson('Calm Breathing', 'https://www.youtube.com/watch?v=RVA2N6tX2cg', 3),
          mkLesson('Taking Breaks', 'https://www.youtube.com/watch?v=mZHpyoLxgmo', 3),
          mkLesson('Quiet Time', 'https://www.youtube.com/watch?v=F2JSTgpIFB8', 4),
          mkLesson('Asking for Help', 'https://www.youtube.com/watch?v=6pRAbJFhyg', 3),
          mkQuiz('Module 2 Quiz: Calmness', [
            mkMcq("When feeling worried, you can ___.", ['Run away','Breathe slowly','Yell','Hide'], 1),
            mkMcq("Who can you ask for help?", ['Nobody','A parent or teacher','A stranger','Your toy'], 1),
          ])
        ]
      },
      {
        title: 'MODULE 3: Confidence & Positive Habits',
        lessons: [
          mkLesson('Believing in Yourself', 'https://www.youtube.com/watch?v=vF9qjNtJfSI', 3),
          mkLesson('Healthy Daily Routines', 'https://www.youtube.com/watch?v=1l0xMpXN-Kk', 4),
          mkLesson('Sleep & Rest', 'https://www.youtube.com/watch?v=h6Ek9GCvUAQ', 3),
          mkLesson('Exercise & Movement', 'https://www.youtube.com/watch?v=d3LkgyEUnKo', 4),
          mkLesson('Positive Thinking', 'https://www.youtube.com/watch?v=Xcf3FU_QKKE', 3),
          mkQuiz('Module 3 Quiz: Positive Habits', [
            mkMcq("How many hours of sleep do children need?", ['4','6','8-10','12'], 2),
            mkMcq("Exercise is ___.", ['Bad for you','Good for you','Boring','Dangerous'], 1),
          ])
        ]
      },
      {
        title: 'FINAL EXAM: Emotional Wellness',
        lessons: [
          mkExam('Final Wellness Exam (30 Questions)', [
            mkMcq("What should you do when angry?", ['Hit someone','Breathe and calm down','Run away','Cry all day'], 1),
            mkMcq("Kindness means ___.", ['Being mean','Helping others','Ignoring people','Shouting'], 1),
            mkMcq("Sleep helps you ___.", ['Stay weak','Grow and rest','Feel sad','Get sick'], 1),
            ...Array(27).fill(null).map((_, i) => mkMcq(`Wellness question ${i+4}`, ['A','B','C','D'], i % 4))
          ])
        ]
      }
    ]
  },
  {
    title: 'Young Business & Money Literacy',
    modules: [
      {
        title: 'MODULE 1: Understanding Money',
        lessons: [
          mkLesson('What Is Money?', 'https://www.youtube.com/watch?v=0M8vWf2mSrs', 4),
          mkLesson('Coins and Notes', 'https://www.youtube.com/watch?v=dHRD_ItjLQs', 3),
          mkLesson('Saving Money', 'https://www.youtube.com/watch?v=_OEfgY9lKAc', 3),
          mkLesson('Needs vs Wants', 'https://www.youtube.com/watch?v=W_yBFkO1X-Q', 4),
          mkLesson('Smart Spending', 'https://www.youtube.com/watch?v=MmvEGX6YB1E', 3),
          mkQuiz('Module 1 Quiz: Money', [
            mkMcq("Money is used to ___.", ['Eat directly','Buy things','Play with','Swim in'], 1),
            mkMcq("Saving means ___.", ['Spending all money','Keeping money for later','Giving it away','Losing it'], 1),
            mkMcq("A 'need' is something you ___.", ['Want','Must have to live','Like to have','Play with'], 1),
          ])
        ]
      },
      {
        title: 'MODULE 2: Small Business Basics',
        lessons: [
          mkLesson('What Is a Business?', 'https://www.youtube.com/watch?v=JBnM2MrxnoI', 4),
          mkLesson('Selling Things', 'https://www.youtube.com/watch?v=l0E4FQJOe8g', 3),
          mkLesson('Helping Customers', 'https://www.youtube.com/watch?v=LqtJhDdmPPU', 3),
          mkLesson('Teamwork', 'https://www.youtube.com/watch?v=HFSHHNafnKY', 4),
          mkLesson('Simple Problem Solving', 'https://www.youtube.com/watch?v=cpkdaWbFp5g', 3),
          mkQuiz('Module 2 Quiz: Business', [
            mkMcq("A business sells ___.", ['Nothing','Goods or services','Air','Friendship'], 1),
            mkMcq("Good teamwork means ___.", ['Working alone','Helping each other','Fighting','Ignoring others'], 1),
          ])
        ]
      },
      {
        title: 'MODULE 3: Creativity & Entrepreneurship',
        lessons: [
          mkLesson('Creating New Ideas', 'https://www.youtube.com/watch?v=qrSMV-DzEeM', 3),
          mkLesson('Making Simple Products', 'https://www.youtube.com/watch?v=xPRzGH0mpDs', 4),
          mkLesson('Art and Business', 'https://www.youtube.com/watch?v=N_9kHfxLFuU', 3),
          mkLesson('Saving for Goals', 'https://www.youtube.com/watch?v=_OEfgY9lKAc', 3),
          mkLesson('Dream Projects', 'https://www.youtube.com/watch?v=2tNhIXXzJsA', 4),
          mkQuiz('Module 3 Quiz: Entrepreneurship', [
            mkMcq("An entrepreneur is someone who ___.", ['Does nothing','Creates a business','Spends all money','Stays home'], 1),
            mkMcq("Saving for a goal means ___.", ['Spending now','Keeping money for something you want','Giving money away','Forgetting about money'], 1),
          ])
        ]
      },
      {
        title: 'FINAL EXAM: Young Business & Money Literacy',
        lessons: [
          mkExam('Final Business Exam (30 Questions)', [
            mkMcq("What is money used for?", ['Eating','Buying things','Swimming','Playing only'], 1),
            mkMcq("A business provides ___.", ['Nothing','Products or services','Free items only','Air'], 1),
            mkMcq("Saving means ___.", ['Spending everything','Keeping money for later','Losing money','Giving away all money'], 1),
            ...Array(27).fill(null).map((_, i) => mkMcq(`Business question ${i+4}`, ['A','B','C','D'], i % 4))
          ])
        ]
      }
    ]
  }
];

const run = async () => {
  await connectDB();
  for (const update of updates) {
    const result = await Course.findOneAndUpdate(
      { title: update.title },
      { $set: { modules: update.modules } },
      { new: true }
    );
    if (result) {
      console.log(`✅ Updated: ${update.title} — ${result.modules.length} modules`);
    } else {
      console.log(`⚠️  Not found: ${update.title}`);
    }
  }
  console.log('\n✨ All kids courses updated!');
  process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
