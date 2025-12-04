package dto

// UpdateProfileRequest representa una solicitud para actualizar el perfil de un usuario
// Solo contiene tags de validación (binding/json)
type UpdateProfileRequest struct {
	Nombre   string `json:"nombre" binding:"omitempty,min=2,max=50"`
	Apellido string `json:"apellido" binding:"omitempty,min=2,max=50"`
	Email    string `json:"email" binding:"omitempty,email"`
	Phone    string `json:"phone" binding:"omitempty,max=20"`
}

// ChangeRoleRequest representa una solicitud para cambiar el rol de un usuario
type ChangeRoleRequest struct {
	Role string `json:"role" binding:"required,oneof=admin user"`
}

// NotificationSettingsRequest representa las preferencias de notificación de un usuario
type NotificationSettingsRequest struct {
	EmailNotifications bool `json:"emailNotifications"`
	NewMessages        bool `json:"newMessages"`
	NewEnrollments     bool `json:"newEnrollments"`
	SystemUpdates      bool `json:"systemUpdates"`
}
