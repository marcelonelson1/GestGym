// src/api/enrollmentService.js
import api from './api';

const enrollmentService = {
  // Inscribir usuario en una actividad
  enroll: async (activityId) => {
    try {
      const response = await api.post('/api/activities/enroll', {
        activity_id: activityId
      });
      return response.data;
    } catch (error) {
      console.error('Error enrolling in activity:', error);
      throw error;
    }
  },
  
  // Cancelar inscripción
  cancelEnrollment: async (activityId) => {
    try {
      const response = await api.delete(`/api/activities/enroll/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Error canceling enrollment:', error);
      throw error;
    }
  },
  
  // Obtener inscripciones del usuario actual
  getUserEnrollments: async () => {
    try {
      const response = await api.get('/api/activities/enrollments');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching user enrollments:', error);
      throw error;
    }
  },
  
  // Verificar si el usuario está inscrito en una actividad
  checkEnrollment: async (activityId) => {
    try {
      const enrollments = await enrollmentService.getUserEnrollments();
      return enrollments.some(enrollment => enrollment.activityId === activityId);
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  }
};

export default enrollmentService;