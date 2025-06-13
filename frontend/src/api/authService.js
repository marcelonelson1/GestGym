// src/api/authService.js (Corregido - Errores ESLint)
import api, { apiWithRetry } from './api';
import axios from 'axios';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const TOKEN_EXPIRY_KEY = 'token_expiry';

const authService = {
  // Iniciar sesión
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Guardar token y datos de usuario en localStorage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // Establecer fecha de expiración del token (si el servidor no la proporciona, asumimos 24 horas)
      const expiresIn = response.data.expiresIn || 24 * 60 * 60 * 1000; // 24 horas en milisegundos
      const expiryTime = new Date().getTime() + expiresIn;
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      // Configurar el token para futuras solicitudes
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return user;
    } catch (error) {
      console.error('Error durante login:', error);
      throw error;
    }
  },
  
  // Registrar nuevo usuario
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error durante registro:', error);
      throw error;
    }
  },
  
  // Cerrar sesión
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    delete api.defaults.headers.common['Authorization'];
  },
  
  // Verificar si el usuario está autenticado y el token no ha expirado
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    
    // Verificar si el token ha expirado
    const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry, 10);
      const currentTime = new Date().getTime();
      
      if (currentTime > expiryTime) {
        // El token ha expirado, limpiar datos y devolver false
        authService.logout();
        return false;
      }
    }
    
    return true;
  },
  
  // Obtener datos del usuario actual
  getCurrentUser: () => {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },
  
  // Verificar si el usuario es administrador
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'admin';
  },
  
  // Refrescar token
  refreshToken: async () => {
    try {
      const response = await api.post('/api/auth/refresh-token');
      const { token, expiresIn } = response.data;
      
      localStorage.setItem(TOKEN_KEY, token);
      
      // Actualizar la fecha de expiración
      if (expiresIn) {
        const expiryTime = new Date().getTime() + expiresIn;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return token;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      authService.logout();
      throw error;
    }
  },
  
  // Cambiar contraseña
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/api/auth/profile/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  },
  
  // Obtener perfil de usuario
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      
      // Actualizar datos de usuario almacenados
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      
      return response.data.user;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  },
  
  // Actualizar perfil de usuario
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      
      // Actualizar datos de usuario almacenados
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      
      return response.data.user;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  },
  
  // Solicitar recuperación de contraseña - MÉTODO MEJORADO
  forgotPassword: async (email) => {
    try {
      console.log('📧 Enviando solicitud de recuperación para:', email);
      
      // Usar apiWithRetry para mayor confiabilidad
      const response = await apiWithRetry.post('/api/auth/forgot-password', { email });
      
      console.log('✅ Respuesta de recuperación:', response.data);
      
      // En desarrollo, buscar datos de enlace/token
      if (process.env.NODE_ENV === 'development') {
        if (response.data && response.data.resetLink) {
          console.log('🔗 Enlace de recuperación (desarrollo):', response.data.resetLink);
        }
        if (response.data && response.data.resetToken) {
          console.log('🔑 Token de recuperación (desarrollo):', response.data.resetToken);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error al solicitar recuperación:', error);
      
      // No revelar si el email existe o no en respuestas de error
      if (error.response && error.response.status === 404) {
        // Simulamos éxito incluso si el email no existe (seguridad)
        return { 
          message: "Si el email existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña." 
        };
      }
      
      throw error;
    }
  },
  
  // Validar token de recuperación - MÉTODO MEJORADO
  validateResetToken: async (token) => {
    try {
      console.log(`🔍 Validando token de recuperación: ${token}`);
      
      // Intentar primero la ruta principal
      const url = `/api/auth/reset-password/${token}/validate`;
      console.log('🌐 Intentando URL principal:', url);
      
      // Usar withRetry para mayor confiabilidad
      const response = await apiWithRetry.get(url);
      
      console.log('✅ Respuesta de validación:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error validando token con URL principal:', error);
      
      // Intentar rutas alternativas si la principal falla
      try {
        console.log('🔄 Intentando URL alternativa #1...');
        const alternativeUrl = `/api/auth/reset-password/validate/${token}`;
        const alternativeResponse = await api.get(alternativeUrl);
        console.log('✅ Respuesta alternativa #1:', alternativeResponse.data);
        return alternativeResponse.data;
      } catch (altError1) {
        console.error('❌ Error con URL alternativa #1:', altError1);
        
        try {
          console.log('🔄 Intentando URL alternativa #2...');
          const alternativeUrl2 = `/api/auth/validate-reset-token/${token}`;
          const alternativeResponse2 = await api.get(alternativeUrl2);
          console.log('✅ Respuesta alternativa #2:', alternativeResponse2.data);
          return alternativeResponse2.data;
        } catch (altError2) {
          console.error('❌ Error con URL alternativa #2:', altError2);
          
          // Si todas las rutas fallan, vamos a intentar una petición directa
          try {
            console.log('🔄 Intentando petición directa con Axios...');
            // Obtener la URL base de la API
            const apiUrl = api.defaults.baseURL || 'http://localhost:5000';
            const directUrl = `${apiUrl}/api/auth/reset-password/${token}/validate`;
            
            const directResponse = await axios.get(directUrl);
            
            console.log('✅ Respuesta directa:', directResponse.data);
            return directResponse.data;
          } catch (directError) {
            console.error('❌ Error con petición directa:', directError);
          }
        }
      }
      
      // Si todos los intentos fallaron, propagar el error original
      throw error;
    }
  },
  
  // Restablecer contraseña - MÉTODO MEJORADO
  resetPassword: async (token, password) => {
    try {
      console.log('🔐 Enviando solicitud de restablecimiento con token:', token);
      
      // Usar apiWithRetry para mayor confiabilidad
      const response = await apiWithRetry.post('/api/auth/reset-password', {
        token,
        password
      });
      
      console.log('✅ Respuesta de restablecimiento:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al restablecer contraseña:', error);
      
      // Intentar con estructura alternativa si la principal falla
      try {
        console.log('🔄 Intentando estructura alternativa de datos...');
        const alternativeResponse = await api.post('/api/auth/reset-password', {
          resetToken: token,  // Algunas APIs usan resetToken en lugar de token
          newPassword: password  // Algunas APIs usan newPassword en lugar de password
        });
        
        console.log('✅ Respuesta con estructura alternativa:', alternativeResponse.data);
        return alternativeResponse.data;
      } catch (altError) {
        console.error('❌ Error con estructura alternativa:', altError);
      }
      
      throw error;
    }
  },
  
  // Verificar la validez del token actual con el servidor
  verifyToken: async () => {
    try {
      // Hacemos una petición al perfil como manera de verificar el token
      await api.get('/api/auth/profile');
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      if (error.response && error.response.status === 401) {
        // El token es inválido o ha expirado
        authService.logout();
      }
      return false;
    }
  }
};

// Configurar token al inicio si existe
const token = localStorage.getItem(TOKEN_KEY);
if (token) {
  // También verificamos que el token no haya expirado
  const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (tokenExpiry) {
    const expiryTime = parseInt(tokenExpiry, 10);
    const currentTime = new Date().getTime();
    
    if (currentTime < expiryTime) {
      // El token aún es válido, lo configuramos
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // El token ha expirado, limpiamos todo
      authService.logout();
    }
  } else {
    // No hay info de expiración, asumimos que es válido
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

export default authService;