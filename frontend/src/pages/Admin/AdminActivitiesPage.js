// src/pages/Admin/AdminActivitiesPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaExclamationCircle,
  FaSortAmountDown,
  FaSortAmountUp
} from 'react-icons/fa';
import Loading from '../../components/Common/Loading';
import Alert from '../../components/Common/Alert';
import config from '../../config';
import activityService from '../../api/activityService';
import './AdminActivitiesPage.css';

const AdminActivitiesPage = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  
  // Estados para filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Cargar actividades al montar el componente
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await activityService.getActivities();
        setActivities(data);
        applyFilters(data, searchTerm, categoryFilter, sortField, sortDirection);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Error al cargar las actividades. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);
  
  // Aplicar filtros y ordenamiento - MODIFICADO PARA INCLUIR ID
  const applyFilters = (data, search, category, field, direction) => {
    let filtered = [...data];
    
    // Filtrar por búsqueda - AHORA INCLUYE ID
    if (search) {
      const searchLower = search.toLowerCase();
      const searchAsNumber = parseInt(search); // Para buscar por ID numérico
      
      filtered = filtered.filter((activity) => {
        // Buscar en campos de texto
        const titleMatch = activity.title && activity.title.toLowerCase().includes(searchLower);
        const instructorMatch = activity.instructor && activity.instructor.toLowerCase().includes(searchLower);
        const descriptionMatch = activity.description && activity.description.toLowerCase().includes(searchLower);
        const categoryMatch = activity.category && activity.category.toLowerCase().includes(searchLower);
        
        // Buscar por ID exacto si el término de búsqueda es un número
        const idMatch = !isNaN(searchAsNumber) && activity.id === searchAsNumber;
        
        return titleMatch || instructorMatch || descriptionMatch || categoryMatch || idMatch;
      });
    }
    
    // Filtrar por categoría
    if (category) {
      filtered = filtered.filter(
        (activity) => activity.category === category
      );
    }
    
    // Ordenar resultados
    filtered.sort((a, b) => {
      // Asegurarse de que la propiedad existe en ambos objetos
      if (!a[field] && !b[field]) return 0;
      if (!a[field]) return 1;
      if (!b[field]) return -1;
      
      // Ordenar según el tipo de datos
      if (typeof a[field] === 'string') {
        return direction === 'asc'
          ? a[field].localeCompare(b[field])
          : b[field].localeCompare(a[field]);
      } else {
        return direction === 'asc'
          ? a[field] - b[field]
          : b[field] - a[field];
      }
    });
    
    setFilteredActivities(filtered);
  };
  
  // Manejar cambio en la búsqueda
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    applyFilters(activities, value, categoryFilter, sortField, sortDirection);
  };
  
  // Manejar cambio en el filtro de categoría
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategoryFilter(value);
    applyFilters(activities, searchTerm, value, sortField, sortDirection);
  };
  
  // Manejar cambio en el ordenamiento
  const handleSortChange = (field) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    applyFilters(activities, searchTerm, categoryFilter, field, direction);
  };
  
  // Manejar eliminación de actividad
  const handleDeleteActivity = async (id, title) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la actividad "${title}"? Esta acción no se puede deshacer.`)) {
      try {
        await activityService.deleteActivity(id);
        
        // Actualizar lista de actividades
        const updatedActivities = activities.filter(activity => activity.id !== id);
        setActivities(updatedActivities);
        applyFilters(updatedActivities, searchTerm, categoryFilter, sortField, sortDirection);
        
        // Mostrar mensaje de éxito
        setAlert({
          type: 'success',
          message: `La actividad "${title}" ha sido eliminada correctamente.`
        });
      } catch (err) {
        console.error('Error deleting activity:', err);
        setAlert({
          type: 'error',
          message: 'Error al eliminar la actividad. Por favor, intenta de nuevo.'
        });
      }
    }
  };
  
  // Formatear nombre de categoría
  const getCategoryName = (categoryId) => {
    const category = config.CATEGORIES.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };
  
  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="admin-activities-page">
        <div className="admin-container">
          <Loading text="Cargando actividades..." />
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-activities-page">
      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)} 
        />
      )}
      
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">Administrar Actividades</h1>
          <Link to="/admin/activities/create" className="create-button">
            <FaPlus /> Nueva Actividad
          </Link>
        </div>
        
        <div className="admin-filters">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por ID, título, instructor o descripción..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          
          <div className="category-filter">
            <FaFilter className="filter-icon" />
            <select
              value={categoryFilter}
              onChange={handleCategoryChange}
              className="filter-select"
            >
              <option value="">Todas las categorías</option>
              {config.CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {error ? (
          <div className="admin-error">
            <FaExclamationCircle />
            <p>{error}</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="no-activities">
            <p>No se encontraron actividades.</p>
            {searchTerm || categoryFilter ? (
              <button 
                className="clear-filters-button"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  applyFilters(activities, '', '', sortField, sortDirection);
                }}
              >
                Limpiar filtros
              </button>
            ) : (
              <Link to="/admin/activities/create" className="create-activity-link">
                Crear la primera actividad
              </Link>
            )}
          </div>
        ) : (
          <div className="activities-table-container">
            <table className="activities-table">
              <thead>
                <tr>
                  <th>
                    <button 
                      className="sort-button"
                      onClick={() => handleSortChange('id')}
                    >
                      ID
                      {sortField === 'id' && (
                        sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </button>
                  </th>
                  <th>Imagen</th>
                  <th>
                    <button 
                      className="sort-button"
                      onClick={() => handleSortChange('title')}
                    >
                      Título
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </button>
                  </th>
                  <th>
                    <button 
                      className="sort-button"
                      onClick={() => handleSortChange('category')}
                    >
                      Categoría
                      {sortField === 'category' && (
                        sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </button>
                  </th>
                  <th>
                    <button 
                      className="sort-button"
                      onClick={() => handleSortChange('instructor')}
                    >
                      Instructor
                      {sortField === 'instructor' && (
                        sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </button>
                  </th>
                  <th>Horario</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td className="activity-id-cell">
                      <strong>#{activity.id}</strong>
                    </td>
                    <td className="activity-image-cell">
                      <img
                        src={activity.imageUrl 
                          ? `${config.IMAGE_BASE_URL}/${activity.imageUrl}`
                          : config.DEFAULT_ACTIVITY_IMAGE}
                        alt={activity.title}
                        className="activity-thumbnail"
                      />
                    </td>
                    <td className="activity-title-cell">
                      <div className="activity-title-wrapper">
                        <Link 
                          to={`/activities/${activity.id}`}
                          className="activity-title-link"
                        >
                          {activity.title}
                        </Link>
                      </div>
                    </td>
                    <td>{getCategoryName(activity.category)}</td>
                    <td>{activity.instructor}</td>
                    <td>{activity.day} - {activity.time}</td>
                    <td className="actions-cell">
                      <button
                        className="action-button edit"
                        onClick={() => navigate(`/admin/activities/edit/${activity.id}`)}
                        title="Editar actividad"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-button delete"
                        onClick={() => handleDeleteActivity(activity.id, activity.title)}
                        title="Eliminar actividad"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivitiesPage;