import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const FILE_BASE_URL = API_URL.replace(/\/api\/?$/, '');
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, confirmPassword) =>
    api.post('/auth/register', { email, password, confirmPassword }),
  verify: () => api.get('/auth/verify'),
  verifyOtp: (email, otpCode) => api.post('/auth/verify-otp', { email, otpCode }),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),

  // Comptes de gestion (directeur/secrétaire)
  loginGestion: (username, password) => api.post('/auth/login-gestion', { username, password }),
  activateAccount: (data) => api.post('/auth/activation-compte', data),
  reactivateAccount: (data) => api.post('/auth/reactivation-compte', data),
  checkUsername: (username) => api.get('/auth/username-disponible', { params: { username } }),
};

export const collegeAPI = {
  getAll: () => api.get('/colleges'),
  getByCommune: (commune, departement) =>
    api.get('/colleges/commune', { params: { commune, departement } }),
  getById: (id) => api.get(`/colleges/${id}`),
  create: (data) => api.post('/colleges', data),
  update: (id, data) => api.put(`/colleges/${id}`, data),
  delete: (id) => api.delete(`/colleges/${id}`),
  uploadSignature: (id, file) => {
    const formData = new FormData();
    formData.append('signature', file);
    return api.post(`/colleges/${id}/signature`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getStats: (id) => api.get(`/colleges/${id}/stats`),

  // Comptes de gestion
  createManagementAccounts: (id, data) => api.post(`/colleges/${id}/comptes-gestion`, data),
  getManagementAccounts: (id) => api.get(`/colleges/${id}/comptes-gestion`),
  resendManagementActivationEmails: (id) => api.post(`/colleges/${id}/comptes-gestion/resend`),
};

export const classAPI = {
  getByCollege: (collegeId) => api.get(`/classes/${collegeId}/classes`),
  getById: (classId) => api.get(`/classes/class/${classId}`),
  create: (collegeId, data) => api.post(`/classes/${collegeId}/classes`, data),
  update: (classId, data) => api.put(`/classes/class/${classId}`, data),
  delete: (classId) => api.delete(`/classes/class/${classId}`),
  // Observations
  listObservations: (classId) => api.get(`/classes/class/${classId}/observations`),
  createObservation: (classId, contenu) => api.post(`/classes/class/${classId}/observations`, { contenu }),
};

export const studentAPI = {
  getByClass: (classId) => api.get(`/students/class/${classId}`),
  getByCollege: (collegeId) => api.get(`/students/college/${collegeId}`),
  getById: (studentId) => api.get(`/students/${studentId}`),
  create: (classId, data, photo) => {
    const formData = new FormData();
    Object.keys(data).forEach((k) => formData.append(k, data[k]));
    if (photo) formData.append('photo', photo);
    return api.post(`/students/${classId}/students`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (studentId, data) => api.put(`/students/${studentId}`, data),
  updatePhoto: (studentId, photo) => {
    const formData = new FormData();
    formData.append('photo', photo);
    return api.put(`/students/${studentId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (studentId) => api.delete(`/students/${studentId}`),
};

export const importAPI = {
  validateExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/students/import/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importStudents: (classId, students) => api.post(`/students/${classId}/import`, { students }),
  downloadTemplate: () => api.get('/students/import/template', { responseType: 'blob' }),
};

export default api;