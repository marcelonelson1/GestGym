import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaSave, FaTimes } from 'react-icons/fa';
import Alert from '../Common/Alert';
import config from '../../config';
import './ActivityForm.css';

const ActivityForm = ({ activity, onSubmit, loading, error }) => {
  const navigate = useNavigate();
  const isEditing = !!activity?.id;
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    instructor: '',
    description: '',
    day: '',
    time: '',
    duration: '',
    location: '',
    capacity: '',
    level: 'principiante',
    image: null
  });
  
  const [imagePreview, setImagePreview] = useState('');
  const [alert, setAlert] = useState(null);
  const [formModified, setFormModified] = useState(false);
  
  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title || '',
        category: activity.category || '',
        instructor: activity.instructor || '',
        description: activity.description || '',
        day: activity.day || '',
        time: activity.time || '',
        duration: activity.duration ? String(activity.duration) : '',
        location: activity.location || '',
        capacity: activity.capacity ? String(activity.capacity) : '',
        level: activity.level || 'principiante',
        image: null
      });
      
      if (activity.imageUrl) {
        setImagePreview(`${config.IMAGE_BASE_URL}/${activity.imageUrl}`);
      }
    }
  }, [activity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormModified(true);
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'error', message: 'La imagen no debe superar los 5MB.' });
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAlert({ type: 'error', message: 'Solo se permiten imágenes JPG, PNG o WEBP.' });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      image: file
    }));
    
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setFormModified(true);
    
    return () => URL.revokeObjectURL(previewUrl);
  };
  
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    
    setImagePreview(isEditing && activity.imageUrl 
      ? `${config.IMAGE_BASE_URL}/${activity.imageUrl}`
      : '');
    
    setFormModified(true);
  };
  
  const validateForm = () => {
    const requiredFields = {
      title: 'El título es obligatorio',
      category: 'La categoría es obligatoria',
      instructor: 'El instructor es obligatorio',
      day: 'El día es obligatorio',
      time: 'La hora es obligatoria',
      duration: 'La duración es obligatoria',
      capacity: 'La capacidad es obligatoria'
    };

    for (const [field, message] of Object.entries(requiredFields)) {
      if (!formData[field]) {
        setAlert({ type: 'error', message });
        return false;
      }
    }

    if (!isEditing && !formData.image && !imagePreview) {
      setAlert({ type: 'error', message: 'Debes seleccionar una imagen' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const dataToSubmit = {
      ...formData,
      duration: parseInt(formData.duration, 10),
      capacity: parseInt(formData.capacity, 10)
    };
    
    onSubmit(dataToSubmit);
  };
  
  return (
    <div className="activity-form-container">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
      
      <form className="activity-form" onSubmit={handleSubmit}>
        <h2>{isEditing ? 'Editar Actividad' : 'Crear Nueva Actividad'}</h2>
        
        <div className="form-grid">
          <div className="form-column">
            <div className="form-group">
              <label>Título *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Categoría *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar categoría</option>
                {config.CATEGORIES?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Instructor *</label>
              <input
                type="text"
                name="instructor"
                value={formData.instructor}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Día *</label>
              <select
                name="day"
                value={formData.day}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar día</option>
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-column">
            <div className="form-group">
              <label>Hora *</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Duración (min) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="15"
                max="240"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Capacidad *</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Nivel</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
              >
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
            
            <div className="form-group image-upload">
              <label>Imagen{!isEditing && ' *'}</label>
              <div className="image-upload-container">
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button type="button" onClick={handleRemoveImage}>
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <input
                      type="file"
                      id="image-upload"
                      onChange={handleImageChange}
                      accept="image/jpeg, image/png, image/webp"
                    />
                    <label htmlFor="image-upload">
                      <FaUpload /> Seleccionar imagen
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" disabled={loading}>
            <FaSave /> {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
        
        {error && <div className="form-error">{error}</div>}
      </form>
    </div>
  );
};

export default ActivityForm;