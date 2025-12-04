package services

import (
	"curso-platform/dto"
	"curso-platform/models"
	"curso-platform/repositories"
	"curso-platform/utils"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// UserService maneja la lógica relacionada con los usuarios
type UserService struct {
	userRepo repositories.UserRepository
}

// NewUserService crea una nueva instancia de UserService
func NewUserService(userRepo repositories.UserRepository) IUserService {
	return &UserService{
		userRepo: userRepo,
	}
}

// GetUserByID obtiene un usuario por su ID
func (s *UserService) GetUserByID(id uint) (*models.Usuario, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, utils.ErrDatabaseError
	}
	if user == nil {
		return nil, utils.ErrResourceNotFound
	}

	// No enviar la contraseña
	user.Password = ""

	return user, nil
}

// GetUserByEmail obtiene un usuario por su email
func (s *UserService) GetUserByEmail(email string) (*models.Usuario, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return nil, utils.ErrDatabaseError
	}
	if user == nil {
		return nil, utils.ErrResourceNotFound
	}

	// No enviar la contraseña
	user.Password = ""

	return user, nil
}

// UpdateProfile actualiza el perfil de un usuario
func (s *UserService) UpdateProfile(userID uint, req dto.UpdateProfileRequest) (*models.Usuario, error) {
	// Obtener usuario actual
	currentUser, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, utils.ErrDatabaseError
	}
	if currentUser == nil {
		return nil, utils.ErrResourceNotFound
	}

	// Verificar si el nuevo email ya existe (si se cambia)
	if req.Email != "" && req.Email != currentUser.Email {
		existingUser, err := s.userRepo.FindByEmail(req.Email)
		if err != nil {
			return nil, utils.ErrDatabaseError
		}
		if existingUser != nil && existingUser.ID != userID {
			return nil, utils.ErrEmailExists
		}
	}

	// Preparar updates
	updates := map[string]interface{}{}

	if req.Nombre != "" {
		updates["nombre"] = req.Nombre
	}

	if req.Apellido != "" {
		updates["apellido"] = req.Apellido
	}

	if req.Email != "" {
		updates["email"] = req.Email
	}

	if req.Phone != "" {
		updates["phone"] = req.Phone
	}

	// Actualizar usuario en la BD
	if err := s.userRepo.UpdateFields(userID, updates); err != nil {
		return nil, utils.ErrDatabaseError
	}

	// Obtener usuario actualizado
	updatedUser, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, utils.ErrDatabaseError
	}

	// No enviar contraseña en la respuesta
	updatedUser.Password = ""

	return updatedUser, nil
}

// UploadProfileImage sube una nueva imagen de perfil para el usuario
func (s *UserService) UploadProfileImage(userID uint, file *os.File, filename string, fileSize int64) (string, error) {
	// Validar tamaño (máx 2MB)
	if fileSize > 2*1024*1024 {
		return "", errors.New("la imagen no debe superar los 2MB")
	}

	// Validar tipo de archivo
	extension := filepath.Ext(filename)
	allowedExtensions := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
	}

	if !allowedExtensions[extension] {
		return "", errors.New("tipo de archivo no permitido")
	}

	// Crear directorio para imágenes de usuario si no existe
	uploadDir := "./static/profiles"
	if err := utils.CreateDirIfNotExists(uploadDir); err != nil {
		return "", err
	}

	// Nombre de archivo: user_ID.extension
	newFilename := fmt.Sprintf("user_%d%s", userID, extension)
	destinationPath := filepath.Join(uploadDir, newFilename)

	// Si ya existe un archivo anterior con el mismo nombre, eliminarlo
	_, err := os.Stat(destinationPath)
	if err == nil {
		if err := os.Remove(destinationPath); err != nil {
			return "", err
		}
	}

	// Crear nuevo archivo
	destination, err := os.Create(destinationPath)
	if err != nil {
		return "", err
	}
	defer destination.Close()

	// Leer el archivo original
	fileData, err := os.ReadFile(file.Name())
	if err != nil {
		return "", err
	}

	// Escribir en el nuevo archivo
	if _, err := destination.Write(fileData); err != nil {
		return "", err
	}

	// URL relativa para acceder a la imagen
	imageURL := "/static/profiles/" + newFilename

	// Actualizar URL de imagen en la BD
	if err := s.userRepo.UpdateField(userID, "image_url", imageURL); err != nil {
		return "", utils.ErrDatabaseError
	}

	return imageURL, nil
}

// ListUsers obtiene una lista paginada de usuarios
func (s *UserService) ListUsers(page, limit int, role, search string) ([]models.Usuario, int64, error) {
	// Calcular offset para paginación
	offset := (page - 1) * limit

	// Preparar filtros
	filters := map[string]interface{}{}
	if role != "" {
		filters["role"] = role
	}
	if search != "" {
		filters["search"] = search
	}

	// Obtener usuarios con paginación
	users, total, err := s.userRepo.FindAll(filters, limit, offset)
	if err != nil {
		return nil, 0, utils.ErrDatabaseError
	}

	// No enviar contraseñas
	for i := range users {
		users[i].Password = ""
	}

	return users, total, nil
}

// DeleteUser elimina un usuario
func (s *UserService) DeleteUser(id uint, adminID uint) error {
	// Verificar si el usuario existe
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return utils.ErrDatabaseError
	}
	if user == nil {
		return utils.ErrResourceNotFound
	}

	// Evitar que un admin elimine su propia cuenta
	if adminID == user.ID {
		return errors.New("no puedes eliminar tu propia cuenta")
	}

	// Eliminar usuario (borrado en cascada configurado en la base de datos)
	if err := s.userRepo.Delete(id); err != nil {
		return utils.ErrDatabaseError
	}

	return nil
}
