package dto

import (
	"curso-platform/models"
	"time"
)

// ContactMessageDTO representa un mensaje de contacto en las respuestas HTTP
// Solo contiene tags JSON para serialización
type ContactMessageDTO struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Message   string    `json:"message"`
	Read      bool      `json:"read"`
	Starred   bool      `json:"starred"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ToContactMessageDTO convierte un modelo de ContactMessage a DTO
func ToContactMessageDTO(message *models.ContactMessage) *ContactMessageDTO {
	if message == nil {
		return nil
	}

	return &ContactMessageDTO{
		ID:        message.ID,
		Name:      message.Name,
		Email:     message.Email,
		Phone:     message.Phone,
		Message:   message.Message,
		Read:      message.Read,
		Starred:   message.Starred,
		CreatedAt: message.CreatedAt,
		UpdatedAt: message.UpdatedAt,
	}
}

// ToContactMessageDTOs convierte un slice de ContactMessages a DTOs
func ToContactMessageDTOs(messages []models.ContactMessage) []ContactMessageDTO {
	dtos := make([]ContactMessageDTO, 0, len(messages))
	for _, message := range messages {
		dtos = append(dtos, *ToContactMessageDTO(&message))
	}
	return dtos
}

// ContactRequest representa una solicitud de mensaje de contacto
// Solo contiene tags de validación (binding/json)
type ContactRequest struct {
	Name    string `json:"name" binding:"required,min=2,max=100"`
	Email   string `json:"email" binding:"required,email"`
	Phone   string `json:"phone" binding:"omitempty,max=20"`
	Message string `json:"message" binding:"required,min=10,max=1000"`
}
