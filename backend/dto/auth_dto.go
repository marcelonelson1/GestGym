package dto

import "curso-platform/models"

// AuthResponseDTO representa la respuesta de autenticación
// Solo contiene tags JSON para serialización
type AuthResponseDTO struct {
	Token string  `json:"token"`
	User  UserDTO `json:"user"`
}

// ToAuthResponseDTO convierte una respuesta de auth del modelo a DTO
func ToAuthResponseDTO(authResponse *models.AuthResponse) *AuthResponseDTO {
	if authResponse == nil {
		return nil
	}

	return &AuthResponseDTO{
		Token: authResponse.Token,
		User:  *ToUserDTO(&authResponse.User),
	}
}
