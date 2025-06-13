const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_URL}/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  PROFILE: `${API_URL}/auth/profile`,
  CHECK_ADMIN: `${API_URL}/auth/check-admin`,
  
  // Activities
  ACTIVITIES: `${API_URL}/activities`,
  ACTIVITY: (id) => `${API_URL}/activities/${id}`,
  
  // Enrollments
  ENROLL: (id) => `${API_URL}/enrollments/${id}`,
  MY_ACTIVITIES: `${API_URL}/enrollments/my-activities`,
};

export default API_URL;