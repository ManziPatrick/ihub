import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { Question } from './models/Question';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedEnglishCourses = async () => {
  try {
    await connectDB();

    console.log('📚 Seeding English courses...');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ No admin user found. Please run npm run seed first.');
      process.exit(1);
    }

    const englishLevel1Modules = [
      {
        title: "Module 1: Greetings & Introductions",
        description: "Learn how to say hello, goodbye, and introduce yourself.",
        lessons: [
          {
            title: "Basic Greetings",
            content: "<h1>Greetings</h1><p>Learn formal and informal ways to greet people in English.</p>",
            duration: 15,
            type: "article"
          },
          {
            title: "Quiz: Greetings Mastery",
            content: "Test your knowledge on greetings.",
            duration: 10,
            type: "quiz"
          }
        ]
      },
      {
        title: "Module 2: Everyday Vocabulary",
        description: "Common nouns for food, colors, and family members.",
        lessons: [
          {
            title: "Vocabulary Basics",
            content: "<h1>Everyday Words</h1><p>Essential vocabulary you will use every day.</p>",
            duration: 20,
            type: "video",
            videoUrl: "https://www.youtube.com/watch?v=ZfO34-580Dk"
          },
          {
            title: "Quiz: Vocabulary Challenge",
            content: "Test your vocabulary.",
            duration: 15,
            type: "quiz"
          }
        ]
      },
      {
        title: "Module 3: Basic Grammar (To Be)",
        description: "Using the verb 'to be'.",
        lessons: [
          {
            title: "The Verb To Be",
            content: "<h1>I am, You are, He is</h1><p>Learn the foundational verb of English grammar.</p>",
            duration: 25,
            type: "article"
          },
          {
            title: "Quiz: Grammar Basics",
            content: "Test your grammar skills.",
            duration: 15,
            type: "quiz"
          }
        ]
      },
      {
        title: "Module 4: Simple Conversations",
        description: "Asking for directions and ordering food.",
        lessons: [
          {
            title: "Conversational English",
            content: "<h1>Talking to people</h1><p>Practical phrases for everyday situations.</p>",
            duration: 25,
            type: "video",
            videoUrl: "https://www.youtube.com/watch?v=F03fL56QZ2Y"
          },
          {
            title: "Quiz: Conversation Skills",
            content: "Test your conversational English.",
            duration: 15,
            type: "quiz"
          }
        ]
      }
    ];

    const englishLevel2Modules = [
      {
        title: "Module 1: Past and Future Tenses",
        description: "Talking about yesterday and tomorrow.",
        lessons: [
          {
            title: "Time Travel in Grammar",
            content: "<h1>Tenses</h1><p>Mastering the past simple and future simple tenses.</p>",
            duration: 30,
            type: "article"
          },
          {
            title: "Quiz: Tenses Mastery",
            content: "Test your knowledge on tenses.",
            duration: 15,
            type: "quiz"
          }
        ]
      },
      {
        title: "Module 2: Workplace Communication",
        description: "Writing basic emails and making polite requests.",
        lessons: [
          {
            title: "Professional English",
            content: "<h1>At the Office</h1><p>How to communicate effectively in a professional setting.</p>",
            duration: 25,
            type: "video",
            videoUrl: "https://www.youtube.com/watch?v=3-5ePq_x5-c"
          },
          {
            title: "Quiz: Workplace English",
            content: "Test your professional communication skills.",
            duration: 15,
            type: "quiz"
          }
        ]
      },
      {
        title: "Module 3: Expressing Opinions",
        description: "How to agree, disagree, and share thoughts politely.",
        lessons: [
          {
            title: "Debates and Discussions",
            content: "<h1>Sharing Thoughts</h1><p>Phrases for agreeing and disagreeing respectfully.</p>",
            duration: 20,
            type: "article"
          },
          {
            title: "Quiz: Opinion Phrasing",
            content: "Test your ability to express opinions.",
            duration: 15,
            type: "quiz"
          }
        ]
      },
      {
        title: "Module 4: Advanced Vocabulary & Idioms",
        description: "Common English idioms and advanced phrasing.",
        lessons: [
          {
            title: "Idioms Unlocked",
            content: "<h1>Break the Ice</h1><p>Learn common idiomatic expressions used by native speakers.</p>",
            duration: 20,
            type: "video",
            videoUrl: "https://www.youtube.com/watch?v=Y0-Y-w6U8oQ"
          },
          {
            title: "Quiz: Idioms Challenge",
            content: "Test your idiom knowledge.",
            duration: 15,
            type: "quiz"
          }
        ]
      }
    ];

    const coursesToSeed = [
      {
        title: "English Level 1 (Beginner)",
        description: "Absolute beginners course learning basic vocabulary, greetings, and grammar.",
        thumbnail: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Beginner",
        category: "General",
        status: "published",
        modules: englishLevel1Modules
      },
      {
        title: "English Level 2 (Intermediate)",
        description: "Learners looking to improve conversational fluency, grammar, and workplace English.",
        thumbnail: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Intermediate",
        category: "General",
        status: "published",
        modules: englishLevel2Modules
      }
    ];

    const english1Questions = [
      // Mod 1
      [
        { questionText: "How do you say hello in the morning?", options: ["Good morning", "Good night", "Goodbye", "See you"], correctOptionIndex: 0, explanation: "Morning greetings are 'Good morning'." },
        { questionText: "Which of these is an informal greeting?", options: ["Good afternoon", "How do you do?", "Hey there!", "Pleased to meet you"], correctOptionIndex: 2, explanation: "'Hey there!' is casual." },
        { questionText: "What is a common response to 'How are you?'", options: ["I am a teacher", "I am fine, thank you", "I am from Rwanda", "My name is John"], correctOptionIndex: 1, explanation: "You respond with how you feel." },
        { questionText: "How do you say farewell at the end of the day?", options: ["Good morning", "Hello", "Good night", "Welcome"], correctOptionIndex: 2, explanation: "Good night is a farewell." },
        { questionText: "When meeting someone for the first time, you say:", options: ["What's up?", "Nice to meet you.", "Goodbye.", "I am tired."], correctOptionIndex: 1, explanation: "'Nice to meet you' is polite for introductions." }
      ],
      // Mod 2
      [
        { questionText: "Which of these is a fruit?", options: ["Carrot", "Apple", "Potato", "Onion"], correctOptionIndex: 1, explanation: "Apple is a fruit." },
        { questionText: "What color is the sky on a clear day?", options: ["Green", "Red", "Blue", "Yellow"], correctOptionIndex: 2, explanation: "The sky is blue." },
        { questionText: "Your mother's brother is your:", options: ["Uncle", "Aunt", "Cousin", "Grandfather"], correctOptionIndex: 0, explanation: "Mother's brother is an uncle." },
        { questionText: "Which word means 'very big'?", options: ["Tiny", "Small", "Huge", "Short"], correctOptionIndex: 2, explanation: "Huge means very big." },
        { questionText: "What do you drink in the morning?", options: ["Bread", "Coffee", "Meat", "Rice"], correctOptionIndex: 1, explanation: "Coffee is a common morning drink." }
      ],
      // Mod 3
      [
        { questionText: "Fill in the blank: 'I ___ happy today.'", options: ["is", "am", "are", "be"], correctOptionIndex: 1, explanation: "The pronoun 'I' takes 'am'." },
        { questionText: "Fill in the blank: 'She ___ a student.'", options: ["am", "are", "is", "be"], correctOptionIndex: 2, explanation: "The pronoun 'She' takes 'is'." },
        { questionText: "Fill in the blank: 'They ___ playing football.'", options: ["is", "am", "are", "was"], correctOptionIndex: 2, explanation: "The pronoun 'They' takes 'are'." },
        { questionText: "Which sentence is correct?", options: ["He are tall.", "We is tall.", "I am tall.", "You is tall."], correctOptionIndex: 2, explanation: "'I am' is grammatically correct." },
        { questionText: "Negative form: 'We are not late.' Which is the contraction?", options: ["We aren't late.", "We isn't late.", "We am not late.", "We don't late."], correctOptionIndex: 0, explanation: "'Are not' contracts to 'aren't'." }
      ],
      // Mod 4
      [
        { questionText: "How do you politely ask for water?", options: ["Give me water.", "I want water now.", "Could I have some water, please?", "Water!"], correctOptionIndex: 2, explanation: "'Could I have...' is a polite request." },
        { questionText: "If you don't know the way, you ask:", options: ["Where am I?", "Can you tell me the way to the station?", "Give me directions.", "I am lost."], correctOptionIndex: 1, explanation: "Asking politely for directions." },
        { questionText: "How much is this?", options: ["It is 5 dollars.", "I am 5 years old.", "It is tomorrow.", "It is blue."], correctOptionIndex: 0, explanation: "This questions asks for a price." },
        { questionText: "What time is it?", options: ["It is raining.", "It is Monday.", "It is 3 o'clock.", "It is far."], correctOptionIndex: 2, explanation: "This questions asks for time." },
        { questionText: "Where is the bathroom?", options: ["It is 5 dollars.", "Down the hall on the left.", "I am fine.", "See you later."], correctOptionIndex: 1, explanation: "Provides directions." }
      ]
    ];

    const english2Questions = [
      // Mod 1
      [
        { questionText: "Past tense of 'go' is:", options: ["Goed", "Gone", "Went", "Going"], correctOptionIndex: 2, explanation: "'Went' is the simple past tense of 'go'." },
        { questionText: "Future tense of 'eat' is:", options: ["Will eat", "Ate", "Eaten", "Eating"], correctOptionIndex: 0, explanation: "'Will eat' expresses future action." },
        { questionText: "Fill in the blank: 'Yesterday, she ___ a book.'", options: ["readed", "reads", "read", "will read"], correctOptionIndex: 2, explanation: "'Read' is the past tense form." },
        { questionText: "Which sentence refers to the future?", options: ["I went to the store.", "I am going to the store tomorrow.", "I go to the store every day.", "I have gone to the store."], correctOptionIndex: 1, explanation: "'Tomorrow' indicates future." },
        { questionText: "Past continuous: 'I ___ watching TV when the phone rang.'", options: ["am", "was", "were", "is"], correctOptionIndex: 1, explanation: "'I' takes 'was' in the past continuous." }
      ],
      // Mod 2
      [
        { questionText: "Which email sign-off is most professional?", options: ["Catch ya later", "Love", "Best regards", "Peace out"], correctOptionIndex: 2, explanation: "'Best regards' is standard professional closing." },
        { questionText: "How to start a formal email?", options: ["Hey there", "Dear Mr. Smith,", "What's up,", "Yo Smith,"], correctOptionIndex: 1, explanation: "'Dear' is a formal salutation." },
        { questionText: "Polite way to decline an invitation:", options: ["No, I won't come.", "I can't.", "Thank you, but I am unable to attend.", "I am busy."], correctOptionIndex: 2, explanation: "A polite decline includes a thank you." },
        { questionText: "If you need a file, you write:", options: ["Send the file now.", "I need the file.", "Could you please send me the file?", "Give file."], correctOptionIndex: 2, explanation: "'Could you please' is polite." },
        { questionText: "What does 'CC' mean in an email?", options: ["Carbon Copy", "Correct Copy", "Computer Copy", "Catch Copy"], correctOptionIndex: 0, explanation: "CC stands for Carbon Copy." }
      ],
      // Mod 3
      [
        { questionText: "How to respectfully disagree?", options: ["You are wrong.", "I see your point, but I think differently.", "That's a bad idea.", "No way."], correctOptionIndex: 1, explanation: "Acknowledging their point first is respectful." },
        { questionText: "Phrase to agree strongly:", options: ["I suppose so.", "I couldn't agree more.", "Maybe.", "I don't know."], correctOptionIndex: 1, explanation: "Means 100% agreement." },
        { questionText: "To ask for an opinion, you say:", options: ["Tell me now.", "What are your thoughts on this?", "Speak.", "Do you know?"], correctOptionIndex: 1, explanation: "Polite way to ask for input." },
        { questionText: "To express your opinion, start with:", options: ["In my opinion...", "You should know...", "Listen to me...", "The fact is..."], correctOptionIndex: 0, explanation: "Clearly states it's a personal view." },
        { questionText: "If you are unsure, you say:", options: ["I am right.", "I'm not entirely sure about that.", "You are wrong.", "Definitely."], correctOptionIndex: 1, explanation: "Polite expression of doubt." }
      ],
      // Mod 4
      [
        { questionText: "What does 'Break the ice' mean?", options: ["To break frozen water", "To initiate a conversation", "To be cold", "To fall down"], correctOptionIndex: 1, explanation: "It means starting a conversation to relieve tension." },
        { questionText: "If someone is 'Under the weather', they are:", options: ["Standing in rain", "Feeling ill", "Happy", "Angry"], correctOptionIndex: 1, explanation: "It's an idiom for being sick." },
        { questionText: "What does 'Bite the bullet' mean?", options: ["To eat metal", "To face a difficult situation bravely", "To run away", "To shoot a gun"], correctOptionIndex: 1, explanation: "Facing something unpleasant with courage." },
        { questionText: "If something costs 'An arm and a leg', it is:", options: ["Cheap", "Free", "Very expensive", "Broken"], correctOptionIndex: 2, explanation: "Idiom for a high price." },
        { questionText: "What does 'Piece of cake' mean?", options: ["A sweet dessert", "Something very easy", "A slice of bread", "A hard task"], correctOptionIndex: 1, explanation: "Describes a simple task." }
      ]
    ];

    const questionsMap = [english1Questions, english2Questions];

    for (let cIdx = 0; cIdx < coursesToSeed.length; cIdx++) {
      const courseData = coursesToSeed[cIdx];
      const existingCourse = await Course.findOne({ title: courseData.title });
      let course;
      if (existingCourse) {
        Object.assign(existingCourse, courseData);
        course = await existingCourse.save();
      } else {
        course = await new Course(courseData).save();
      }
      console.log(`✅ Seeded course: ${course.title}`);

      // Add Questions for the quizzes in each module
      const moduleQuestions = questionsMap[cIdx];
      
      for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
        const module = course.modules[mIdx];
        const quizLesson = module.lessons.find((l: any) => l.type === 'quiz');
        
        if (quizLesson && moduleQuestions[mIdx]) {
          const quizId = (quizLesson as any)._id;
          
          const questions = moduleQuestions[mIdx].map(q => ({
            ...q,
            courseId: course._id,
            lessonId: quizId.toString()
          }));

          await Question.deleteMany({ lessonId: quizId.toString() });
          await Question.insertMany(questions);
          console.log(`   Added ${questions.length} questions for Module ${mIdx + 1} Quiz`);
        }
      }
    }

    console.log('🏁 English courses seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedEnglishCourses();
