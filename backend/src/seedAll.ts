import { execSync } from 'child_process';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..');

async function seedAll() {
  console.log('='.repeat(60));
  console.log('🌱 SEEDING ALL DATA');
  console.log('='.repeat(60));

  try {
    // Step 0: Seed base users first
    console.log('\n📌 STEP 0: Creating Base Users (Super Admin, Admin, Dev, Client)');
    console.log('-'.repeat(50));
    execSync('npx ts-node src/seedFullUsers.ts', {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    // Step 1: Seed project lifecycle + individual internships
    console.log('\n📌 STEP 1: Project Lifecycle & Individual Internships');
    console.log('-'.repeat(50));
    execSync('npx ts-node src/seedProjectLifecycleAndInternships.ts', {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    // Step 2: Seed internship module (Programs, Projects, Teams, Sprints, Tasks, etc.)
    console.log('\n📌 STEP 2: Internship Module (Programs, Projects, Teams)');
    console.log('-'.repeat(50));
    execSync('npx ts-node src/seedInternshipModule.ts', {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    // Step 3: Seed advanced JS practice modules
    console.log('\n📌 STEP 3: Advanced JavaScript Modules (Exercises + Tests)');
    console.log('-'.repeat(50));
    execSync('npx ts-node src/seedsAdvancedJsModules.ts', {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    // Step 4: Seed Intro to JavaScript & Python courses with code exercises
    console.log('\n📌 STEP 4: Introduction to JavaScript & Python Courses (with Code Exercises)');
    console.log('-'.repeat(50));
    execSync('npx ts-node src/seedIntroToJSAndPython.ts', {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    // Step 5: Seed comprehensive JavaScript mastery course (16 modules, variables to advanced)
    console.log('\n📌 STEP 5: Comprehensive JavaScript Mastery Course (Variables → Advanced)');
    console.log('-'.repeat(50));
    execSync('npx ts-node src/seedComprehensiveJSCourse.ts', {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL SEEDS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedAll();

