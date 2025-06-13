// src/pages/Admin/CreateActivityPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityForm from '../../components/Activities/ActivityForm';
import activityService from '../../api/activityService';
import './AdminFormPages.css';

const CreateActivityPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Manejar envío del formulario
  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      await activityService.createActivity(formData);
      
      // Redirigir a la lista de actividades
      navigate('/admin/activities');
    } catch (err) {
      console.error('Error creating activity:', err);
      setError(
        err.response?.data?.error || 
        'Error al crear la actividad. Por favor, verifica los datos e intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="admin-form-page">
      <ActivityForm 
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default CreateActivityPage;