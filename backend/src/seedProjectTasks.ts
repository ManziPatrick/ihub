import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Project } from './models/Project';
import { ProjectTask } from './models/ProjectTask';
import connectDB from './config/db';

dotenv.config();

const CATEGORY_LABEL_MAP: Record<string, string[]> = {
  Frontend: ['frontend'],
  Backend: ['backend'],
};

const seedProjectTasks = async () => {
  try {
    await connectDB();

    console.log('📋 Seeding ProjectTask documents from embedded project tasks...\n');

    // Fetch all projects that have embedded tasks
    const projects = await Project.find({
      tasks: { $exists: true, $not: { $size: 0 } },
      isArchived: { $ne: true },
    });

    console.log(`Found ${projects.length} projects with embedded tasks.\n`);

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const project of projects) {
      const embeddedTasks = (project as any).tasks || [];
      if (embeddedTasks.length === 0) continue;

      // Check which tasks have already been migrated (by matching title)
      const existingTitles = await ProjectTask.find({
        projectId: project._id,
        isDeleted: false,
      }).distinct('title');
      const existingSet = new Set(existingTitles.map((t) => t.toString()));

      let createdCount = 0;
      let skippedCount = 0;

      for (const [index, task] of embeddedTasks.entries()) {
        // Skip if already migrated
        if (existingSet.has(task.title)) {
          skippedCount++;
          continue;
        }

        const isCompleted = task.completed === true;
        const labels: string[] = [];

        if (task.category && CATEGORY_LABEL_MAP[task.category]) {
          labels.push(...CATEGORY_LABEL_MAP[task.category]);
        }

        // Determine priority based on task context (default to medium)
        const priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';

        // Map status: completed → 'done', otherwise 'todo'
        const status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' = isCompleted ? 'done' : 'todo';

        await ProjectTask.create({
          projectId: project._id,
          title: task.title,
          status,
          priority,
          labels: labels.length > 0 ? labels : undefined,
          order: index,
          approved: task.approved === true,
          feedback: task.feedback || undefined,
        });

        createdCount++;
      }

      console.log(
        `  ${project.title}: ${createdCount} created, ${skippedCount} skipped (${embeddedTasks.length} total)`
      );

      totalCreated += createdCount;
      totalSkipped += skippedCount;
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Created: ${totalCreated} ProjectTask documents`);
    console.log(`   Skipped (already exist): ${totalSkipped}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedProjectTasks();
