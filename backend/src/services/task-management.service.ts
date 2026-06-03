import { UserAssignedTask, IUserAssignedTask } from '../models/UserAssignedTask';
import { TaskTracking, ITaskTracking } from '../models/TaskTracking';
import { sendNotification } from './notification.service';

export class TaskManagementService {
  /**
   * Assign a task to a user
   */
  static async assignTaskToUser(
    userId: string,
    assignedBy: string,
    taskData: {
      title: string;
      description: string;
      priority?: string;
      dueDate?: Date;
      relatedApplication?: string;
      relatedPhase?: string;
      attachments?: any[];
      checklist?: any[];
    }
  ): Promise<any> {
    const task = new UserAssignedTask({
      userId,
      assignedBy,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate,
      relatedApplication: taskData.relatedApplication,
      relatedPhase: taskData.relatedPhase,
      attachments: taskData.attachments || [],
      checklist: taskData.checklist || [],
      assignedDate: new Date(),
    });

    const savedTask = await task.save();

    // Create task tracking record
    const tracking = new TaskTracking({
      taskId: savedTask._id,
      statusHistory: [
        {
          status: 'pending',
          changedAt: new Date(),
          changedBy: assignedBy,
        },
      ],
    });

    await tracking.save();

    // Send notification
    await sendNotification(
      userId,
      {
        type: 'task_assigned',
        title: `New Task: ${taskData.title}`,
        message: taskData.description,
        link: `/portal/tasks/${savedTask._id}`,
      }
    );

    return savedTask;
  }

  /**
   * Get tasks for a user
   */
  static async getTasksByUser(userId: string, status?: string): Promise<any[]> {
    const filter: any = { userId };
    if (status) filter.status = status;

    return UserAssignedTask.find(filter)
      .populate('assignedBy', 'firstName lastName')
      .sort({ dueDate: 1, priority: -1 });
  }

  /**
   * Get tasks assigned by a user (admin view)
   */
  static async getTasksByAssignedBy(adminId: string, status?: string): Promise<any[]> {
    const filter: any = { assignedBy: adminId };
    if (status) filter.status = status;

    return UserAssignedTask.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ dueDate: 1, priority: -1 });
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(
    taskId: string,
    newStatus: string,
    updatedBy: string,
    notes?: string
  ): Promise<any> {
    const task = await UserAssignedTask.findByIdAndUpdate(
      taskId,
      {
        status: newStatus,
        ...(newStatus === 'completed' && { completedDate: new Date() }),
      },
      { new: true }
    );

    if (task) {
      // Update tracking
      await TaskTracking.findOneAndUpdate(
        { taskId },
        {
          $push: {
            statusHistory: {
              status: newStatus,
              changedAt: new Date(),
              changedBy: updatedBy,
              notes,
            },
          },
        }
      );

      // Send notification if task is completed
      if (newStatus === 'completed') {
        await sendNotification(
          task.assignedBy.toString(),
          {
            type: 'task_completed',
            title: `Task Completed: ${task.title}`,
            message: `${task.userId} has completed the task "${task.title}"`,
          }
        );
      }
    }

    return task;
  }

  /**
   * Update task progress
   */
  static async updateTaskProgress(
    taskId: string,
    progressPercentage: number,
    updatedBy: string,
    notes?: string
  ): Promise<any> {
    return TaskTracking.findOneAndUpdate(
      { taskId },
      {
        progressPercentage,
        $push: {
          progressUpdates: {
            date: new Date(),
            percentage: progressPercentage,
            notes,
            updatedBy,
          },
        },
      },
      { new: true }
    );
  }

  /**
   * Log time spent on a task
   */
  static async logTimeSpent(
    taskId: string,
    duration: number, // in minutes
    notes?: string
  ): Promise<any> {
    const tracking = await TaskTracking.findOneAndUpdate(
      { taskId },
      {
        $inc: { 'timeSpent.total': duration },
        $push: {
          'timeSpent.sessions': {
            startTime: new Date(),
            duration,
            notes,
          },
        },
      },
      { new: true }
    );

    return tracking;
  }

  /**
   * Get task details with tracking info
   */
  static async getTaskWithTracking(taskId: string): Promise<any> {
    const task = await UserAssignedTask.findById(taskId)
      .populate('userId', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName');

    const tracking = await TaskTracking.findOne({ taskId });

    return {
      task,
      tracking,
      totalTimeSpent: tracking?.timeSpent.total || 0,
      progress: tracking?.progressPercentage || 0,
      statusHistory: tracking?.statusHistory || [],
    };
  }

  /**
   * Get all tasks grouped by status
   */
  static async getTasksByStatus(assignedBy: string): Promise<any> {
    const tasks = await UserAssignedTask.find({ assignedBy }).populate('userId', 'firstName lastName');

    return {
      pending: tasks.filter(t => t.status === 'pending'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      completed: tasks.filter(t => t.status === 'completed'),
      cancelled: tasks.filter(t => t.status === 'cancelled'),
    };
  }

  /**
   * Get task statistics
   */
  static async getTaskStats(assignedBy: string): Promise<any> {
    const tasks = await UserAssignedTask.find({ assignedBy });
    const trackings = await TaskTracking.find({
      taskId: { $in: tasks.map(t => t._id) },
    });

    const totalTimeSpent = trackings.reduce((sum, t) => sum + (t.timeSpent.total || 0), 0);
    const avgCompletion = tasks.length > 0
      ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100
      : 0;

    return {
      totalTasks: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      totalTimeSpent,
      avgCompletionRate: avgCompletion,
      overdueTasks: tasks.filter(t =>
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length,
    };
  }

  /**
   * Complete task checklist item
   */
  static async completeChecklistItem(
    taskId: string,
    itemIndex: number
  ): Promise<any> {
    return UserAssignedTask.findByIdAndUpdate(
      taskId,
      {
        $set: {
          'checklist.$[elem].completed': true,
        },
      },
      {
        arrayFilters: [{ 'elem': { $exists: true } }],
        new: true,
      }
    );
  }

  /**
   * Cancel a task
   */
  static async cancelTask(
    taskId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<any> {
    return UserAssignedTask.findByIdAndUpdate(
      taskId,
      { status: 'cancelled' },
      { new: true }
    );
  }
}
