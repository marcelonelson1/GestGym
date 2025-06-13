// src/context/AuthContext.js - Versión optimizada sin loops
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import authService from '../api/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  
  // Refs para evitar verificaciones múltiples
  const isInitializing = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (isInitializing.current || hasInitialized.current) {
      console.log('🔄 AuthContext: Inicialización ya en progreso o completada');
      return;
    }

    const checkLoggedIn = async () => {
      console.log('🚀 AuthContext: Iniciando verificación de autenticación...');
      isInitializing.current = true;
      setLoading(true);
      
      try {
        const storedUser = authService.getCurrentUser();
        
        if (storedUser && authService.isAuthenticated()) {
          console.log('👤 Usuario encontrado en localStorage, verificando token...');
          
          try {
            // Verificar token con el servidor - SOLO UNA VEZ
            const updatedUser = await authService.getProfile();
            setUser(updatedUser);
            setTokenChecked(true);
            console.log('✅ Token válido, usuario autenticado:', updatedUser.email || updatedUser.nombre);
          } catch (err) {
            console.warn('⚠️ Token inválido, cerrando sesión automáticamente');
            authService.logout();
            setUser(null);
            setTokenChecked(true);
          }
        } else {
          console.log('👻 No hay usuario almacenado o token');
          setUser(null);
          setTokenChecked(true);
        }
      } catch (err) {
        console.error('❌ Error checking authentication:', err);
        setError(err);
        setTokenChecked(true);
      } finally {
        setLoading(false);
        isInitializing.current = false;
        hasInitialized.current = true;
        console.log('🏁 AuthContext: Inicialización completada');
      }
    };

    checkLoggedIn();
  }, []); // Sin dependencias para ejecutar solo una vez

  // Iniciar sesión
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      console.log(`🔐 Iniciando sesión para: ${email}`);
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
      setTokenChecked(true);
      console.log('✅ Login exitoso');
      return loggedUser;
    } catch (err) {
      console.error('❌ Error en login:', err);
      setError(err.response?.data?.error || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registrar usuario
  const register = async (userData) => {
    setError(null);
    setLoading(true);
    try {
      console.log(`📝 Registrando usuario: ${userData.email}`);
      const result = await authService.register(userData);
      console.log('✅ Registro exitoso');
      return result;
    } catch (err) {
      console.error('❌ Error en registro:', err);
      setError(err.response?.data?.error || 'Error al registrarse');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const logout = () => {
    console.log('🚪 Cerrando sesión...');
    authService.logout();
    setUser(null);
    setTokenChecked(true);
    // Reset flags para permitir nueva inicialización si es necesario
    hasInitialized.current = false;
    isInitializing.current = false;
  };

  // Actualizar perfil
  const updateProfile = async (profileData) => {
    setError(null);
    setLoading(true);
    try {
      console.log('👤 Actualizando perfil...');
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      console.log('✅ Perfil actualizado');
      return updatedUser;
    } catch (err) {
      console.error('❌ Error actualizando perfil:', err);
      setError(err.response?.data?.error || 'Error al actualizar perfil');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verificar si el usuario es administrador
  const isAdmin = () => {
    // Verificar diferentes campos de rol que podrías tener
    return user && (user.role === 'admin' || user.rol === 'admin');
  };

  // Solicitar recuperación de contraseña
  const forgotPassword = async (email) => {
    setError(null);
    setLoading(true);
    try {
      console.log(`🔑 Solicitando recuperación de contraseña para: ${email}`);
      const result = await authService.forgotPassword(email);
      console.log('✅ Solicitud de recuperación enviada');
      return result;
    } catch (err) {
      console.error('❌ Error en forgot password:', err);
      if (err.response && err.response.status !== 200) {
        setError(err.response?.data?.error || 'Error al procesar la solicitud');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Validar token de recuperación
  const validateResetToken = async (token) => {
    setError(null);
    setLoading(true);
    try {
      console.log(`🔍 Validando token de recuperación...`);
      const result = await authService.validateResetToken(token);
      console.log('✅ Token de recuperación válido');
      return result;
    } catch (err) {
      console.error('❌ Error validando token de recuperación:', err);
      setError('El enlace para restablecer la contraseña es inválido o ha expirado');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Restablecer contraseña
  const resetPassword = async (token, password) => {
    setError(null);
    setLoading(true);
    try {
      console.log(`🔄 Restableciendo contraseña...`);
      const result = await authService.resetPassword(token, password);
      console.log('✅ Contraseña restablecida exitosamente');
      return result;
    } catch (err) {
      console.error('❌ Error restableciendo contraseña:', err);
      setError(err.response?.data?.error || 'Error al restablecer la contraseña');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verificar la validez del token manualmente - OPTIMIZADO
  const verifyToken = async () => {
    // Evitar verificaciones múltiples
    if (!authService.isAuthenticated() || isInitializing.current) {
      return false;
    }
    
    try {
      console.log('🔍 Verificando validez del token...');
      await authService.getProfile();
      console.log('✅ Token válido');
      return true;
    } catch (err) {
      console.warn('⚠️ Token verification failed, logging out');
      authService.logout();
      setUser(null);
      setTokenChecked(true);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    tokenChecked,
    login,
    register,
    logout,
    updateProfile,
    isAdmin,
    forgotPassword,     
    validateResetToken, 
    resetPassword,      
    verifyToken,        
    setError           
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};