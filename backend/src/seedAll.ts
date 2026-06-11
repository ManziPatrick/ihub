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
    execSync('npx ts-node src/seedFullProjectManagement.ts', {
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

    // Step 3: Seed full courses (and full course scenarios)
    console.log('\n📌 STEP 3: Seed full courses');
    console.log('-'.repeat(50));
    execSync('npx ts-node src/seedFinal.ts', {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    // Step 4: Seed full course enrollments + course enrollment payments
    console.log('\n📌 STEP 4: Course Full Enrollments + Payments');
    console.log('-'.repeat(50));
    execSync('npx ts-node src/seedCourseFullPaid.ts', {
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

