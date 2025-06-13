// src/config.js
const config = {
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    APP_NAME: 'ClubSport',
    IMAGE_BASE_URL: process.env.REACT_APP_IMAGE_BASE_URL || 'http://localhost:5000/uploads',
    DEFAULT_PROFILE_IMAGE: '/assets/images/default-avatar.png',
    DEFAULT_ACTIVITY_IMAGE: '/assets/images/default-activity.jpg',
    CATEGORIES: [
      { id: 'fitness', name: 'Fitness' },
      { id: 'natacion', name: 'Natación' },
      { id: 'yoga', name: 'Yoga' },
      { id: 'pilates', name: 'Pilates' },
      { id: 'funcional', name: 'Entrenamiento Funcional' },
      { id: 'aerobico', name: 'Aeróbico' },
      { id: 'spinning', name: 'Spinning' },
      { id: 'artes-marciales', name: 'Artes Marciales' },
      { id: 'basketball', name: 'Basketball' },
      { id: 'futbol', name: 'Fútbol' }
    ]
  };
  
  export default config;