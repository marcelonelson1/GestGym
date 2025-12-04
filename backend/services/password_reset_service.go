package services

import (
	"curso-platform/models"
	"curso-platform/repositories"
	"curso-platform/utils"
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// PasswordResetService estructura para manejar la lógica de restablecimiento de contraseñas
type PasswordResetService struct {
	passwordResetRepo repositories.PasswordResetRepository
	userRepo          repositories.UserRepository
}

// NewPasswordResetService crea una nueva instancia del servicio de restablecimiento de contraseñas
func NewPasswordResetService(passwordResetRepo repositories.PasswordResetRepository, userRepo repositories.UserRepository) IPasswordResetService {
	return &PasswordResetService{
		passwordResetRepo: passwordResetRepo,
		userRepo:          userRepo,
	}
}

// GenerateResetToken genera un token de restablecimiento para un usuario
func (s *PasswordResetService) GenerateResetToken(email string) (*models.PasswordReset, error) {
	log.Printf("Generando token de recuperación para email: %s", email)

	// Verificar si el email existe
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		log.Printf("Error de DB al buscar email: %v", err)
		return nil, errors.New("email no encontrado")
	}
	if user == nil {
		log.Printf("Email no encontrado: %s", email)
		return nil, errors.New("email no encontrado")
	}

	log.Printf("Usuario encontrado con ID: %d, Nombre: %s", user.ID, user.Nombre)

	// Generar token único
	tokenStr := uuid.New().String()
	log.Printf("Token generado: %s", tokenStr)

	// Crear el objeto de reset de contraseña
	reset := &models.PasswordReset{
		Email:     email,
		Token:     tokenStr,
		ExpiresAt: time.Now().Add(24 * time.Hour), // Token válido por 24 horas
		Used:      false,
	}

	// Eliminar tokens anteriores para el mismo email
	if err := s.passwordResetRepo.DeleteByEmail(email); err != nil {
		log.Printf("Error al eliminar tokens anteriores: %v", err)
	} else {
		log.Println("Tokens anteriores eliminados correctamente")
	}

	// Guardar el nuevo token
	createdReset, err := s.passwordResetRepo.Create(reset)
	if err != nil {
		log.Printf("Error al crear token en la base de datos: %v", err)
		return nil, err
	}

	log.Printf("Token guardado correctamente en la base de datos con ID: %d", createdReset.ID)

	// Verificar que el token se guardó correctamente
	savedReset, err := s.passwordResetRepo.FindByToken(createdReset.Token)
	if err != nil {
		log.Printf("ADVERTENCIA: No se pudo verificar el token guardado: %v", err)
	} else if savedReset != nil {
		log.Printf("Token verificado en la base de datos. ID: %d, Token: %s, Email: %s, Expira: %v",
			savedReset.ID, savedReset.Token, savedReset.Email, savedReset.ExpiresAt)
	}

	return createdReset, nil
}

// ValidateResetToken verifica si un token es válido
func (s *PasswordResetService) ValidateResetToken(token string) (*models.PasswordReset, error) {
	log.Printf("Validando token: %s", token)

	// Buscar el token
	reset, err := s.passwordResetRepo.FindByToken(token)
	if err != nil {
		log.Printf("Error de base de datos al validar token: %v", err)
		return nil, err
	}
	if reset == nil {
		log.Printf("Token no encontrado: %s", token)
		return nil, utils.ErrInvalidToken
	}

	// Verificar si ya fue usado
	if reset.Used {
		log.Printf("Token ya fue usado: %s", token)
		return nil, errors.New("el enlace de recuperación ya fue utilizado")
	}

	// Verificar si expiró
	if reset.ExpiresAt.Before(time.Now()) {
		log.Printf("Token expirado: %s, expiró el: %v", token, reset.ExpiresAt)
		return nil, errors.New("el enlace de recuperación ha expirado")
	}

	log.Printf("Token válido para email: %s, expira en: %v", reset.Email, reset.ExpiresAt)
	return reset, nil
}

// ResetPassword restablece la contraseña del usuario
func (s *PasswordResetService) ResetPassword(token string, newPassword string) error {
	log.Printf("Intentando restablecer contraseña con token: %s", token)

	// Validar el token primero
	reset, err := s.ValidateResetToken(token)
	if err != nil {
		log.Printf("Error al validar token: %v", err)
		return err
	}

	log.Printf("Token validado correctamente para email: %s", reset.Email)

	// Buscar el usuario por email
	user, err := s.userRepo.FindByEmail(reset.Email)
	if err != nil {
		log.Printf("Error al buscar usuario: %v", err)
		return utils.ErrDatabaseError
	}
	if user == nil {
		log.Printf("Usuario no encontrado para email: %s", reset.Email)
		return utils.ErrUserNotFound
	}

	log.Printf("Usuario encontrado: ID=%d, Nombre=%s", user.ID, user.Nombre)

	// Hash de la nueva contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error al generar hash de la contraseña: %v", err)
		return errors.New("error al procesar la contraseña")
	}

	log.Println("Hash de contraseña generado correctamente")

	// Actualizar la contraseña del usuario
	if err := s.userRepo.UpdateField(user.ID, "password", string(hashedPassword)); err != nil {
		log.Printf("Error al actualizar contraseña en la base de datos: %v", err)
		return utils.ErrDatabaseError
	}

	log.Printf("Contraseña actualizada correctamente para usuario ID: %d", user.ID)

	// Marcar el token como usado
	if err := s.passwordResetRepo.UpdateUsed(reset.ID, true); err != nil {
		log.Printf("Error al marcar token como usado: %v", err)
		return utils.ErrDatabaseError
	}

	log.Printf("Token marcado como usado correctamente: %s", token)

	return nil
}

// SendPasswordResetEmail envía un correo electrónico con el enlace de recuperación
func (s *PasswordResetService) SendPasswordResetEmail(email, name, resetLink string) error {
	log.Printf("Preparando envío de email de recuperación a: %s", email)
	log.Printf("Enlace de recuperación: %s", resetLink)

	// Preparar datos para la plantilla
	data := struct {
		Name      string
		ResetLink string
	}{
		Name:      name,
		ResetLink: resetLink,
	}

	// Renderizar la plantilla de correo
	htmlContent, err := utils.RenderEmailTemplate("reset_password", data)
	if err != nil {
		log.Printf("Error al renderizar plantilla de correo: %v", err)
		return err
	}

	log.Println("Plantilla de correo renderizada correctamente")

	// Configuración de envío de correo
	smtpHost := utils.GetEnv("SMTP_HOST", "smtp.gmail.com")
	smtpPort := utils.GetEnv("SMTP_PORT", "587")
	emailFrom := utils.GetEnv("EMAIL_FROM", "")

	log.Printf("Configuración SMTP: Host=%s, Puerto=%s, From=%s",
		smtpHost, smtpPort, emailFrom)

	// Enviar el correo
	subject := "Recuperación de contraseña"
	return utils.SendEmail(email, subject, htmlContent, "text/html; charset=\"UTF-8\"")
}
