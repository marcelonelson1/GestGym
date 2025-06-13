// src/components/Activities/ActivityDetail.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaClock, 
  FaUserAlt, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaTrophy, 
  FaEdit, 
  FaTrash,
  FaArrowLeft
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import Alert from '../Common/Alert';
import config from '../../config';
import './ActivityDetail.css';

const ActivityDetail = ({ 
  activity, 
  loading, 
  error, 
  onEnroll, 
  onCancelEnrollment, 
  isEnrolled,
  onDelete,
  onEdit
}) => {
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Si está cargando, mostrar spinner
  if (loading) {
    return <Loading text="Cargando detalles de la actividad..." />;
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="activity-detail-error">
        <p>Error al cargar la actividad: {error}</p>
        <button 
          className="back-button" 
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Volver
        </button>
      </div>
    );
  }

  // Si no hay actividad, mostrar mensaje
  if (!activity) {
    return (
      <div className="activity-detail-error">
        <p>No se encontró la actividad solicitada.</p>
        <button 
          className="back-button" 
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Volver
        </button>
      </div>
    );
  }

  // Formatear la URL de la imagen
  const imageUrl = activity.imageUrl 
    ? `${config.IMAGE_BASE_URL}/${activity.imageUrl}` 
    : config.DEFAULT_ACTIVITY_IMAGE;

  // Formatear categoría para mostrar
  const formatCategory = (category) => {
    const found = config.CATEGORIES.find(c => c.id === category);
    return found ? found.name : category;
  };

  // Manejar la inscripción
  const handleEnroll = async () => {
    if (!user) {
      setAlert({
        type: 'warning',
        message: 'Debes iniciar sesión para inscribirte en esta actividad.'
      });
      return;
    }

    try {
      setEnrollmentLoading(true);
      await onEnroll(activity.id);
      setAlert({
        type: 'success',
        message: '¡Te has inscrito exitosamente en esta actividad!'
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.error || 'Error al intentar inscribirse.'
      });
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Manejar la cancelación de inscripción
  const handleCancelEnrollment = async () => {
    try {
      setEnrollmentLoading(true);
      await onCancelEnrollment(activity.id);
      setAlert({
        type: 'success',
        message: 'Has cancelado tu inscripción correctamente.'
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.error || 'Error al cancelar la inscripción.'
      });
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Manejar eliminación (solo admin)
  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.')) {
      try {
        await onDelete(activity.id);
        navigate('/admin/activities');
      } catch (error) {
        setAlert({
          type: 'error',
          message: error.response?.data?.error || 'Error al eliminar la actividad.'
        });
      }
    }
  };

  return (
    <div className="activity-detail-container">
      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)} 
        />
      )}
      
      <div className="activity-detail-back">
        <button 
          className="back-button" 
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Volver
        </button>
      </div>
      
      <div className="activity-detail-content">
        <div className="activity-detail-image-container">
          <img 
            src={imageUrl} 
            alt={activity.title} 
            className="activity-detail-image" 
          />
          <div className="activity-detail-category">
            {formatCategory(activity.category)}
          </div>
        </div>
        
        <div className="activity-detail-info">
          <h1 className="activity-detail-title">{activity.title}</h1>
          
          <div className="activity-detail-meta">
            <div className="meta-item">
              <FaUserAlt className="meta-icon" />
              <span>Instructor: <strong>{activity.instructor}</strong></span>
            </div>
            
            <div className="meta-item">
              <FaClock className="meta-icon" />
              <span>Horario: <strong>{activity.schedule}</strong></span>
            </div>
            
            {activity.duration && (
              <div className="meta-item">
                <FaCalendarAlt className="meta-icon" />
                <span>Duración: <strong>{activity.duration}</strong></span>
              </div>
            )}
            
            {activity.location && (
              <div className="meta-item">
                <FaMapMarkerAlt className="meta-icon" />
                <span>Ubicación: <strong>{activity.location}</strong></span>
              </div>
            )}
            
            {activity.capacity && (
              <div className="meta-item">
                <FaUsers className="meta-icon" />
                <span>Capacidad: <strong>{activity.capacity} personas</strong></span>
              </div>
            )}
            
            {activity.level && (
              <div className="meta-item">
                <FaTrophy className="meta-icon" />
                <span>Nivel: <strong>{activity.level}</strong></span>
              </div>
            )}
          </div>
          
          <div className="activity-detail-description">
            <h3>Descripción</h3>
            <p>{activity.description}</p>
          </div>
          
          <div className="activity-detail-actions">
            {isAdmin() ? (
              // Acciones para administradores
              <>
                <button 
                  className="activity-action-button edit"
                  onClick={() => onEdit(activity.id)}
                >
                  <FaEdit /> Editar Actividad
                </button>
                <button 
                  className="activity-action-button delete"
                  onClick={handleDelete}
                >
                  <FaTrash /> Eliminar Actividad
                </button>
              </>
            ) : (
              // Acciones para usuarios normales
              user ? (
                isEnrolled ? (
                  <button 
                    className="activity-action-button cancel"
                    onClick={handleCancelEnrollment}
                    disabled={enrollmentLoading}
                  >
                    {enrollmentLoading ? 'Procesando...' : 'Cancelar Inscripción'}
                  </button>
                ) : (
                  <button 
                    className="activity-action-button enroll"
                    onClick={handleEnroll}
                    disabled={enrollmentLoading}
                  >
                    {enrollmentLoading ? 'Procesando...' : 'Inscribirse'}
                  </button>
                )
              ) : (
                <button 
                  className="activity-action-button login"
                  onClick={() => navigate('/login')}
                >
                  Iniciar Sesión para Inscribirse
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;