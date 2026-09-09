const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.bootskills.com';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : ''
  };
};

export const moduleAccessApi = {
  async getProgress(studentId: string, courseId: string) {
    const res = await fetch(`${API_BASE}/api/module-access/progress/${studentId}?courseId=${courseId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch progress');
    return res.json();
  },

  async submitAssignment(payload: { courseId: string; moduleId: string; submissionLink?: string; fileUrl?: string }) {
    const res = await fetch(`${API_BASE}/api/module-access/submit-assignment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit assignment');
    return data;
  },

  async markLessonComplete(payload: { courseId: string; moduleId: string; lessonId: string }) {
    const res = await fetch(`${API_BASE}/api/module-access/mark-lesson-complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to mark lesson complete');
    return data;
  },

  async canAccess(courseId: string, moduleIndex: number) {
    const res = await fetch(`${API_BASE}/api/module-access/can-access?courseId=${courseId}&moduleIndex=${moduleIndex}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  async getPendingAssignments() {
    const res = await fetch(`${API_BASE}/api/module-access/pending-assignments`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch pending assignments');
    return data;
  },

  async reviewAssignment(payload: { assignmentId: string; status: 'approved' | 'rejected'; feedback?: string; score?: number }) {
    const res = await fetch(`${API_BASE}/api/module-access/review-assignment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to review assignment');
    return data;
  },

  async unlockModule(payload: { studentId: string; courseId: string; moduleIndex: number }) {
    const res = await fetch(`${API_BASE}/api/module-access/unlock-module`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to unlock module');
    return data;
  },

  async lockModule(payload: { studentId: string; courseId: string; moduleIndex: number }) {
    const res = await fetch(`${API_BASE}/api/module-access/lock-module`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to lock module');
    return data;
  },

  async forceProgress(payload: { studentId: string; courseId: string; targetModuleIndex: number }) {
    const res = await fetch(`${API_BASE}/api/module-access/force-progress`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to force progress');
    return data;
  },

  async updateAutoUnlockConfig(payload: { courseId: string; autoUnlockEnabled: boolean; autoUnlockScoreThreshold: number }) {
    const res = await fetch(`${API_BASE}/api/module-access/auto-unlock-config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update auto unlock config');
    return data;
  }
};
