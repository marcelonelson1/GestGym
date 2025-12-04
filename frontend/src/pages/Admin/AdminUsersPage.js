import React, { useState, useEffect } from 'react';
import { getUsers, changeUserRole, deleteUser, createUser } from '../../api/adminService';
import './AdminUsersPage.css';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers(page, 10, roleFilter, searchTerm);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.pages);
      setError(null);
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    if (window.confirm(`¿Cambiar rol a ${newRole}?`)) {
      try {
        await changeUserRole(userId, newRole);
        fetchUsers();
      } catch (err) {
        alert('Error al cambiar rol');
        console.error(err);
      }
    }
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`¿Eliminar usuario ${userName}?`)) {
      try {
        await deleteUser(userId);
        fetchUsers();
      } catch (err) {
        alert('Error al eliminar usuario');
        console.error(err);
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser);
      setShowCreateModal(false);
      setNewUser({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        role: 'user'
      });
      fetchUsers();
      alert('Usuario creado exitosamente');
    } catch (err) {
      alert('Error al crear usuario: ' + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Cargando usuarios...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-users-page">
      <div className="admin-header">
        <h1>Gestión de Usuarios</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Crear Usuario
        </button>
      </div>

      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Buscar</button>
        </div>

        <select value={roleFilter} onChange={(e) => {
          setRoleFilter(e.target.value);
          setPage(1);
        }}>
          <option value="">Todos los roles</option>
          <option value="admin">Administradores</option>
          <option value="user">Usuarios</option>
        </select>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.nombre} {user.apellido}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => handleRoleChange(user.id, user.role)}
                    title={user.role === 'admin' ? 'Cambiar a Usuario' : 'Cambiar a Admin'}
                  >
                    {user.role === 'admin' ? '↓ Usuario' : '↑ Admin'}
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(user.id, `${user.nombre} ${user.apellido}`)}
                    title="Eliminar usuario"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Anterior
        </button>
        <span>Página {page} de {totalPages}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
        >
          Siguiente
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Crear Nuevo Usuario</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                  required
                  minLength={2}
                />
              </div>
              <div className="form-group">
                <label>Apellido *</label>
                <input
                  type="text"
                  value={newUser.apellido}
                  onChange={(e) => setNewUser({ ...newUser, apellido: e.target.value })}
                  required
                  minLength={2}
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Rol *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  required
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
