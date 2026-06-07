import { execSync } from 'child_process';

async function seedAll() {
  console.log('='.repeat(60));
  console.log('🌱 SEEDING ALL DATA');
  console.log('='.repeat(60));

  try {
    // Step 1: Seed project lifecycle + individual internships
    console.log('\n📌 STEP 1: Project Lifecycle & Individual Internships');
    console.log('-'.repeat(50));
    execSync('npx ts-node src/seedProjectLifecycleAndInternships.ts', {
      stdio: 'inherit',
      cwd: __dirname,
    });

    // Step 2: Seed internship module (Programs, Projects, Teams, Sprints, Tasks, etc.)
    console.log('\n📌 STEP 2: Internship Module (Programs, Projects, Teams)');
    console.log('-'.repeat(50));
    execSync('npx ts-node src/seedInternshipModule.ts', {
      stdio: 'inherit',
      cwd: __dirname,
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
