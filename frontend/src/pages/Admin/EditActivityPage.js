// src/pages/Admin/EditActivityPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ActivityForm from '../../components/Activities/ActivityForm';
import Loading from '../../components/Common/Loading';
import activityService from '../../api/activityService';
import './AdminFormPages.css';

const EditActivityPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Cargar datos de la actividad al montar el componente
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const activityData = await activityService.getActivityById(id);
        setActivity(activityData);
      } catch (err) {
        console.error('Error fetching activity details:', err);
        setError('No se pudo cargar la actividad. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivity();
  }, [id]);
  
  // Manejar envío del formulario
  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      await activityService.updateActivity(id, formData);
      
      // Redirigir a la lista de actividades
      navigate('/admin/activities');
    } catch (err) {
      console.error('Error updating activity:', err);
      setError(
        err.response?.data?.error || 
        'Error al actualizar la actividad. Por favor, verifica los datos e intenta de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="admin-form-page">
        <Loading text="Cargando datos de la actividad..." />
      </div>
    );
  }
  
  // Si hay error al cargar los datos, mostrar mensaje
  if (error && !activity) {
    return (
      <div className="admin-form-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            className="back-button"
            onClick={() => navigate('/admin/activities')}
          >
            Volver a actividades
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-form-page">
      <ActivityForm 
        activity={activity}
        onSubmit={handleSubmit}
        loading={submitting}
        error={error}
      />
    </div>
  );
};

export default EditActivityPage;