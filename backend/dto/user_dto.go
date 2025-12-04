package dto

import (
	"curso-platform/models"
	"time"
)

// UserDTO representa un usuario en las respuestas HTTP
// Solo contiene tags JSON para serialización
type UserDTO struct {
	ID        uint      `json:"id"`
	Nombre    string    `json:"nombre"`
	Apellido  string    `json:"apellido"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	Phone     string    `json:"phone"`
	ImageURL  string    `json:"image_url"`
	LastLogin time.Time `json:"last_login"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ToUserDTO convierte un modelo de Usuario a DTO
// No incluye el password por seguridad
func ToUserDTO(user *models.Usuario) *UserDTO {
	if user == nil {
		return nil
	}

	return &UserDTO{
		ID:        user.ID,
		Nombre:    user.Nombre,
		Apellido:  user.Apellido,
		Email:     user.Email,
		Role:      user.Role,
		Phone:     user.Phone,
		ImageURL:  user.ImageURL,
		LastLogin: user.LastLogin,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
}

// ToUserDTOs convierte un slice de Usuarios a DTOs
func ToUserDTOs(users []models.Usuario) []UserDTO {
	dtos := make([]UserDTO, 0, len(users))
	for _, user := range users {
		dtos = append(dtos, *ToUserDTO(&user))
	}
	return dtos
}
