package services

import (
	"curso-platform/dto"
	"curso-platform/models"
	"os"
)

// IAuthService define la interfaz para el servicio de autenticación
type IAuthService interface {
	Register(req dto.RegisterRequest) error
	Login(req dto.LoginRequest) (*dto.AuthResponseDTO, error)
	RefreshToken(userID uint, role string) (string, error)
	ChangeUserRole(userID uint, newRole string) (*dto.UserDTO, error)
	ChangePassword(userID uint, currentPassword, newPassword string) error
}

// IUserService define la interfaz para el servicio de usuarios
type IUserService interface {
	GetUserByID(id uint) (*models.Usuario, error)
	GetUserByEmail(email string) (*models.Usuario, error)
	UpdateProfile(userID uint, req dto.UpdateProfileRequest) (*models.Usuario, error)
	UploadProfileImage(userID uint, file *os.File, filename string, fileSize int64) (string, error)
	ListUsers(page, limit int, role, search string) ([]models.Usuario, int64, error)
	DeleteUser(id uint, adminID uint) error
}

// IActivityService define la interfaz para el servicio de actividades
// Retorna DTOs en lugar de modelos
type IActivityService interface {
	GetActivities(search, category string) ([]dto.ActivityDTO, error)
	GetActivityByID(id uint) (*dto.ActivityDTO, error)
	CreateActivity(req dto.CreateActivityRequest, imageURL string) (*dto.ActivityDTO, error)
	UpdateActivity(id uint, req dto.UpdateActivityRequest, imageURL string) (*dto.ActivityDTO, error)
	DeleteActivity(id uint) error
	EnrollUser(userID, activityID uint) error
	CancelEnrollment(userID, activityID uint) error
}

// IEnrollmentService define la interfaz para el servicio de inscripciones
type IEnrollmentService interface {
	Enroll(userID, activityID uint) (*dto.EnrollmentDTO, error)
	CancelEnrollment(userID, activityID uint) error
	GetUserEnrollments(userID uint) ([]dto.EnrollmentDTO, error)
	GetUserActivities(userID uint) ([]dto.ActivityDTO, error)
	GetActivityEnrollments(activityID uint) ([]dto.EnrollmentDTO, error)
}

// IContactService define la interfaz para el servicio de contacto
type IContactService interface {
	SendContactMessage(req dto.ContactRequest) error
	GetAllMessages() ([]models.ContactMessage, error)
	GetMessageByID(id uint) (*models.ContactMessage, error)
	UpdateMessageStatus(id uint, action string) (*models.ContactMessage, error)
	DeleteMessage(id uint) error
	ReplyToMessage(id uint, replyText string) error
}

// IPasswordResetService define la interfaz para el servicio de reseteo de contraseña
type IPasswordResetService interface {
	GenerateResetToken(email string) (*models.PasswordReset, error)
	ValidateResetToken(token string) (*models.PasswordReset, error)
	ResetPassword(token string, newPassword string) error
	SendPasswordResetEmail(email, name, resetLink string) error
}
