// src/api/contactService.js - Versión optimizada
import api from './api'; // Usar el api.js optimizado

const contactService = {
  // Enviar mensaje de contacto (público)
  sendContactMessage: async (contactData) => {
    try {
      if (!contactData || !contactData.name || !contactData.email || !contactData.message) {
        throw new Error('Datos de contacto incompletos');
      }
      
      const response = await api.post('/api/contact', contactData);
      return response.data;
    } catch (error) {
      console.error('Error en sendContactMessage:', error);
      throw error;
    }
  },

  // Obtener todos los mensajes de contacto (admin)
  getAllMessages: async () => {
    try {
      console.log('📬 Obteniendo todos los mensajes...');
      const response = await api.get('/api/admin/messages');
      
      // Validar estructura de respuesta
      if (!response.data) {
        console.warn('⚠️ Respuesta sin data');
        return [];
      }
      
      // Manejar diferentes estructuras de respuesta del backend
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log(`📋 ${response.data.data.length} mensajes obtenidos`);
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log(`📋 ${response.data.length} mensajes obtenidos (formato directo)`);
        return response.data;
      } else {
        console.warn('⚠️ Estructura de respuesta inesperada:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error en getAllMessages:', error);
      throw error;
    }
  },

  // Obtener un mensaje específico (admin)
  getMessageById: async (id) => {
    try {
      if (!id) {
        throw new Error('ID del mensaje requerido');
      }
      
      console.log(`📨 Obteniendo mensaje ${id}...`);
      const response = await api.get(`/api/admin/messages/${id}`);
      
      if (response.data.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      } else {
        throw new Error('Mensaje no encontrado');
      }
    } catch (error) {
      console.error(`Error obteniendo mensaje ${id}:`, error);
      throw error;
    }
  },

  // Marcar mensaje como leído/no leído (admin)
  toggleMessageRead: async (id) => {
    try {
      if (!id) {
        throw new Error('ID del mensaje requerido');
      }
      
      console.log(`👁️ Cambiando estado de lectura del mensaje ${id}...`);
      const response = await api.patch(`/api/admin/messages/${id}/read`);
      
      if (response.data.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      } else {
        throw new Error('No se pudo actualizar el estado');
      }
    } catch (error) {
      console.error(`Error cambiando estado de lectura del mensaje ${id}:`, error);
      throw error;
    }
  },

  // Marcar mensaje como destacado/no destacado (admin)
  toggleMessageStar: async (id) => {
    try {
      if (!id) {
        throw new Error('ID del mensaje requerido');
      }
      
      console.log(`⭐ Cambiando estado destacado del mensaje ${id}...`);
      const response = await api.patch(`/api/admin/messages/${id}/star`);
      
      if (response.data.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      } else {
        throw new Error('No se pudo actualizar el estado');
      }
    } catch (error) {
      console.error(`Error cambiando estado destacado del mensaje ${id}:`, error);
      throw error;
    }
  },

  // Eliminar mensaje (admin)
  deleteMessage: async (id) => {
    try {
      if (!id) {
        throw new Error('ID del mensaje requerido');
      }
      
      console.log(`🗑️ Eliminando mensaje ${id}...`);
      const response = await api.delete(`/api/admin/messages/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error eliminando mensaje ${id}:`, error);
      throw error;
    }
  },

  // Responder a un mensaje (admin)
  replyToMessage: async (id, message) => {
    try {
      if (!id) {
        throw new Error('ID del mensaje requerido');
      }
      
      if (!message || !message.trim()) {
        throw new Error('Mensaje de respuesta requerido');
      }
      
      console.log(`💬 Enviando respuesta al mensaje ${id}...`);
      const response = await api.post(`/api/admin/messages/${id}/reply`, { 
        message: message.trim() 
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error enviando respuesta al mensaje ${id}:`, error);
      throw error;
    }
  },

  // Método de utilidad para verificar la conectividad
  healthCheck: async () => {
    try {
      console.log('🏥 Verificando estado del servicio...');
      const response = await api.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('Error en health check:', error);
      throw error;
    }
  }
};

export default contactService;