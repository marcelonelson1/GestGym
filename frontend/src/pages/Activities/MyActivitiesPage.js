// src/pages/MyActivitiesPage/MyActivitiesPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaUser, FaArrowRight, FaDumbbell } from 'react-icons/fa';
import enrollmentService from '../../api/enrollmentService';
import activityService from '../../api/activityService';
import Loading from '../../components/Common/Loading';
import { useAuth } from '../../context/AuthContext';
import './MyActivitiesPage.css';

const MyActivitiesPage = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserActivities = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Obtener inscripciones del usuario
        const enrollmentData = await enrollmentService.getUserEnrollments();
        console.log('Enrollments:', enrollmentData);
        setEnrollments(enrollmentData);
        
        // Si hay inscripciones, obtener los detalles de las actividades
        if (enrollmentData.length > 0) {
          try {
            // Si la respuesta ya incluye las actividades, usarlas directamente
            if (enrollmentData[0].activity) {
              const activitiesData = enrollmentData.map(enrollment => enrollment.activity);
              setActivities(activitiesData);
            } else {
              // Si no, obtener las actividades individualmente
              const activityPromises = enrollmentData.map(enrollment => 
                activityService.getActivityById(enrollment.activityId || enrollment.ActivityID)
              );
              
              const activitiesData = await Promise.all(activityPromises);
              setActivities(activitiesData);
            }
          } catch (actError) {
            console.error('Error fetching activity details:', actError);
            setError('Error al cargar los detalles de las actividades');
          }
        }
      } catch (error) {
        console.error('Error fetching enrollments:', error);
        setError('Error al cargar tus inscripciones');
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivities();
  }, [user]);

  const handleCancelEnrollment = async (activityId) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar tu inscripción?')) {
      return;
    }

    try {
      await enrollmentService.cancelEnrollment(activityId);
      
      // Actualizar la lista después de cancelar
      setActivities(activities.filter(activity => activity.id !== activityId));
      setEnrollments(enrollments.filter(enrollment => 
        (enrollment.activityId || enrollment.ActivityID) !== activityId
      ));
      
      // Mensaje de éxito
      alert('Inscripción cancelada exitosamente');
    } catch (error) {
      console.error('Error canceling enrollment:', error);
      alert('Error al cancelar la inscripción');
    }
  };

  if (!user) {
    return (
      <div className="my-activities-container">
        <div className="not-logged-in">
          <FaDumbbell className="login-icon" />
          <h2>Debes iniciar sesión para ver tus actividades</h2>
          <p>Accede a tu cuenta para gestionar tus inscripciones</p>
          <Link to="/login" className="login-button">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-activities-container">
        <Loading size="large" text="Cargando tus actividades..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-activities-container">
        <div className="error-message">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-activities-container">
      <div className="page-header">
        <h1>Mis Actividades</h1>
        <p className="header-subtitle">Gestiona tus actividades deportivas</p>
      </div>
      
      {activities.length === 0 ? (
        <div className="no-activities">
          <div className="empty-state">
            <FaCalendarAlt className="empty-icon" />
            <h3>No estás inscrito en ninguna actividad</h3>
            <p>Explora nuestras actividades disponibles y únete a la que más te guste</p>
            <Link to="/activities" className="explore-button">
              Explorar Actividades <FaArrowRight />
            </Link>
          </div>
        </div>
      ) : (
        <div className="activities-grid">
          {activities.map((activity, index) => {
            const enrollment = enrollments[index];
            const enrollmentDate = enrollment?.enrolledAt || enrollment?.EnrolledAt || enrollment?.created_at;
            
            return (
              <div key={activity.id} className="activity-card enrolled">
                {activity.image_url && (
                  <div className="activity-image">
                    <img src={activity.image_url} alt={activity.title} />
                    <div className="enrolled-badge">Inscrito</div>
                  </div>
                )}
                {!activity.image_url && (
                  <div className="activity-image placeholder">
                    <FaDumbbell className="placeholder-icon" />
                    <div className="enrolled-badge">Inscrito</div>
                  </div>
                )}
                
                <div className="activity-content">
                  <h3>{activity.title}</h3>
                  {activity.description && (
                    <p className="activity-description">{activity.description}</p>
                  )}
                  
                  <div className="activity-details">
                    <div className="detail-item">
                      <FaCalendarAlt />
                      <span>{activity.day}</span>
                    </div>
                    <div className="detail-item">
                      <FaClock />
                      <span>{activity.time}</span>
                    </div>
                    <div className="detail-item">
                      <FaUser />
                      <span>{activity.instructor}</span>
                    </div>
                  </div>
                  
                  {enrollmentDate && (
                    <div className="enrollment-info">
                      <span className="enrollment-date">
                        Inscrito el: {new Date(enrollmentDate).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className="activity-actions">
                    <Link to={`/activities/${activity.id}`} className="view-details">
                      Ver Detalles
                    </Link>
                    <button 
                      onClick={() => handleCancelEnrollment(activity.id)}
                      className="cancel-enrollment"
                    >
                      Cancelar Inscripción
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyActivitiesPage;