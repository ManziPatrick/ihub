import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { Question } from './models/Question';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedNonTechCourses = async () => {
  try {
    await connectDB();

    console.log('📚 Seeding multi-sector non-tech courses...');

    // Find an instructor (Admin)
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ No admin user found. Please run npm run seed first.');
      process.exit(1);
    }

    const coursesToSeed = [
      {
        title: "Culinary Arts: Classical French Cooking 🍳",
        description: "Master the foundational techniques of French cuisine. Learn to prepare the five mother sauces, expert knife skills, and high-end plating.",
        thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Intermediate",
        category: "Hospitality & Culinary",
        status: "published",
        modules: [
          {
            title: "Module 1: The Mother Sauces",
            description: "An introduction to the five foundational sauces of classical French cooking.",
            lessons: [
              {
                title: "Béchamel & Velouté",
                content: "<h1>The Basics of Roux</h1><p>Learn how to properly cook flour and butter to form the base of your classic white sauces.</p>",
                duration: 30,
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=culinary"
              },
              {
                title: "Quiz: Sauces Mastery 🧠",
                content: "Test your culinary knowledge.",
                duration: 15,
                type: "quiz"
              }
            ]
          }
        ]
      },
      {
        title: "Modern Agriculture & Sustainable Farming 🌾",
        description: "Transform your farming practices. This comprehensive course covers regenerative agriculture, advanced irrigation, soil health mastery, and the business of modern agritech.",
        thumbnail: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1200",
        instructor: admin._id,
        price: 0,
        level: "Beginner",
        category: "Agriculture",
        status: "published",
        modules: [
          {
            title: "Module 1: Soil Science & Regeneration",
            description: "Understanding the foundation of life-sustaining agriculture.",
            lessons: [
              {
                title: "The Microbiome of Healthy Soil",
                content: "<h1>Beyond Just Dirt</h1><p>Learn how bacteria and fungi create a living network that feeds your plants naturally.</p>",
                duration: 25,
                type: "article"
              },
              {
                title: "Composting & Natural Fertilizers",
                content: "<h1>Turning Waste into Gold</h1><p>Master the art of closed-loop nutrient cycling for your farm.</p>",
                duration: 30,
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=composting"
              },
              {
                title: "Quiz: Soil Foundations 🎯",
                content: "Test your knowledge of regenerative soil practices.",
                duration: 15,
                type: "quiz"
              }
            ]
          },
          {
            title: "Module 2: Water Management & Irrigation",
            description: "Efficiency in every drop.",
            lessons: [
              {
                title: "Drip Irrigation Systems",
                content: "<h1>Smart Watering</h1><p>How to design and install efficient drip systems that save water and increase yield.</p>",
                duration: 35,
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=irrigation"
              },
              {
                title: "Rainwater Harvesting Techniques",
                content: "<h1>Capturing the Gift</h1><p>Strategies for storing water during wet seasons for use in dry periods.</p>",
                duration: 20,
                type: "article"
              },
              {
                title: "Quiz: Water Conservation 💧",
                content: "Prove your mastery of irrigation efficiency.",
                duration: 15,
                type: "quiz"
              }
            ]
          },
          {
            title: "Module 3: Agribusiness & Farm Management",
            description: "Turning your harvest into a sustainable business.",
            lessons: [
              {
                title: "Market Access & Supply Chains",
                content: "<h1>From Farm to Table</h1><p>Understanding how to get your products to the right buyers at the best prices.</p>",
                duration: 40,
                type: "article"
              },
              {
                title: "Financial Planning for Smallholders",
                content: "<h1>Managing the Books</h1><p>Budgeting for seeds, equipment, and labor while maintaining a profit margin.</p>",
                duration: 45,
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=agribusiness"
              }
            ]
          }
        ]
      },
      {
        title: "Healthcare Administration & Patient Care 🏥",
        description: "Develop the essential skills needed to manage healthcare facilities, understand patient rights, and optimize clinic workflows.",
        thumbnail: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Advanced",
        category: "Healthcare",
        status: "published",
        modules: [
          {
            title: "Module 1: Ethics & Patient Rights",
            description: "Navigate the complex landscape of healthcare ethics and confidentiality.",
            lessons: [
              {
                title: "Understanding HIPAA",
                content: "<h1>Patient Privacy</h1><p>Learn the core rules of HIPAA and how to ensure compliance in daily clinic operations.</p>",
                duration: 40,
                type: "article"
              },
              {
                title: "Quiz: Healthcare Ethics 🔍",
                content: "Prove your knowledge of patient rights.",
                duration: 15,
                type: "quiz"
              }
            ]
          }
        ]
      },
      {
        title: "Professional Carpentry & Woodworking 🪚",
        description: "Learn the timeless trade of carpentry. Master power tools, joinery techniques, and structural framing.",
        thumbnail: "https://images.unsplash.com/photo-1513467655676-561b7d489a88?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Beginner",
        category: "Trades & Engineering",
        status: "published",
        modules: [
          {
            title: "Module 1: Tools & Safety",
            description: "Start your woodworking journey safely.",
            lessons: [
              {
                title: "Workshop Safety Rules",
                content: "<h1>Protecting Yourself</h1><p>Safety glasses, push sticks, and proper attire are mandatory for any woodworking professional.</p>",
                duration: 20,
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=safety"
              },
              {
                title: "Quiz: Carpentry Basics 🧰",
                content: "Test your safety knowledge.",
                duration: 10,
                type: "quiz"
              }
            ]
          }
        ]
      },
      {
        title: "Professional Tailoring & Fashion Design ✂️",
        description: "From sketching to the final stitch. Master garment construction, pattern making, and fashion illustration.",
        thumbnail: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Intermediate",
        category: "Arts & Fashion",
        status: "published",
        modules: [
          {
            title: "Module 1: Garment Construction",
            description: "Learn the core techniques of high-quality tailoring.",
            lessons: [
              {
                title: "The Art of the Stitch",
                content: "<h1>Precision Sewing</h1><p>Master the fundamental stitches used in bespoke tailoring.</p>",
                duration: 35,
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=fashion"
              },
              {
                title: "Quiz: Tailoring Basics 👗",
                content: "Test your design knowledge.",
                duration: 15,
                type: "quiz"
              }
            ]
          }
        ]
      },
      {
        title: "Solar Energy: Installation & Maintenance ☀️",
        description: "Become a certified solar technician. Learn about photovoltaic systems, battery storage, and safety standards.",
        thumbnail: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Advanced",
        category: "Renewable Energy",
        status: "published",
        modules: [
          {
            title: "Module 1: PV System Basics",
            description: "Understanding how solar panels convert sunlight into electricity.",
            lessons: [
              {
                title: "The Photovoltaic Effect",
                content: "<h1>Harnessing the Sun</h1><p>Learn the science behind solar energy production.</p>",
                duration: 30,
                type: "article"
              },
              {
                title: "Quiz: Solar Mastery 🔋",
                content: "Test your energy knowledge.",
                duration: 20,
                type: "quiz"
              }
            ]
          }
        ]
      }
    ];

    for (const courseData of coursesToSeed) {
      const existingCourse = await Course.findOne({ title: courseData.title });
      let course;
      if (existingCourse) {
        Object.assign(existingCourse, courseData);
        course = await existingCourse.save();
      } else {
        course = await new Course(courseData).save();
      }
      console.log(`✅ Seeded course: ${course.title}`);

      // Add Questions for ALL quizzes in ALL modules
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          if (lesson.type === 'quiz') {
            const quizId = (lesson as any)._id;
            let questions: any[] = [];

            // Culinary
            if (course.category === 'Hospitality & Culinary') {
              questions = [
                {
                  courseId: course._id,
                  lessonId: quizId.toString(),
                  questionText: "Which of the following is NOT one of the five French mother sauces?",
                  options: ["Béchamel", "Velouté", "Hollandaise", "Marinara"],
                  correctOptionIndex: 3,
                  explanation: "**Marinara** is an Italian sauce. The five French mother sauces are Béchamel, Velouté, Espagnole, Sauce Tomate, and Hollandaise."
                }
              ];
            } 
            // Agriculture
            else if (course.category === 'Agriculture') {
              if (lesson.title.includes("Soil Foundations")) {
                questions = [
                  {
                    courseId: course._id,
                    lessonId: quizId.toString(),
                    questionText: "What is crop rotation primarily used for?",
                    options: ["To make the farm look prettier", "To prevent soil depletion and break pest cycles", "To increase water usage", "To harvest crops faster"],
                    correctOptionIndex: 1,
                    explanation: "**Crop rotation** prevents the depletion of specific nutrients and naturally disrupts the life cycles of pests and diseases."
                  }
                ];
              } else if (lesson.title.includes("Water Conservation")) {
                questions = [
                  {
                    courseId: course._id,
                    lessonId: quizId.toString(),
                    questionText: "Which irrigation method is considered the most water-efficient for commercial farming?",
                    options: ["Flood Irrigation", "Drip Irrigation", "Sprinkler Irrigation", "Bucket Watering"],
                    correctOptionIndex: 1,
                    explanation: "**Drip Irrigation** delivers water directly to the plant's root zone, minimizing evaporation and runoff."
                  }
                ];
              }
            } 
            // Healthcare
            else if (course.category === 'Healthcare') {
              questions = [
                {
                  courseId: course._id,
                  lessonId: quizId.toString(),
                  questionText: "What does HIPAA primarily protect?",
                  options: ["Hospital equipment", "Doctor salaries", "Patient health information privacy", "Medical research patents"],
                  correctOptionIndex: 2,
                  explanation: "**HIPAA** (Health Insurance Portability and Accountability Act) is designed to protect sensitive patient health information from being disclosed without consent."
                }
              ];
            } 
            // Trades
            else if (course.category === 'Trades & Engineering') {
              questions = [
                {
                  courseId: course._id,
                  lessonId: quizId.toString(),
                  questionText: "When operating a table saw, what tool should you use to guide the wood and protect your fingers?",
                  options: ["A push stick", "A metal hammer", "A pair of pliers", "A wrench"],
                  correctOptionIndex: 0,
                  explanation: "A **push stick** is a critical safety tool used to safely push material past the blade while keeping your hands at a safe distance."
                }
              ];
            } 
            // Fashion
            else if (course.category === 'Arts & Fashion') {
              questions = [
                {
                  courseId: course._id,
                  lessonId: quizId.toString(),
                  questionText: "What is the primary tool used for drafting patterns on fabric?",
                  options: ["Tailor's Chalk", "HB Pencil", "Painting Brush", "Permanent Marker"],
                  correctOptionIndex: 0,
                  explanation: "**Tailor's Chalk** is used to temporarily mark fabric for sewing and cutting."
                }
              ];
            } 
            // Renewable Energy
            else if (course.category === 'Renewable Energy') {
              questions = [
                {
                  courseId: course._id,
                  lessonId: quizId.toString(),
                  questionText: "What component is used to convert DC power from solar panels into AC power for home use?",
                  options: ["Battery", "Inverter", "Generator", "Transformer"],
                  correctOptionIndex: 1,
                  explanation: "An **Inverter** is the heart of a solar system, converting DC electricity into usable AC power."
                }
              ];
            }

            if (questions.length > 0) {
              await Question.deleteMany({ lessonId: quizId.toString() });
              await Question.insertMany(questions);
              console.log(`   Added questions for quiz: ${lesson.title} in ${course.title}`);
            }
          }
        }
      }
    }

    console.log('🏁 Multi-sector courses seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedNonTechCourses();
