import { ProjectTask } from '../models/ProjectTask';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { sendNotification } from '../services/notification.service';
import { sendTaskFeedbackEmail } from '../services/email.service';

const checkProjectAuthorization = async (projectId: string, context: any) => {
  if (!context.user) throw new Error('Not authenticated');
  const isStaff = ['admin', 'super_admin', 'trainer'].includes(context.user.role);
  if (isStaff) return true;

  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');

  const isOwner = project.userId?.toString() === context.user.id;
  const isTeamMember = project.team?.some(member => member.userId?.toString() === context.user.id);

  // Also allow if the user has tasks assigned in this project
  const hasAssignedTasks = (!isOwner && !isTeamMember) ?
    await ProjectTask.exists({ projectId, assigneeId: context.user.id, isDeleted: false }) :
    false;

  if (!isOwner && !isTeamMember && !hasAssignedTasks) {
    throw new Error('Not authorized');
  }
  return true;
};

export const projectTaskResolvers = {
  Query: {
    projectTasks: async (_: any, { projectId }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      return await ProjectTask.find({ projectId, isDeleted: false })
        .populate('assigneeId')
        .populate('projectId')
        .sort({ order: 1 });
    },

    projectTask: async (_: any, { id }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const task = await ProjectTask.findById(id).populate('assigneeId');
      if (!task || task.isDeleted) throw new Error('Task not found');
      return task;
    },

    myProjectTasks: async (_: any, { status }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // Only fetch *string* project ids; avoid passing full docs/objects into Mongoose casting.
      const userProjectIds = (await Project.find({
        $or: [
          { userId: context.user.id },
          { 'team.userId': context.user.id },
        ],
      }).select('_id')
        .lean())
        .map((p: any) => p._id.toString());


      const filter: any = { isDeleted: false };
      if (status) filter.status = status;

      if (userProjectIds.length > 0) {
        filter.$or = [
          { assigneeId: context.user.id },
          { assigneeId: null, projectId: { $in: userProjectIds } },
          { assigneeId: { $exists: false }, projectId: { $in: userProjectIds } },
        ];
      } else {
        filter.assigneeId = context.user.id;
      }

      // IMPORTANT: filter projectId with {$in: ...} to avoid Mongoose casting errors when userProjectIds already contains full docs.
      return await ProjectTask.find(filter)
        .populate('assigneeId')
        .populate('projectId')
        .sort({ updatedAt: -1 });
    },

    projectBoardStats: async (_: any, { projectId }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const allTasks = await ProjectTask.find({ projectId, isDeleted: false });
      const now = new Date();
      return {
        totalTasks: allTasks.length,
        backlogCount: allTasks.filter(t => t.status === 'backlog').length,
        todoCount: allTasks.filter(t => t.status === 'todo').length,
        inProgressCount: allTasks.filter(t => t.status === 'in_progress').length,
        inReviewCount: allTasks.filter(t => t.status === 'in_review').length,
        doneCount: allTasks.filter(t => t.status === 'done').length,
        blockedCount: allTasks.filter(t => t.status === 'blocked').length,
        completedPercentage: allTasks.length > 0
          ? Math.round((allTasks.filter(t => t.status === 'done').length / allTasks.length) * 100)
          : 0,
        overdueTasks: allTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      };
    },

    projectDeveloperTaskSummary: async (_: any, { projectId }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const tasks = await ProjectTask.find({ projectId, isDeleted: false })
        .populate('assigneeId')
        .populate('projectId');

      // Weighted mapping
      const weights: Record<string, number> = {
        todo: 25,
        in_progress: 50,
        in_review: 75,
        done: 100,
        blocked: 0,
        backlog: 0,
      };

      const byDeveloper = new Map<string, { developer: any; tasks: any[] }>();
      for (const task of tasks) {
        const assignee = (task as any).assigneeId;
        if (!assignee) continue;
        const devId = assignee._id.toString();
        if (!byDeveloper.has(devId)) {
          byDeveloper.set(devId, { developer: assignee, tasks: [] });
        }
        byDeveloper.get(devId)!.tasks.push(task);
      }

      const results = Array.from(byDeveloper.values()).map(({ developer, tasks: devTasks }) => {
        const totalTasks = devTasks.length;
        const doneTasks = devTasks.filter(t => t.status === 'done').length;
        const inProgressTasks = devTasks.filter(t => t.status === 'in_progress' || t.status === 'todo' || t.status === 'in_review').length;
        const todoTasks = devTasks.filter(t => t.status === 'todo').length;
        const inReviewTasks = devTasks.filter(t => t.status === 'in_review').length;
        const blockedTasks = devTasks.filter(t => t.status === 'blocked').length;

        const weightedSum = devTasks.reduce((sum: number, t: any) => {
          const w = weights[t.status] ?? 0;
          return sum + w;
        }, 0);

        const progressPercentage = totalTasks > 0 ? Math.round(weightedSum / totalTasks) : 0;

        const taskItems = devTasks
          .slice()
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          .map((t: any) => ({
            id: t._id.toString(),
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate ? t.dueDate.toISOString() : null,
            order: t.order,
            approved: t.approved,
            feedback: t.feedback,
            assigneeId: t.assigneeId?._id?.toString() ?? null,
          }));

        return {
          developer: {
            id: developer._id.toString(),
            username: developer.username,
            fullName: developer.fullName,
            avatar: developer.avatar,
          },
          totalTasks,
          todoTasks,
          inProgressTasks,
          inReviewTasks,
          doneTasks,
          blockedTasks,
          progressPercentage,
          tasks: taskItems,
        };
      });

      // Stable sort by progress desc then name
      results.sort((a: any, b: any) => (b.progressPercentage - a.progressPercentage) || (a.developer.username.localeCompare(b.developer.username)));
      return results;
    },
  },

  ProjectTask: {
    id: (parent: any) => parent.id || parent._id,
    projectId: (parent: any) => {
      if (!parent.projectId) return null;
      if (typeof parent.projectId === 'object' && (parent.projectId._id || parent.projectId.id)) {
        return (parent.projectId._id || parent.projectId.id).toString();
      }
      return parent.projectId?.toString?.() || parent.projectId;
    },
    assigneeId: (parent: any) => {
      if (!parent.assigneeId) return null;
      if (typeof parent.assigneeId === 'object' && (parent.assigneeId._id || parent.assigneeId.id)) {
        return (parent.assigneeId._id || parent.assigneeId.id).toString();
      }
      return parent.assigneeId?.toString?.() || parent.assigneeId;
    },
    assignee: async (parent: any) => {
      if (!parent.assigneeId) return null;
      if (typeof parent.assigneeId === 'object' && (parent.assigneeId._id || parent.assigneeId.id)) {
        return parent.assigneeId;
      }
      return await User.findById(parent.assigneeId);
    },
    project: async (parent: any) => {
      if (!parent.projectId) return null;
      if (typeof parent.projectId === 'object' && (parent.projectId._id || parent.projectId.id)) {
        return parent.projectId;
      }
      return await Project.findById(parent.projectId);
    },
  },

  Mutation: {
    createProjectTask: async (_: any, args: any, context: any) => {
      await checkProjectAuthorization(args.projectId, context);
      
      // Prevent duplicate task assignment: no two devs can have the same active task on the same project
      if (args.assigneeId) {
        const existingTask = await ProjectTask.findOne({
          projectId: args.projectId,
          title: args.title,
          isDeleted: false,
          status: { $ne: 'done' },
          assigneeId: { $ne: args.assigneeId }
        });
        if (existingTask) {
          throw new Error('This task is already assigned to another developer on this project');
        }
      }

      const lastTask = await ProjectTask.findOne({ projectId: args.projectId })
        .sort({ order: -1 });
      const task = new ProjectTask({
        ...args,
        status: 'backlog',
        order: (lastTask?.order || 0) + 1,
      });
      await task.save();
      const populated = await task.populate('assigneeId');

      // Notify assignee if one was set
      if (args.assigneeId && args.assigneeId.toString() !== context.user.id) {
        sendNotification(args.assigneeId.toString(), {
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You have been assigned task: ${args.title}`,
          link: `/portal/student`,
        });
      }

      return populated;
    },

    updateProjectTask: async (_: any, { id, ...updates }: any, context: any) => {
      // Fetch original task to detect changes
      const original = await ProjectTask.findById(id);
      if (!original) throw new Error('Task not found');
      await checkProjectAuthorization(original.projectId.toString(), context);

      const task = await ProjectTask.findByIdAndUpdate(id, { $set: updates }, { new: true })
        .populate('assigneeId');
      if (!task) throw new Error('Task not found');

      // Notify new assignee if assignee changed
      if (updates.assigneeId && updates.assigneeId !== original.assigneeId?.toString() && updates.assigneeId !== context.user.id) {
        sendNotification(updates.assigneeId, {
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You have been assigned task: ${task.title}`,
          link: `/portal/student`,
        });
      }

      // Notify assignee if status changed
      if (updates.status && updates.status !== original.status && task.assigneeId && task.assigneeId.toString() !== context.user.id) {
        const statusLabels: Record<string, string> = {
          backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress',
          in_review: 'In Review', done: 'Done', blocked: 'Blocked',
        };
        sendNotification(task.assigneeId.toString(), {
          type: 'TASK_STATUS_CHANGED',
          title: 'Task Moved',
          message: `Task "${task.title}" moved from ${statusLabels[original.status] || original.status} to ${statusLabels[updates.status] || updates.status}`,
          link: `/portal/student`,
        });
      }

      return task;
    },

    moveProjectTask: async (_: any, { id, status, order }: any, context: any) => {
      const task = await ProjectTask.findById(id);
      if (!task || task.isDeleted) throw new Error('Task not found');
      await checkProjectAuthorization(task.projectId.toString(), context);

      const previousStatus = task.status;
      let targetStatus = status;

      // Students cannot move directly to 'done' — redirect to 'in_review'
      const isStaff = ['admin', 'super_admin', 'trainer'].includes(context.user.role);
      if (status === 'done' && !isStaff) {
        targetStatus = 'in_review';
      }

      // If moving away from 'in_review' (back to a working state), un-approve
      if (task.status === 'in_review' && targetStatus !== 'done' && targetStatus !== 'in_review') {
        task.approved = false;
        task.feedback = undefined;
        task.approvedBy = undefined;
        task.approvedAt = undefined;
      }

      task.status = targetStatus;
      if (order !== undefined) task.order = order;
      await task.save();
      const populated = await task.populate('assigneeId');

      // Notify assignee when their task status changes (skip if they moved it themselves)
      if (task.assigneeId && task.assigneeId.toString() !== context.user.id && previousStatus !== targetStatus) {
        const statusLabels: Record<string, string> = {
          backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress',
          in_review: 'In Review', done: 'Done', blocked: 'Blocked',
        };
        sendNotification(task.assigneeId.toString(), {
          type: 'TASK_STATUS_CHANGED',
          title: 'Task Moved',
          message: `Task "${task.title}" moved from ${statusLabels[previousStatus] || previousStatus} to ${statusLabels[targetStatus] || targetStatus}`,
          link: `/portal/student`,
        });
      }

      return populated;
    },

    deleteProjectTask: async (_: any, { id }: any, context: any) => {
      const task = await ProjectTask.findById(id);
      if (!task) throw new Error('Task not found');
      await checkProjectAuthorization(task.projectId.toString(), context);

      const result = await ProjectTask.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      return !!result;
    },

    approveProjectTask: async (_: any, { id, feedback }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const task = await ProjectTask.findByIdAndUpdate(
        id,
        { approved: true, approvedBy: context.user.id, approvedAt: new Date(), status: 'done', feedback },
        { new: true }
      ).populate('assigneeId');
      if (!task) throw new Error('Task not found');

      // Notify assignee that their task was approved
      if (task.assigneeId && task.assigneeId.toString() !== context.user.id) {
        sendNotification(task.assigneeId.toString(), {
          type: 'TASK_APPROVED',
          title: 'Task Approved',
          message: `Task "${task.title}" has been approved` + (feedback ? ` with feedback: ${feedback}` : ''),
          link: `/portal/student`,
        });
      }

      return task;
    },

    assignProjectTask: async (_: any, { id, assigneeId }: any, context: any) => {
      const task = await ProjectTask.findById(id);
      if (!task) throw new Error('Task not found');
      await checkProjectAuthorization(task.projectId.toString(), context);

      // Prevent duplicate assignment: no two devs can have the same task title on same project
      if (assigneeId) {
        const existingTask = await ProjectTask.findOne({
          projectId: task.projectId,
          assigneeId,
          title: task.title,
          _id: { $ne: id },
          isDeleted: false,
          status: { $ne: 'done' }
        });
        if (existingTask) {
          throw new Error('This task is already assigned to another developer on this project');
        }
      }

      const updatedTask = await ProjectTask.findByIdAndUpdate(id, { assigneeId }, { new: true })
        .populate('assigneeId');
      if (!updatedTask) throw new Error('Task not found');

      // Notify the new assignee
      if (assigneeId && assigneeId.toString() !== context.user.id) {
        sendNotification(assigneeId.toString(), {
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You have been assigned task: ${task.title}`,
          link: `/portal/student`,
        });
      }

      return updatedTask;
    },

    sendTaskFeedback: async (_: any, { taskId, message, resources }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const task = await ProjectTask.findById(taskId);
      if (!task || task.isDeleted) throw new Error('Task not found');

      // Authorize
      await checkProjectAuthorization(task.projectId.toString(), context);

      // Add feedback
      const feedbackItem = {
        userId: context.user.id,
        message,
        resources: resources || [],
        createdAt: new Date()
      };

      task.developerFeedback = task.developerFeedback || [];
      task.developerFeedback.push(feedbackItem as any);
      await task.save();

      const populated = await ProjectTask.findById(taskId)
        .populate('assigneeId');

      // Notify Mentors via Email and Notification
      const project = await Project.findById(task.projectId).populate('mentors');
      if (project) {
        const developerName = context.user.fullName || context.user.username;
        for (const mentor of (project.mentors || [])) {
          const mentorUser = mentor as any;
          if (mentorUser.email) {
            sendTaskFeedbackEmail(
              mentorUser.email,
              mentorUser.fullName || mentorUser.username,
              developerName,
              project.title,
              task.title,
              message,
              resources
            ).catch(err => console.error('Error sending task feedback email:', err));
          }
          // Also send in-app notification to mentors
          sendNotification(mentorUser._id.toString(), {
            type: 'TASK_FEEDBACK_SUBMITTED',
            title: 'Developer Task Update',
            message: `${developerName} submitted feedback on task "${task.title}"`,
            link: `/portal/trainer/projects`,
          });
        }
      }

      return populated;
    }
  },
};
