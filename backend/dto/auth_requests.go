package dto

// LoginRequest representa una solicitud de inicio de sesión
// Solo contiene tags de validación (binding/json)
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// RegisterRequest representa una solicitud de registro
type RegisterRequest struct {
	Nombre   string `json:"nombre" binding:"required,min=2,max=50"`
	Apellido string `json:"apellido" binding:"required,min=2,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"omitempty,oneof=admin user"`
}

// ForgotPasswordRequest representa una solicitud de recuperación de contraseña
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest representa una solicitud para restablecer la contraseña
type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

// ChangePasswordRequest representa una solicitud para cambiar la contraseña
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}
