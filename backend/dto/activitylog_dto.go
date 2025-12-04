package dto

import (
	"curso-platform/models"
	"time"
)

// ActivityLogDTO representa un registro de actividad para respuestas HTTP
// Solo contiene tags JSON para serialización
type ActivityLogDTO struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Action    string    `json:"action"`
	Details   string    `json:"details"`
	IP        string    `json:"ip"`
	UserAgent string    `json:"user_agent"`
	CreatedAt time.Time `json:"created_at"`
}

// ActivityLogDataDTO representa la respuesta con información detallada de un registro de actividad
type ActivityLogDataDTO struct {
	ID          uint      `json:"id"`
	UserID      uint      `json:"user_id"`
	UserName    string    `json:"user_name"`
	UserSurname string    `json:"user_surname"`
	FullName    string    `json:"full_name"`
	Action      string    `json:"action"`
	Details     string    `json:"details"`
	IP          string    `json:"ip"`
	UserAgent   string    `json:"user_agent"`
	CreatedAt   time.Time `json:"created_at"`
}

// ToActivityLogDTO convierte un modelo de ActivityLog a DTO
func ToActivityLogDTO(log *models.ActivityLog) *ActivityLogDTO {
	if log == nil {
		return nil
	}

	return &ActivityLogDTO{
		ID:        log.ID,
		UserID:    log.UserID,
		Action:    log.Action,
		Details:   log.Details,
		IP:        log.IP,
		UserAgent: log.UserAgent,
		CreatedAt: log.CreatedAt,
	}
}

// ToActivityLogDTOs convierte un slice de ActivityLogs a DTOs
func ToActivityLogDTOs(logs []models.ActivityLog) []ActivityLogDTO {
	dtos := make([]ActivityLogDTO, 0, len(logs))
	for _, log := range logs {
		dtos = append(dtos, *ToActivityLogDTO(&log))
	}
	return dtos
}
