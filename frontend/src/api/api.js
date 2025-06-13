// src/api/api.js - Versión optimizada sin loops
import axios from 'axios';
import config from '../config';

// Variable para evitar múltiples redirects
let isRedirecting = false;

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Interceptor para añadir token a las peticiones
api.interceptors.request.use(
  config => {
    // USAR 'token' en lugar de 'auth_token' para consistencia
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Logs MÁS SIMPLES - solo para APIs críticas
    if (process.env.NODE_ENV === 'production') {
      // Solo loggear si no es una petición de perfil repetitiva
      if (!config.url.includes('/api/auth/profile')) {
        console.log(`🚀 Petición: ${config.method?.toUpperCase()} ${config.url}`);
        if (config.data && !config.url.includes('password')) {
          console.log('📦 Datos enviados:', config.data);
        }
      }
    }
    
    return config;
  },
  error => {
    console.error('Error en configuración de la petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores y respuestas
api.interceptors.response.use(
  response => {
    // Logs MÁS SIMPLES - evitar spam de logs
    if (process.env.NODE_ENV === 'development') {
      // Solo loggear si no es una petición de perfil repetitiva
      if (!response.config.url.includes('/api/auth/profile')) {
        console.log(`✅ Respuesta: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        console.log('📦 Datos recibidos:', response.data);
      }
    }
    
    return response;
  },
  error => {
    // Log de error solo para casos importantes
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error en petición API:', error);
      
      if (error.response) {
        console.error('Datos del error:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
        console.error('Encabezados:', error.response.headers);
      }
    }
    
    // Manejar errores de autenticación (401) SIN causar loops
    if (error.response?.status === 401 && !isRedirecting) {
      const authRoutes = [
        '/api/auth/login', 
        '/api/auth/register',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        '/api/auth/reset-password/validate'
      ];
      
      const isAuthRoute = authRoutes.some(route => error.config.url.includes(route));
      
      // NO redirigir automáticamente - dejar que AuthContext maneje esto
      if (!isAuthRoute) {
        console.warn('🔑 Token inválido detectado');
        
        // Solo limpiar localStorage, NO redirigir automáticamente
        // El AuthContext debería manejar la redirección
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Marcar que hay un problema de auth pero no redirigir aquí
        // para evitar conflictos con el AuthContext
      }
    }
    
    return Promise.reject(error);
  }
);

// Función auxiliar para reintento (simplificada)
export const withRetry = async (apiCall, maxRetries = 1) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = 1000; // Delay fijo de 1 segundo
        console.log(`🔄 Reintentando petición (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Solo reintentar en errores de red, NO en errores 400/401/403/404
      const shouldRetry = !error.response || 
                          error.code === 'ECONNABORTED' || 
                          error.message.includes('timeout');
      
      if (!shouldRetry || attempt === maxRetries) {
        break;
      }
    }
  }
  
  throw lastError;
};

// API con reintento (simplificado)
export const apiWithRetry = {
  get: (url, config) => withRetry(() => api.get(url, config)),
  post: (url, data, config) => withRetry(() => api.post(url, data, config)),
  put: (url, data, config) => withRetry(() => api.put(url, data, config)),
  delete: (url, config) => withRetry(() => api.delete(url, config)),
  patch: (url, data, config) => withRetry(() => api.patch(url, data, config)),
};

export default api;