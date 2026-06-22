import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { GO_OFFLINE, UPDATE_PRESENCE } from '@/lib/graphql/mutations';
import { getGraphqlUrl } from '@/lib/env';
import { toast } from 'sonner';

const OFFLINE_QUEUE_KEY = 'offline_action_queue';
const OFFLINE_MODE_KEY = 'offline_manual_mode';

export interface QueuedAction {
  id: string;
  type: 'COMPLETE_LESSON' | 'SUBMIT_ASSIGNMENT' | 'UPDATE_COURSE_PROGRESS' | 'SUBMIT_EXAM' | 'REWARD_QUIZ';
  variables: Record<string, any>;
  createdAt: number;
  description: string;
}

/** 
 * Allowed mutation query strings for offline sync. 
 * These are sent via Apollo Client so auth headers are included automatically.
 */
const SYNC_MUTATIONS: Record<string, string> = {
  COMPLETE_LESSON: `
    mutation($courseId: ID!, $lessonId: String!) {
      completeLesson(courseId: $courseId, lessonId: $lessonId) { id }
    }
  `,
  SUBMIT_ASSIGNMENT: `
    mutation($courseId: ID!, $lessonId: String!, $content: String!) {
      submitAssignment(courseId: $courseId, lessonId: $lessonId, content: $content) { id status }
    }
  `,
  UPDATE_COURSE_PROGRESS: `
    mutation($courseId: ID!, $lessonId: String!) {
      updateCourseProgress(courseId: $courseId, lessonId: $lessonId) { id }
    }
  `,
  SUBMIT_EXAM: `
    mutation($courseId: ID!, $lessonId: String!, $answers: [AssignmentAnswerInput!]!, $timeTaken: Int) {
      submitAssignmentExam(courseId: $courseId, lessonId: $lessonId, answers: $answers, timeTaken: $timeTaken) { id status grade totalScore }
    }
  `,
  REWARD_QUIZ: `
    mutation($xp: Int!, $streak: Int, $courseId: ID, $lessonId: ID, $score: Int) {
      rewardStudent(xp: $xp, streak: $streak, courseId: $courseId, lessonId: $lessonId, score: $score) { id xp level streak }
    }
  `,
};

export function useOfflineSync() {
  const [isManualOffline, setIsManualOffline] = useState(() => {
    return localStorage.getItem(OFFLINE_MODE_KEY) === 'true';
  });
  
  const [queueCount, setQueueCount] = useState(0);
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const queueRef = useRef<QueuedAction[]>([]);


  const [updatePresence] = useMutation(UPDATE_PRESENCE);
  const [goOfflineMutation] = useMutation(GO_OFFLINE);

  const isOffline = isManualOffline || (typeof navigator !== 'undefined' && !navigator.onLine);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (raw) {
        queueRef.current = JSON.parse(raw);
        setQueueCount(queueRef.current.length);
        setQueue(queueRef.current);
      }
    } catch { /* ignore corrupt data */ }
  }, []);

  // Save queue to localStorage whenever it changes
  const persistQueue = useCallback((queue: QueuedAction[]) => {
    queueRef.current = queue;
    setQueueCount(queue.length);
    setQueue(queue);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }, []);

  // Enqueue an action for later sync
  const enqueueAction = useCallback((action: Omit<QueuedAction, 'id' | 'createdAt'>) => {
    const queued: QueuedAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    const updated = [...queueRef.current, queued];
    persistQueue(updated);
    toast.success(`📦 Queued: ${action.description}`, {
      description: `Will sync when you go back online`,
      duration: 3000,
    });
    return queued.id;
  }, [persistQueue]);

  // Process all queued actions — send each one with auth header from localStorage
  const syncQueue = useCallback(async () => {
    const queue = queueRef.current;
    if (queue.length === 0) return { success: true, synced: 0, failed: 0 };

    setIsSyncing(true);
    const remaining: QueuedAction[] = [];
    let synced = 0;
    let failed = 0;

    for (const action of queue) {
      try {
        const queryStr = SYNC_MUTATIONS[action.type];
        if (!queryStr) { remaining.push(action); failed++; continue; }

        const token = localStorage.getItem('ihub_token');
        const response = await fetch(getGraphqlUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            query: queryStr,
            variables: action.variables,
          }),
          signal: AbortSignal.timeout(15000),
        });
        const result = await response.json();
        if (result.errors) {
          console.warn(`[OfflineSync] Failed to sync ${action.type}:`, result.errors);
          remaining.push(action); // keep for retry
          failed++;
        } else {
          synced++;
        }
      } catch (err) {
        console.warn(`[OfflineSync] Error syncing ${action.type}:`, err);
        remaining.push(action); // keep for retry
        failed++;
      }
    }

    // Keep failed actions in the queue for next sync attempt
    persistQueue(remaining);
    setIsSyncing(false);

    if (synced > 0) {
      toast.success(`✅ Synced ${synced} offline action${synced > 1 ? 's' : ''}`, {
        description: failed > 0 ? `${failed} will retry on next sync` : undefined,
      });
    } else if (failed > 0) {
      toast.error(`❌ Sync failed for ${failed} action${failed > 1 ? 's' : ''}`, {
        description: 'Will retry automatically when connection improves.',
      });
    }

    return { success: failed === 0, synced, failed };
  }, [persistQueue]);

  // Toggle offline mode
  const toggleOffline = useCallback(async (offline: boolean) => {

    localStorage.setItem(OFFLINE_MODE_KEY, String(offline));
    setIsManualOffline(offline);

    if (offline) {
      try { await goOfflineMutation(); } catch { /* best effort */ }
    } else {
      try {
        await updatePresence();
        if (queueRef.current.length > 0) {
          await syncQueue();
        }
      } catch { /* best effort */ }
    }
  }, [goOfflineMutation, updatePresence, syncQueue]);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      if (queueRef.current.length > 0 && !isManualOffline) {
        await syncQueue();
      }
      try { await updatePresence(); } catch { /* best effort */ }
    };

    const handleOffline = () => {
      toast.warning('📡 You are offline', {
        description: 'Actions will be queued and synced when connection returns.',
        duration: 4000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isManualOffline, syncQueue, updatePresence]);

  return {
    isOffline,
    isManualOffline,
    isSyncing,
    queue,
    queueCount,
    toggleOffline,
    enqueueAction,
    syncQueue,
  };
}
