// src/pages/Activities/Activities.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaClock, FaUsers, FaDumbbell, FaCalendarAlt, FaUser, FaHeart, FaHeartBroken } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import activityService from '../../api/activityService';
import enrollmentService from '../../api/enrollmentService';
import config from '../../config';
import './Activities.css';

const Activities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState({});

  // Estilos CSS inline para el botón de búsqueda
  const searchStyles = `
    .search-input-container {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .search-input-container .filter-input {
      flex: 1;
      margin: 0;
    }
    
    .search-button {
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      white-space: nowrap;
      transition: background-color 0.2s;
    }
    
    .search-button:hover:not(:disabled) {
      background: #0056b3;
    }
    
    .search-button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    
    .spinner-small {
      width: 12px;
      height: 12px;
      border: 2px solid #ffffff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // Insertar estilos en el head
  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = searchStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  // Cargar actividades al montar el componente
  useEffect(() => {
    loadActivities();
    if (user) {
      loadUserEnrollments();
    }
  }, [user]);

  // Función para cargar actividades desde el backend
  const loadActivities = async (search = '', category = '') => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏃‍♂️ Cargando actividades con filtros:', { search, category });
      
      // Usar tu servicio con los parámetros de búsqueda y categoría
      const data = await activityService.getActivities(search, category);
      console.log('✅ Actividades recibidas del backend:', data);
      
      // Verificar que data sea un array
      if (Array.isArray(data)) {
        setActivities(data);
        setFilteredActivities(data);
        console.log(`📊 ${data.length} actividades cargadas correctamente`);
      } else {
        console.warn('⚠️ Los datos no son un array:', data);
        setActivities([]);
        setFilteredActivities([]);
      }
    } catch (err) {
      console.error('❌ Error loading activities:', err);
      setError(`Error al cargar actividades: ${err.message || 'Error desconocido'}`);
      setActivities([]);
      setFilteredActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar inscripciones del usuario usando tu servicio
  const loadUserEnrollments = async () => {
    try {
      console.log('📋 Cargando inscripciones del usuario...');
      
      // Usar tu servicio exactamente como está
      const data = await enrollmentService.getUserEnrollments();
      console.log('✅ Inscripciones recibidas:', data);
      
      // Verificar que data sea un array
      if (Array.isArray(data)) {
        setEnrollments(data);
        console.log(`📊 ${data.length} inscripciones cargadas correctamente`);
      } else {
        console.warn('⚠️ Las inscripciones no son un array:', data);
        setEnrollments([]);
      }
    } catch (err) {
      console.error('❌ Error loading enrollments:', err);
      setEnrollments([]);
    }
  };

  // Obtener categorías únicas de las actividades cargadas SOLO del backend
  const getAvailableCategories = () => {
    // Cargar TODAS las actividades primero para obtener todas las categorías disponibles
    const categories = activities
      .map(activity => activity.category)
      .filter(category => category && category.trim() !== '')
      .filter((category, index, self) => self.indexOf(category) === index)
      .sort();
    
    return categories;
  };

  // Verificar si el usuario está inscrito en una actividad
  const isUserEnrolled = (activityId) => {
    if (!enrollments || enrollments.length === 0) return false;
    
    return enrollments.some(enrollment => {
      // Verificar diferentes formatos de ID según tu backend
      const enrolledActivityId = enrollment.activity_id || 
                                 enrollment.activityId || 
                                 enrollment.ActivityID ||
                                 (enrollment.activity && enrollment.activity.id) ||
                                 (enrollment.activity && enrollment.activity.ID);
      
      return enrolledActivityId == activityId; // Usar == para comparación flexible
    });
  };

  // Manejar búsqueda - solo actualiza el estado local
  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  // Ejecutar búsqueda - hace petición al backend
  const executeSearch = async () => {
    console.log('🔍 Ejecutando búsqueda en backend:', searchTerm);
    await loadActivities(searchTerm, selectedCategory);
  };

  // Manejar filtro por categoría - hace petición al backend inmediatamente
  const handleCategoryFilter = async (category) => {
    setSelectedCategory(category);
    console.log('📂 Filtrando por categoría en backend:', category);
    // Hacer el filtrado en el backend
    await loadActivities(searchTerm, category);
  };

  // Limpiar filtros - recargar todas las actividades
  const clearFilters = async () => {
    setSearchTerm('');
    setSelectedCategory('');
    console.log('🧹 Limpiando filtros y recargando todas las actividades');
    // Recargar todas las actividades sin filtros
    await loadActivities('', '');
  };

  // Manejar Enter en el input de búsqueda
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  // Manejar inscripción usando tu servicio
  const handleEnroll = async (activityId) => {
    if (!user) {
      alert('Debes iniciar sesión para inscribirte en actividades');
      return;
    }

    try {
      setEnrollmentLoading(prev => ({ ...prev, [activityId]: true }));
      
      console.log('📝 Inscribiéndose en actividad:', activityId);
      
      // Usar tu servicio exactamente como está
      await enrollmentService.enroll(activityId);
      
      console.log('✅ Inscripción exitosa');
      
      // Recargar inscripciones para actualizar el estado
      await loadUserEnrollments();

      // Recargar actividades para actualizar el contador de capacidad
      await loadActivities(searchTerm, selectedCategory);

      alert('¡Te has inscrito exitosamente en la actividad!');
      
    } catch (err) {
      console.error('❌ Error enrolling in activity:', err);
      
      let errorMessage = 'Error al inscribirse en la actividad';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setEnrollmentLoading(prev => ({ ...prev, [activityId]: false }));
    }
  };

  // Manejar cancelación usando tu servicio
  const handleCancelEnrollment = async (activityId) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar tu inscripción?')) {
      return;
    }

    try {
      setEnrollmentLoading(prev => ({ ...prev, [activityId]: true }));
      
      console.log('❌ Cancelando inscripción en actividad:', activityId);
      
      // Usar tu servicio exactamente como está
      await enrollmentService.cancelEnrollment(activityId);
      
      console.log('✅ Cancelación exitosa');
      
      // Recargar inscripciones para actualizar el estado
      await loadUserEnrollments();

      // Recargar actividades para actualizar el contador de capacidad
      await loadActivities(searchTerm, selectedCategory);

      alert('Inscripción cancelada exitosamente');
      
    } catch (err) {
      console.error('❌ Error canceling enrollment:', err);
      
      let errorMessage = 'Error al cancelar la inscripción';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setEnrollmentLoading(prev => ({ ...prev, [activityId]: false }));
    }
  };

  // Obtener la URL de la imagen según tu estructura
  const getImageUrl = (activity) => {
    // Verificar diferentes posibles campos de imagen
    const imageField = activity.image_url || activity.imageUrl || activity.image;

    if (imageField) {
      // Si la URL ya es completa (incluye http), usarla directamente
      if (imageField.startsWith('http')) {
        return imageField;
      }
      // Si es una ruta relativa, construir URL completa con IMAGE_BASE_URL
      // El backend devuelve rutas como "/static/activities/imagen.png"
      return `${config.IMAGE_BASE_URL}${imageField}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="activities-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando actividades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activities-page">
        <div className="error-container">
          <div className="error-message">
            <h3>Error al cargar actividades</h3>
            <p>{error}</p>
            <button onClick={() => loadActivities()} className="retry-button">
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableCategories = getAvailableCategories();

  return (
    <div className="activities-page">
      {/* Hero Section */}
      <section className="activities-hero">
        <div className="activities-hero-content">
          <div className="hero-badge">
            <FaDumbbell className="badge-icon" />
            <span>Todas Nuestras Actividades</span>
          </div>
          <h1 className="activities-hero-title">
            Encuentra tu <span className="text-accent">Actividad Perfecta</span>
          </h1>
          <p className="activities-hero-subtitle">
            Explora nuestra amplia variedad de actividades diseñadas para todos los niveles y objetivos
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="filters-section">
        <div className="filters-container">
          <div className="filters-header">
            <h3>Filtrar Actividades</h3>
            <button onClick={clearFilters} className="clear-filters-btn">
              Limpiar Filtros
            </button>
          </div>

          <div className="filters-grid">
            {/* Búsqueda */}
            <div className="filter-group">
              <label className="filter-label">
                <FaSearch className="filter-icon" />
                Buscar
              </label>
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Buscar por ID, nombre, instructor..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="filter-input"
                />
                <button 
                  onClick={executeSearch}
                  className="search-button"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner-small"></div>
                  ) : (
                    <FaSearch />
                  )}
                  Buscar
                </button>
              </div>
            </div>

            {/* Categoría - Solo mostrar si hay categorías disponibles */}
            {availableCategories.length > 0 && (
              <div className="filter-group">
                <label className="filter-label">
                  <FaFilter className="filter-icon" />
                  Categoría
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todas las categorías</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="results-section">
        <div className="results-container">
          <div className="results-header">
            <h3>
              {filteredActivities.length} Actividad{filteredActivities.length !== 1 ? 'es' : ''} 
              {searchTerm || selectedCategory ? ' encontrada' + (filteredActivities.length !== 1 ? 's' : '') : ' disponible' + (filteredActivities.length !== 1 ? 's' : '')}
            </h3>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="no-activities">
              <div className="empty-state">
                <FaDumbbell className="empty-icon" />
                <h3>No se encontraron actividades</h3>
                <p>
                  {searchTerm || selectedCategory 
                    ? 'No hay actividades que coincidan con los filtros seleccionados' 
                    : 'No hay actividades disponibles en este momento'
                  }
                </p>
                {(searchTerm || selectedCategory) && (
                  <button onClick={clearFilters} className="clear-filters-btn">
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="activities-grid">
              {filteredActivities.map((activity) => {
                // Obtener ID de manera flexible
                const activityId = activity.id || activity.ID;
                const isEnrolled = isUserEnrolled(activityId);
                const isLoadingThisActivity = enrollmentLoading[activityId];
                const imageUrl = getImageUrl(activity);

                return (
                  <div key={activityId} className={`activity-card ${isEnrolled ? 'enrolled' : ''}`}>
                    {/* Imagen de la actividad */}
                    <div className="activity-image">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={activity.title} 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="placeholder-image" style={{ display: imageUrl ? 'none' : 'flex' }}>
                        <FaDumbbell className="placeholder-icon" />
                      </div>
                      {isEnrolled && (
                        <div className="enrolled-badge">
                          <FaHeart className="badge-icon" />
                          Inscrito
                        </div>
                      )}
                      {activity.category && (
                        <div className="activity-category">{activity.category}</div>
                      )}
                    </div>

                    {/* Contenido de la actividad */}
                    <div className="activity-content">
                      <h3 className="activity-title">{activity.title || 'Sin título'}</h3>
                      
                      {activity.description && (
                        <p className="activity-description">{activity.description}</p>
                      )}

                      <div className="activity-details">
                        {activity.day && (
                          <div className="detail-item">
                            <FaCalendarAlt className="detail-icon" />
                            <span>{activity.day}</span>
                          </div>
                        )}
                        
                        {activity.time && (
                          <div className="detail-item">
                            <FaClock className="detail-icon" />
                            <span>{activity.time}</span>
                          </div>
                        )}
                        
                        {activity.instructor && (
                          <div className="detail-item">
                            <FaUser className="detail-icon" />
                            <span>{activity.instructor}</span>
                          </div>
                        )}

                        {activity.capacity && (
                          <div className="detail-item">
                            <FaUsers className="detail-icon" />
                            <span>
                              {activity.enrolled !== undefined
                                ? `${activity.capacity - activity.enrolled} de ${activity.capacity} lugares disponibles`
                                : `Capacidad: ${activity.capacity}`
                              }
                            </span>
                          </div>
                        )}

                        {activity.duration && (
                          <div className="detail-item">
                            <FaClock className="detail-icon" />
                            <span>Duración: {activity.duration} min</span>
                          </div>
                        )}

                        {activity.level && (
                          <div className="detail-item">
                            <FaDumbbell className="detail-icon" />
                            <span>Nivel: {activity.level}</span>
                          </div>
                        )}

                        {activity.location && (
                          <div className="detail-item">
                            <FaUsers className="detail-icon" />
                            <span>Ubicación: {activity.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="activity-actions">
                        <Link 
                          to={`/activities/${activityId}`} 
                          className="view-details-btn"
                        >
                          Ver Detalles
                        </Link>

                        {user ? (
                          isEnrolled ? (
                            <button
                              onClick={() => handleCancelEnrollment(activityId)}
                              disabled={isLoadingThisActivity}
                              className="cancel-enrollment-btn"
                            >
                              {isLoadingThisActivity ? (
                                <>
                                  <div className="spinner"></div>
                                  Cancelando...
                                </>
                              ) : (
                                <>
                                  <FaHeartBroken />
                                  Cancelar Inscripción
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnroll(activityId)}
                              disabled={isLoadingThisActivity}
                              className="enroll-btn"
                            >
                              {isLoadingThisActivity ? (
                                <>
                                  <div className="spinner"></div>
                                  Inscribiendo...
                                </>
                              ) : (
                                <>
                                  <FaHeart />
                                  Inscribirse
                                </>
                              )}
                            </button>
                          )
                        ) : (
                          <Link to="/login" className="login-required-btn">
                            Iniciar sesión para inscribirse
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Activities;