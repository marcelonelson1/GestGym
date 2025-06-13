// src/pages/Activities/ActivityDetailsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ActivityDetail from '../../components/Activities/ActivityDetail';
import Loading from '../../components/Common/Loading';
import activityService from '../../api/activityService';
import './ActivityDetailsPage.css';

const ActivityDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  
  // Cargar actividad al montar el componente o cambiar el ID
  useEffect(() => {
    const fetchActivityDetails = async () => {
      try {
        setLoading(true);
        const activityData = await activityService.getActivityById(id);
        setActivity(activityData);
        
        // Si el usuario está autenticado, verificar si está inscrito
        if (localStorage.getItem('auth_token')) {
          const userEnrollments = await activityService.getUserEnrollments();
          setEnrollments(userEnrollments);
          
          // Verificar si el usuario está inscrito en esta actividad
          const enrolled = userEnrollments.some(
            enrollment => enrollment.activityId === parseInt(id)
          );
          setIsEnrolled(enrolled);
        }
      } catch (err) {
        console.error('Error fetching activity details:', err);
        setError('No se pudo cargar los detalles de la actividad. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityDetails();
  }, [id]);
  
  // Manejar inscripción
  const handleEnroll = async (activityId) => {
    try {
      await activityService.enrollActivity(activityId);
      setIsEnrolled(true);
      
      // Actualizar lista de inscripciones
      const userEnrollments = await activityService.getUserEnrollments();
      setEnrollments(userEnrollments);
      
      return true;
    } catch (err) {
      console.error('Error enrolling in activity:', err);
      throw err;
    }
  };
  
  // Manejar cancelación de inscripción
  const handleCancelEnrollment = async (activityId) => {
    try {
      await activityService.cancelEnrollment(activityId);
      setIsEnrolled(false);
      
      // Actualizar lista de inscripciones
      const userEnrollments = await activityService.getUserEnrollments();
      setEnrollments(userEnrollments);
      
      return true;
    } catch (err) {
      console.error('Error canceling enrollment:', err);
      throw err;
    }
  };
  
  // Manejar eliminación (solo admin)
  const handleDelete = async (activityId) => {
    try {
      await activityService.deleteActivity(activityId);
      return true;
    } catch (err) {
      console.error('Error deleting activity:', err);
      throw err;
    }
  };
  
  // Manejar edición (solo admin)
  const handleEdit = (activityId) => {
    navigate(`/admin/activities/edit/${activityId}`);
  };
  
  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="activity-details-page">
        <Loading text="Cargando detalles de la actividad..." />
      </div>
    );
  }
  
  return (
    <div className="activity-details-page">
      <ActivityDetail
        activity={activity}
        loading={loading}
        error={error}
        onEnroll={handleEnroll}
        onCancelEnrollment={handleCancelEnrollment}
        isEnrolled={isEnrolled}
        onDelete={isAdmin() ? handleDelete : null}
        onEdit={isAdmin() ? handleEdit : null}
      />
    </div>
  );
};

export default ActivityDetailsPage;