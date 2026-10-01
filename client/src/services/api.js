/**
 * API client service for EduProctor AI
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE_URL = API_BASE_URL ? (API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`) : '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('eduproctor_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        console.warn(`[TRIGGER-1-JWT] 401 Unauthorized encountered on ${endpoint}! Token may be expired or invalid.`, { data });
      }
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If it's a network error and a mutating request, queue it offline
    if ((err instanceof TypeError || err.message === 'Failed to fetch') && 
        ['POST', 'PUT', 'DELETE'].includes(options.method)) {
      
      console.warn(`[API] Network error on ${endpoint}, queuing request for offline sync.`);
      
      // Dynamically import to avoid circular dependency
      import('./offlineSync.js').then(module => {
        module.queueRequest(endpoint, options);
      });
      
      // Simulate success to maintain Optimistic UI
      return { success: true, offline: true, message: "Queued for offline sync" };
    }

    if (err.status === 401) {
      console.warn(`[TRIGGER-1-JWT] API 401 Error thrown on ${endpoint}:`, err.message);
    } else {
      console.error(`[API Error] ${endpoint}:`, err);
    }
    throw err;
  }
}

function buildQuery(params = {}) {
  const clean = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null') {
      clean[k] = v;
    }
  }
  const str = new URLSearchParams(clean).toString();
  return str ? `?${str}` : '';
}

// Auth API
export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  getMe: () => request('/auth/me'),
  updateProfilePhoto: (avatar) => request('/auth/profile/photo', { method: 'POST', body: { avatar } }),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: data }),
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: data }),
  getDemoUsers: () => request('/auth/demo-users')
};

// Exams API
export const examApi = {
  getAll: (params = {}) => request(`/exams${buildQuery(params)}`),
  getById: (id) => request(`/exams/${id}`),
  create: (data) => request('/exams', { method: 'POST', body: data }),
  update: (id, data) => request(`/exams/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/exams/${id}`, { method: 'DELETE' }),
  getSlots: (id) => request(`/exams/${id}/slots`),
  updateSlot: (examId, slotId, data) => request(`/exams/${examId}/slots/${slotId}`, { method: 'PATCH', body: data }),
  startAttempt: (id, payload = {}) => request(`/exams/${id}/start`, { method: 'POST', body: payload }),
  validateRollNumber: (id, payload) => request(`/exams/${id}/validate-roll-number`, { method: 'POST', body: payload }),
  saveLivenessCheck: (id, payload) => request(`/exams/${id}/liveness-check`, { method: 'POST', body: payload }),
  autoSaveAnswer: (id, payload) => request(`/exams/${id}/autosave`, { method: 'POST', body: payload }),
  submitExam: (id, payload) => request(`/exams/${id}/submit`, { method: 'POST', body: payload }),
  getAttemptResult: (attemptId) => request(`/exams/attempts/${attemptId}`)
};

// Question Bank API
export const questionApi = {
  getAll: (params = {}) => request(`/questions${buildQuery(params)}`),
  getById: (id) => request(`/questions/${id}`),
  create: (data) => request('/questions', { method: 'POST', body: data }),
  update: (id, data) => request(`/questions/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/questions/${id}`, { method: 'DELETE' })
};

// Code Execution API
export const codeApi = {
  runCode: (payload) => request('/code/run', { method: 'POST', body: payload }),
  submitCode: (payload) => request('/code/submit', { method: 'POST', body: payload })
};

// Proctoring API
export const proctorApi = {
  logEvent: (payload) => request('/proctor/event', { method: 'POST', body: payload }),
  getAttemptEvents: (attemptId) => request(`/proctor/events/${attemptId}`),
  updateEventStatus: (eventId, payload) => request(`/proctor/events/${eventId}/status`, { method: 'PUT', body: payload })
};

// Student API
export const studentApi = {
  getDashboard: () => request('/student/dashboard'),
  getPerformance: () => request('/student/performance'),
  getCompetitionMedals: () => request('/student/competition-medals'),
  getAdaptivePracticeSet: () => request('/student/practice/adaptive-set'),
  submitPracticeAnswer: (payload) => request('/student/practice/submit', { method: 'POST', body: payload })
};

// Faculty API
export const facultyApi = {
  getDashboard: () => request('/faculty/dashboard'),
  getLiveMonitoring: (examId) => request(`/faculty/monitoring/${examId}`),
  getAnalytics: (examId) => request(`/faculty/analytics/${examId}`),
  getSubmissions: (examId) => request(`/faculty/submissions/${examId}`),
  getResultsReport: (examId, params = {}) => request(`/faculty/reports/${examId}${buildQuery(params)}`),
  runSimilarityScan: (examId, payload = {}) => request(`/faculty/similarity-check/${examId}`, { method: 'POST', body: payload }),
  getSimilarityReport: (examId) => request(`/faculty/similarity-report/${examId}`),
  getIntegrityDossier: (attemptId) => request(`/faculty/integrity-dossier/${attemptId}`),
  getStudents: (params = {}) => request(`/faculty/students${buildQuery(params)}`),
  getStudentDossier: (studentId) => request(`/faculty/students/${studentId}/dossier`)
};

// Admin API
export const adminApi = {
  getStats: () => request('/admin/stats'),
  getAnalytics: () => request('/admin/analytics'),
  getSettings: () => request('/admin/settings'),
  updateSettings: (data) => request('/admin/settings', { method: 'PUT', body: data }),
  getUsers: (params = {}) => request(`/admin/users${buildQuery(params)}`),
  toggleUserStatus: (id) => request(`/admin/users/${id}/status`, { method: 'PUT' }),
  updateUserRole: (id, data) => request(`/admin/users/${id}/role`, { method: 'PUT', body: data })
};
