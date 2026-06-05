import { UndoMetric } from '../models/UndoMetric';

export const logUndoMetric = async (
  actionType: 'delete' | 'restore',
  entityType: string,
  entityId: string,
  entityTitle: string,
  userId: string
) => {
  try {
    const metric = new UndoMetric({
      actionType,
      entityType,
      entityId,
      entityTitle,
      userId,
      timestamp: new Date(),
    });
    await metric.save();
  } catch (error) {
    console.error('Failed to log undo metric:', error);
  }
};

export const getUndoMetrics = async (days: number = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const pipeline = [
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: { entityType: '$entityType', actionType: '$actionType' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.entityType',
        actions: {
          $push: { actionType: '$_id.actionType', count: '$count' },
        },
        total: { $sum: '$count' },
      },
    },
    { $sort: { total: -1 } },
  ];

  const raw = await UndoMetric.aggregate(pipeline);

  // Build per-type breakdown
  const breakdown: Array<{
    entityType: string;
    deletes: number;
    restores: number;
    undoRate: number;
    total: number;
  }> = [];

  let totalDeletes = 0;
  let totalRestores = 0;

  for (const group of raw) {
    const deletes = group.actions.find((a: any) => a.actionType === 'delete')?.count || 0;
    const restores = group.actions.find((a: any) => a.actionType === 'restore')?.count || 0;
    totalDeletes += deletes;
    totalRestores += restores;
    breakdown.push({
      entityType: group._id,
      deletes,
      restores,
      undoRate: deletes > 0 ? Math.round((restores / deletes) * 100) : 0,
      total: group.total,
    });
  }

  return {
    totalDeletes,
    totalRestores,
    overallUndoRate: totalDeletes > 0 ? Math.round((totalRestores / totalDeletes) * 100) : 0,
    breakdown,
    // Return recent raw entries for the log view
    recentEntries: await UndoMetric.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('userId', 'username email'),
  };
};
