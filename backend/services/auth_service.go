package services

import (
	"curso-platform/dto"
	"curso-platform/models"
	"curso-platform/repositories"
	"curso-platform/utils"
	"errors"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// AuthService maneja la lógica relacionada con la autenticación
type AuthService struct {
	userRepo repositories.UserRepository
}

// NewAuthService crea una nueva instancia de AuthService
func NewAuthService(userRepo repositories.UserRepository) IAuthService {
	return &AuthService{
		userRepo: userRepo,
	}
}

// Register registra un nuevo usuario
func (s *AuthService) Register(req dto.RegisterRequest) error {
	// Verificar si el email ya existe
	existingUser, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return utils.ErrDatabaseError
	}
	if existingUser != nil {
		return utils.ErrEmailExists
	}

	// Hash de la contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("error al procesar la contraseña")
	}

	// Establecer rol por defecto si no se proporciona
	role := req.Role
	if role == "" {
		role = "user" // Por defecto, todos los usuarios son "user"
	}

	// Crear nuevo usuario
	user := models.Usuario{
		Nombre:   req.Nombre,
		Apellido: req.Apellido,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     role,
	}

	_, err = s.userRepo.Create(&user)
	if err != nil {
		return errors.New("error al crear usuario")
	}

	return nil
}

// Login inicia sesión de un usuario
func (s *AuthService) Login(req dto.LoginRequest) (*dto.AuthResponseDTO, error) {
	// Buscar usuario por email
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, utils.ErrDatabaseError
	}
	if user == nil {
		return nil, utils.ErrInvalidLogin
	}

	// Verificar contraseña
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, utils.ErrInvalidLogin
	}

	// Actualizar última conexión
	now := time.Now()
	if err := s.userRepo.UpdateField(user.ID, "last_login", now); err != nil {
		// Solo registramos el error, no detenemos el proceso de login
		log.Printf("Error al actualizar última conexión: %v", err)
	}

	// Generar token JWT
	token, err := utils.GenerateToken(user.ID, user.Role)
	if err != nil {
		return nil, errors.New("error al generar token")
	}

	// Actualizar last_login en la instancia local para devolverla en la respuesta
	user.LastLogin = now

	// Convertir a DTO (la conversión automáticamente excluye el password)
	userDTO := dto.ToUserDTO(user)

	// Preparar respuesta usando DTO
	response := &dto.AuthResponseDTO{
		Token: token,
		User:  *userDTO,
	}

	return response, nil
}

// RefreshToken renueva el token JWT de un usuario
func (s *AuthService) RefreshToken(userID uint, role string) (string, error) {
	return utils.GenerateToken(userID, role)
}

// ChangeUserRole cambia el rol de un usuario
func (s *AuthService) ChangeUserRole(userID uint, newRole string) (*dto.UserDTO, error) {
	// Verificar que el usuario existe
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, utils.ErrDatabaseError
	}
	if user == nil {
		return nil, utils.ErrResourceNotFound
	}

	// Validar que el rol sea válido
	if newRole != "admin" && newRole != "user" {
		return nil, errors.New("rol no válido")
	}

	// Actualizar rol del usuario
	if err := s.userRepo.UpdateField(userID, "role", newRole); err != nil {
		return nil, utils.ErrDatabaseError
	}

	// Obtener usuario actualizado
	updatedUser, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, utils.ErrDatabaseError
	}

	// Convertir a DTO (automáticamente excluye el password)
	return dto.ToUserDTO(updatedUser), nil
}

// ChangePassword cambia la contraseña de un usuario
func (s *AuthService) ChangePassword(userID uint, currentPassword, newPassword string) error {
	// Buscar usuario
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return utils.ErrDatabaseError
	}
	if user == nil {
		return utils.ErrUserNotFound
	}

	// Verificar contraseña actual
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword)); err != nil {
		return errors.New("contraseña actual incorrecta")
	}

	// Hash de la nueva contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("error al procesar la nueva contraseña")
	}

	// Actualizar contraseña en la BD
	if err := s.userRepo.UpdateField(userID, "password", string(hashedPassword)); err != nil {
		return utils.ErrDatabaseError
	}

	return nil
}
