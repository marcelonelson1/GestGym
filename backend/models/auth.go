package models

// AuthResponse representa la respuesta a una solicitud de autenticación exitosa
// Se usa internamente entre servicios
type AuthResponse struct {
	Token string  `json:"token"`
	User  Usuario `json:"user"`
}
