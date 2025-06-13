// src/api/activityService.js
import api from './api';

const activityService = {
  getActivities: async (search = '', category = '') => {
    try {
      let url = '/api/activities';
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },
  
  getActivityById: async (id) => {
    try {
      const response = await api.get(`/api/activities/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching activity ${id}:`, error);
      throw error;
    }
  },
  
  enrollActivity: async (activityId) => {
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
  
  cancelEnrollment: async (activityId) => {
    try {
      const response = await api.delete(`/api/activities/enroll/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Error canceling enrollment:', error);
      throw error;
    }
  },
  
  getUserEnrollments: async () => {
    try {
      const response = await api.get('/api/activities/enrollments');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user enrollments:', error);
      throw error;
    }
  },
  
  createActivity: async (activityData) => {
    try {
      const formData = new FormData();
      
      // Campos requeridos - Coinciden con las etiquetas form del backend
      formData.append('title', activityData.title);
      formData.append('category', activityData.category);
      formData.append('instructor', activityData.instructor);
      formData.append('day', activityData.day);
      formData.append('time', activityData.time);
      formData.append('duration', String(activityData.duration));
      formData.append('capacity', String(activityData.capacity));
      
      // Campos opcionales
      if (activityData.description) formData.append('description', activityData.description);
      if (activityData.location) formData.append('location', activityData.location);
      if (activityData.level) formData.append('level', activityData.level);
      
      // Imagen - Coincide con la etiqueta form del backend
      if (activityData.image) {
        formData.append('image', activityData.image);
      }
      
      const response = await api.post('/api/admin/activities', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },
  
  updateActivity: async (id, activityData) => {
    try {
      const formData = new FormData();
      
      // Campos requeridos
      formData.append('title', activityData.title);
      formData.append('category', activityData.category);
      formData.append('instructor', activityData.instructor);
      formData.append('day', activityData.day);
      formData.append('time', activityData.time);
      formData.append('duration', String(activityData.duration));
      formData.append('capacity', String(activityData.capacity));
      
      // Campos opcionales
      if (activityData.description) formData.append('description', activityData.description);
      if (activityData.location) formData.append('location', activityData.location);
      if (activityData.level) formData.append('level', activityData.level);
      
      // Imagen
      if (activityData.image) {
        formData.append('image', activityData.image);
      }
      
      const response = await api.put(`/api/admin/activities/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating activity ${id}:`, error);
      throw error;
    }
  },
  
  deleteActivity: async (id) => {
    try {
      const response = await api.delete(`/api/admin/activities/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting activity ${id}:`, error);
      throw error;
    }
  }
};

export default activityService;