import { ProjectTask } from '../models/ProjectTask';

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
      return await ProjectTask.find(filter).populate('assigneeId').sort({ updatedAt: -1 });
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
      return await task.populate('assigneeId');
    },

    updateProjectTask: async (_: any, { id, ...updates }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const task = await ProjectTask.findByIdAndUpdate(id, { $set: updates }, { new: true })
        .populate('assigneeId');
      if (!task) throw new Error('Task not found');
      return task;
    },

    moveProjectTask: async (_: any, { id, status, order }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const task = await ProjectTask.findById(id);
      if (!task || task.isDeleted) throw new Error('Task not found');

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
      return await task.populate('assigneeId');
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
      return task;
    },

    assignProjectTask: async (_: any, { id, assigneeId }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const task = await ProjectTask.findByIdAndUpdate(id, { assigneeId }, { new: true })
        .populate('assigneeId');
      if (!task) throw new Error('Task not found');
      return task;
    },
  },
};
