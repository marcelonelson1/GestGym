// src/pages/Admin/AdminMessagesPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FaEnvelope, 
  FaEnvelopeOpen, 
  FaStar, 
  FaRegStar, 
  FaTrash, 
  FaReply, 
  FaSearch,
  FaFilter,
  FaPhone,
  FaUser,
  FaCalendarAlt,
  FaExclamationCircle,
  FaArrowLeft,
  FaPaperPlane,
  FaTimes
} from 'react-icons/fa';
import Loading from '../../components/Common/Loading';
import Alert from '../../components/Common/Alert';
import contactService from '../../api/contactService';
import './AdminMessagesPage.css';

const AdminMessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Estados para vista de detalles y respuesta
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showingDetails, setShowingDetails] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Función helper para obtener el ID del mensaje (adaptada al backend)
  const getMessageId = useCallback((message) => {
    if (!message) return null;
    return message.ID || message.id || null;
  }, []);

  // Función helper para obtener la fecha de creación
  const getCreatedAt = useCallback((message) => {
    if (!message) return null;
    return message.CreatedAt || message.createdAt || message.created_at;
  }, []);

  // Cargar mensajes del backend - SOLO UNA VEZ
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactService.getAllMessages();
      
      if (data && Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Error al cargar los mensajes. Por favor, intenta de nuevo más tarde.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []); // SIN dependencias para evitar loops

  // Cargar mensajes al montar el componente - SOLO UNA VEZ
  useEffect(() => {
    let mounted = true;
    
    const loadMessages = async () => {
      if (mounted) {
        await fetchMessages();
      }
    };
    
    loadMessages();
    
    return () => {
      mounted = false;
    };
  }, []); // SIN fetchMessages como dependencia

  // Filtrar y ordenar mensajes con useMemo para evitar recálculos
  const filteredMessages = useMemo(() => {
    if (!Array.isArray(messages)) return [];
    
    let filtered = messages.filter(message => message && getMessageId(message));

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((message) => {
        const name = (message.name || message.Name || '').toLowerCase();
        const email = (message.email || message.Email || '').toLowerCase();
        const messageText = (message.message || message.Message || '').toLowerCase();
        
        return name.includes(searchLower) ||
               email.includes(searchLower) ||
               messageText.includes(searchLower);
      });
    }

    // Filtrar por estado
    switch (statusFilter) {
      case 'unread':
        filtered = filtered.filter(message => !(message.read || message.Read));
        break;
      case 'read':
        filtered = filtered.filter(message => (message.read || message.Read));
        break;
      case 'starred':
        filtered = filtered.filter(message => (message.starred || message.Starred));
        break;
      default:
        break;
    }

    // Ordenar por fecha (más recientes primero)
    filtered.sort((a, b) => {
      const dateA = new Date(getCreatedAt(a) || 0);
      const dateB = new Date(getCreatedAt(b) || 0);
      return dateB - dateA;
    });

    return filtered;
  }, [messages, searchTerm, statusFilter, getMessageId, getCreatedAt]);

  // Contar mensajes no leídos
  const unreadCount = useMemo(() => {
    if (!Array.isArray(messages)) return 0;
    return messages.filter(msg => msg && !(msg.read || msg.Read)).length;
  }, [messages]);

  // Actualizar mensaje local sin recargar todo
  const updateMessageInState = useCallback((messageId, updates) => {
    setMessages(prev => 
      prev.map(msg => getMessageId(msg) === messageId ? { ...msg, ...updates } : msg)
    );
    
    if (selectedMessage && getMessageId(selectedMessage) === messageId) {
      setSelectedMessage(prev => ({ ...prev, ...updates }));
    }
  }, [selectedMessage, getMessageId]);

  // Handlers para acciones de mensajes
  const handleToggleRead = useCallback(async (messageId, currentRead) => {
    const id = messageId || getMessageId(selectedMessage);
    
    if (!id) {
      setAlert({
        type: 'error',
        message: 'Error: ID del mensaje no válido'
      });
      return;
    }

    try {
      const updatedMessage = await contactService.toggleMessageRead(id);
      updateMessageInState(id, updatedMessage);
      
      setAlert({
        type: 'success',
        message: `Mensaje marcado como ${updatedMessage.read ? 'leído' : 'no leído'}`
      });
    } catch (err) {
      console.error('Error toggling read status:', err);
      setAlert({
        type: 'error',
        message: 'Error al actualizar el estado del mensaje'
      });
    }
  }, [selectedMessage, getMessageId, updateMessageInState]);

  const handleToggleStar = useCallback(async (messageId, currentStarred) => {
    const id = messageId || getMessageId(selectedMessage);
    
    if (!id) {
      setAlert({
        type: 'error',
        message: 'Error: ID del mensaje no válido'
      });
      return;
    }

    try {
      const updatedMessage = await contactService.toggleMessageStar(id);
      updateMessageInState(id, updatedMessage);
      
      setAlert({
        type: 'success',
        message: `Mensaje ${updatedMessage.starred ? 'destacado' : 'no destacado'}`
      });
    } catch (err) {
      console.error('Error toggling star status:', err);
      setAlert({
        type: 'error',
        message: 'Error al actualizar el destacado del mensaje'
      });
    }
  }, [selectedMessage, getMessageId, updateMessageInState]);

  const handleDeleteMessage = useCallback(async (messageId, name) => {
    const id = messageId || getMessageId(selectedMessage);
    
    if (!id) {
      setAlert({
        type: 'error',
        message: 'Error: ID del mensaje no válido'
      });
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas eliminar el mensaje de ${name}? Esta acción no se puede deshacer.`)) {
      try {
        await contactService.deleteMessage(id);
        
        setMessages(prev => prev.filter(msg => getMessageId(msg) !== id));
        
        if (selectedMessage && getMessageId(selectedMessage) === id) {
          setShowingDetails(false);
          setSelectedMessage(null);
        }
        
        setAlert({
          type: 'success',
          message: 'Mensaje eliminado correctamente'
        });
      } catch (err) {
        console.error('Error deleting message:', err);
        setAlert({
          type: 'error',
          message: 'Error al eliminar el mensaje'
        });
      }
    }
  }, [selectedMessage, getMessageId]);

  const handleViewMessage = useCallback((message) => {
    if (!message) {
      setAlert({
        type: 'error',
        message: 'Error: No se puede mostrar el mensaje'
      });
      return;
    }

    setSelectedMessage(message);
    setShowingDetails(true);
    
    // Marcar como leído si no lo está - SIN llamar a handleToggleRead para evitar loops
    const isRead = message.read || message.Read;
    if (!isRead) {
      const messageId = getMessageId(message);
      if (messageId) {
        // Actualización directa sin callback para evitar dependencias
        contactService.toggleMessageRead(messageId)
          .then(updatedMessage => {
            updateMessageInState(messageId, updatedMessage);
          })
          .catch(err => {
            console.error('Error marking as read:', err);
          });
      }
    }
  }, [getMessageId, updateMessageInState]);

  const handleBackToList = useCallback(() => {
    setShowingDetails(false);
    setSelectedMessage(null);
    setReplyText('');
  }, []);

  const handleSendReply = useCallback(async (e) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      setAlert({
        type: 'error',
        message: 'Por favor, escribe un mensaje de respuesta'
      });
      return;
    }

    const messageId = getMessageId(selectedMessage);
    if (!selectedMessage || !messageId) {
      setAlert({
        type: 'error',
        message: 'Error: No se puede enviar respuesta, mensaje no válido'
      });
      return;
    }

    try {
      setSendingReply(true);
      await contactService.replyToMessage(messageId, replyText);
      
      setAlert({
        type: 'success',
        message: `Respuesta enviada correctamente a ${selectedMessage.email || selectedMessage.Email}`
      });
      
      setReplyText('');
    } catch (err) {
      console.error('Error sending reply:', err);
      setAlert({
        type: 'error',
        message: 'Error al enviar la respuesta'
      });
    } finally {
      setSendingReply(false);
    }
  }, [selectedMessage, replyText, getMessageId]);

  // Funciones de formateo
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }, []);

  const formatDateLong = useCallback((dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }, []);

  // Handlers para filtros con debounce
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setStatusFilter(e.target.value);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  // Auto-hide alert después de 5 segundos
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [alert]);

  if (loading) {
    return (
      <div className="admin-messages-page">
        <div className="admin-container">
          <Loading text="Cargando mensajes..." />
        </div>
      </div>
    );
  }

  // Vista de detalles del mensaje
  if (showingDetails && selectedMessage) {
    return (
      <div className="admin-messages-page">
        {alert && (
          <Alert 
            type={alert.type} 
            message={alert.message} 
            onClose={() => setAlert(null)} 
          />
        )}

        <div className="admin-container">
          <div className="message-detail-header">
            <button className="back-button" onClick={handleBackToList}>
              <FaArrowLeft />
              Volver a mensajes
            </button>
            
            <div className="message-actions-header">
              <button
                className={`action-button star ${(selectedMessage.starred || selectedMessage.Starred) ? 'starred' : ''}`}
                onClick={() => handleToggleStar(getMessageId(selectedMessage), selectedMessage.starred || selectedMessage.Starred)}
              >
                {(selectedMessage.starred || selectedMessage.Starred) ? <FaStar /> : <FaRegStar />}
                {(selectedMessage.starred || selectedMessage.Starred) ? 'Destacado' : 'Destacar'}
              </button>
              
              <button
                className={`action-button read ${(selectedMessage.read || selectedMessage.Read) ? 'read' : ''}`}
                onClick={() => handleToggleRead(getMessageId(selectedMessage), selectedMessage.read || selectedMessage.Read)}
              >
                {(selectedMessage.read || selectedMessage.Read) ? <FaEnvelopeOpen /> : <FaEnvelope />}
                {(selectedMessage.read || selectedMessage.Read) ? 'Marcar no leído' : 'Marcar leído'}
              </button>
              
              <button
                className="action-button delete"
                onClick={() => handleDeleteMessage(getMessageId(selectedMessage), selectedMessage.name || selectedMessage.Name)}
              >
                <FaTrash />
                Eliminar
              </button>
            </div>
          </div>

          <div className="message-detail-card">
            <div className="message-detail-header-info">
              <div className="sender-info-detail">
                <div className="sender-avatar">
                  <FaUser />
                </div>
                <div className="sender-details">
                  <h2>{selectedMessage.name || selectedMessage.Name}</h2>
                  <p className="sender-email">
                    <FaEnvelope className="detail-icon" />
                    {selectedMessage.email || selectedMessage.Email}
                  </p>
                  {(selectedMessage.phone || selectedMessage.Phone) && (
                    <p className="sender-phone">
                      <FaPhone className="detail-icon" />
                      {selectedMessage.phone || selectedMessage.Phone}
                    </p>
                  )}
                  <p className="message-date">
                    <FaCalendarAlt className="detail-icon" />
                    {formatDateLong(getCreatedAt(selectedMessage))}
                  </p>
                </div>
              </div>
              
              <div className="message-status-badges">
                <span className={`status-badge ${(selectedMessage.read || selectedMessage.Read) ? 'read' : 'unread'}`}>
                  {(selectedMessage.read || selectedMessage.Read) ? 'Leído' : 'No leído'}
                </span>
                {(selectedMessage.starred || selectedMessage.Starred) && (
                  <span className="status-badge starred">
                    <FaStar /> Destacado
                  </span>
                )}
              </div>
            </div>

            <div className="message-content-detail">
              <h3>Mensaje:</h3>
              <div className="message-text">
                {(selectedMessage.message || selectedMessage.Message || '').split('\n').map((line, index) => (
                  <p key={`message-line-${index}`}>{line}</p>
                ))}
              </div>
            </div>

            <div className="reply-section">
              <h3>
                <FaReply className="reply-icon" />
                Responder a {selectedMessage.name || selectedMessage.Name}
              </h3>
              
              <form onSubmit={handleSendReply} className="reply-form">
                <div className="form-group">
                  <label htmlFor="replyText">Tu respuesta:</label>
                  <textarea
                    id="replyText"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    rows="6"
                    required
                  />
                </div>
                
                <div className="reply-actions">
                  <button 
                    type="submit" 
                    className="send-reply-button"
                    disabled={sendingReply || !replyText.trim()}
                  >
                    {sendingReply ? (
                      <>
                        <Loading size="small" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Enviar Respuesta
                      </>
                    )}
                  </button>
                  
                  <button 
                    type="button" 
                    className="cancel-reply-button"
                    onClick={() => setReplyText('')}
                  >
                    <FaTimes />
                    Limpiar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de lista de mensajes
  return (
    <div className="admin-messages-page">
      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)} 
        />
      )}

      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">
            Mensajes de Contacto
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </h1>
        </div>

        <div className="admin-filters">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar mensajes..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          <div className="status-filter">
            <FaFilter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={handleCategoryChange}
              className="filter-select"
            >
              <option value="all">Todos los mensajes</option>
              <option value="unread">No leídos</option>
              <option value="read">Leídos</option>
              <option value="starred">Destacados</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="admin-error">
            <FaExclamationCircle />
            <p>{error}</p>
            <button onClick={fetchMessages} className="retry-button">
              Reintentar
            </button>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="no-messages">
            <FaEnvelope className="no-messages-icon" />
            <h3>No se encontraron mensajes</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'No hay mensajes que coincidan con los filtros aplicados.'
                : 'Aún no has recibido ningún mensaje de contacto.'
              }
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                className="clear-filters-button"
                onClick={clearFilters}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="messages-list">
            {filteredMessages.map((message) => {
              const messageId = getMessageId(message);
              const createdAt = getCreatedAt(message);
              
              return (
                <div 
                  key={messageId || `message-${Math.random()}`} 
                  className={`message-card ${!(message.read || message.Read) ? 'unread' : ''} ${(message.starred || message.Starred) ? 'starred' : ''}`}
                >
                  <div className="message-header">
                    <div className="message-sender">
                      <FaUser className="sender-icon" />
                      <div className="sender-info">
                        <h3>{message.name || message.Name}</h3>
                        <p className="sender-email">{message.email || message.Email}</p>
                        {(message.phone || message.Phone) && (
                          <p className="sender-phone">
                            <FaPhone className="phone-icon" />
                            {message.phone || message.Phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="message-meta">
                      <span className="message-date">
                        <FaCalendarAlt className="date-icon" />
                        {formatDate(createdAt)}
                      </span>
                      <div className="message-status">
                        {!(message.read || message.Read) && <span className="unread-indicator">Nuevo</span>}
                        {(message.starred || message.Starred) && <FaStar className="star-indicator" />}
                      </div>
                    </div>
                  </div>

                  <div className="message-preview">
                    <p>{(message.message || message.Message || '').substring(0, 150)}...</p>
                  </div>

                  <div className="message-actions">
                    <button
                      className="action-button view"
                      onClick={() => handleViewMessage(message)}
                    >
                      <FaEnvelopeOpen />
                      Ver completo
                    </button>
                    
                    <button
                      className={`action-button star ${(message.starred || message.Starred) ? 'starred' : ''}`}
                      onClick={() => handleToggleStar(messageId, message.starred || message.Starred)}
                    >
                      {(message.starred || message.Starred) ? <FaStar /> : <FaRegStar />}
                    </button>
                    
                    <button
                      className={`action-button read ${(message.read || message.Read) ? 'read' : ''}`}
                      onClick={() => handleToggleRead(messageId, message.read || message.Read)}
                    >
                      {(message.read || message.Read) ? <FaEnvelopeOpen /> : <FaEnvelope />}
                    </button>
                    
                    <button
                      className="action-button delete"
                      onClick={() => handleDeleteMessage(messageId, message.name || message.Name)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessagesPage;