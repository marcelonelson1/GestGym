import api from './api';

// Obtener lista de usuarios (el backend ya devuelve paginación pero la ignoramos)
// Obtener lista de usuarios
export const getUsers = async (role = '', search = '') => {
  const params = new URLSearchParams();
  
  // Paginación
  params.append('page', '1');
  params.append('limit', '1000');
  
  // Asegurar que role sea string
  if (typeof role === 'string' && (role === 'admin' || role === 'user')) {
    params.append('role', role);
  }
  
  // Asegurar que search sea string antes de usar trim
  if (search && typeof search === 'string' && search.trim() !== '') {
    params.append('search', search.trim());
  }

  const response = await api.get(`/api/admin/users?${params.toString()}`);
  return response.data;
};

// Obtener un usuario por ID
export const getUserById = async (id) => {
  const response = await api.get(`/api/admin/users/${id}`);
  return response.data;
};

// Crear un nuevo usuario (solo admin)
export const createUser = async (userData) => {
  const response = await api.post('/api/admin/users', userData);
  return response.data;
};

// Actualizar un usuario
export const updateUser = async (id, userData) => {
  const response = await api.put(`/api/admin/users/${id}`, userData);
  return response.data;
};

// Eliminar un usuario
export const deleteUser = async (id) => {
  const response = await api.delete(`/api/admin/users/${id}`);
  return response.data;
};

// Cambiar el rol de un usuario
export const changeUserRole = async (id, role) => {
  const response = await api.put(`/api/admin/users/${id}/role`, { role });
  return response.data;
};