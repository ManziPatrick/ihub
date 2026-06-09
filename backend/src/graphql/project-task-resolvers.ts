import { ProjectTask } from '../models/ProjectTask';
import { sendNotification } from '../services/notification.service';

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
      const filter: any = { assigneeId: context.user.id, isDeleted: false };
      if (status) filter.status = status;
      return await ProjectTask.find(filter).populate('assigneeId').populate('projectId').sort({ updatedAt: -1 });
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
  },

  Mutation: {
    createProjectTask: async (_: any, args: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
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
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      // Fetch original task to detect changes
      const original = await ProjectTask.findById(id);
      if (!original) throw new Error('Task not found');

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
      if (!context.user) throw new Error('Not authenticated');
      const task = await ProjectTask.findById(id);
      if (!task || task.isDeleted) throw new Error('Task not found');

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
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
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
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const task = await ProjectTask.findByIdAndUpdate(id, { assigneeId }, { new: true })
        .populate('assigneeId');
      if (!task) throw new Error('Task not found');

      // Notify the new assignee
      if (assigneeId && assigneeId.toString() !== context.user.id) {
        sendNotification(assigneeId.toString(), {
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You have been assigned task: ${task.title}`,
          link: `/portal/student`,
        });
      }

      return task;
    },
  },
};
