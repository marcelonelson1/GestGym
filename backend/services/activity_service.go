package services

import (
	"curso-platform/dto"
	"curso-platform/models"
	"curso-platform/repositories"
	"curso-platform/utils"
	"errors"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"gorm.io/gorm"
)

// ActivityService gestiona la lógica de negocio para actividades
type ActivityService struct {
	activityRepo   repositories.ActivityRepository
	enrollmentRepo repositories.EnrollmentRepository
	db             *gorm.DB // Necesario para transacciones
}

// NewActivityService crea una nueva instancia del servicio de actividades
func NewActivityService(activityRepo repositories.ActivityRepository, enrollmentRepo repositories.EnrollmentRepository, db *gorm.DB) IActivityService {
	return &ActivityService{
		activityRepo:   activityRepo,
		enrollmentRepo: enrollmentRepo,
		db:             db,
	}
}

// GetActivities obtiene todas las actividades con filtros opcionales
// Retorna DTOs en lugar de modelos
func (s *ActivityService) GetActivities(search, category string) ([]dto.ActivityDTO, error) {
	filters := make(map[string]interface{})

	if search != "" {
		filters["search"] = search
	}

	if category != "" {
		filters["category"] = category
	}

	// Repository retorna models
	activities, err := s.activityRepo.FindAll(filters)
	if err != nil {
		return nil, err
	}

	// Convertir models a DTOs
	return dto.ToActivityDTOs(activities), nil
}

// GetActivityByID obtiene una actividad por su ID
// Retorna DTO en lugar de modelo
func (s *ActivityService) GetActivityByID(id uint) (*dto.ActivityDTO, error) {
	// Repository retorna model
	activity, err := s.activityRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if activity == nil {
		return nil, utils.ErrResourceNotFound
	}

	// Convertir model a DTO
	return dto.ToActivityDTO(activity), nil
}

// CreateActivity crea una nueva actividad
// Recibe request DTO y retorna response DTO
func (s *ActivityService) CreateActivity(req dto.CreateActivityRequest, imageURL string) (*dto.ActivityDTO, error) {
	// Convertir request a model
	activity := req.ToModel(imageURL)

	// Guardar en BD (repository retorna model)
	createdActivity, err := s.activityRepo.Create(activity)
	if err != nil {
		return nil, fmt.Errorf("error al crear la actividad: %w", err)
	}

	// Convertir model a DTO
	return dto.ToActivityDTO(createdActivity), nil
}

// UpdateActivity actualiza una actividad existente
// Recibe request DTO y retorna response DTO
func (s *ActivityService) UpdateActivity(id uint, req dto.UpdateActivityRequest, imageURL string) (*dto.ActivityDTO, error) {
	// Obtener actividad existente (repository retorna model)
	activity, err := s.activityRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if activity == nil {
		return nil, utils.ErrResourceNotFound
	}

	// Actualizar campos si se proporcionan en el request
	if req.Title != "" {
		activity.Title = req.Title
	}
	if req.Description != "" {
		activity.Description = req.Description
	}
	if req.Day != "" {
		activity.Day = req.Day
	}
	if req.Time != "" {
		activity.Time = req.Time
	}
	if req.Duration != 0 {
		activity.Duration = req.Duration
	}
	if req.Instructor != "" {
		activity.Instructor = req.Instructor
	}
	if req.Category != "" {
		activity.Category = req.Category
	}
	if req.Capacity != 0 {
		activity.Capacity = req.Capacity
	}

	// Actualizar imagen si se proporciona una nueva
	if imageURL != "" {
		// Eliminar la imagen anterior si existe
		if activity.ImageUrl != "" {
			oldImagePath := filepath.Join("static", "activities", filepath.Base(activity.ImageUrl))
			if utils.FileExists(oldImagePath) {
				os.Remove(oldImagePath)
			}
		}
		activity.ImageUrl = imageURL
	}

	// Actualizar en BD (repository retorna model)
	updatedActivity, err := s.activityRepo.Update(activity)
	if err != nil {
		return nil, fmt.Errorf("error al actualizar la actividad: %w", err)
	}

	// Convertir model a DTO
	return dto.ToActivityDTO(updatedActivity), nil
}

// DeleteActivity elimina una actividad
func (s *ActivityService) DeleteActivity(id uint) error {
	// Obtener la actividad para verificar si existe y obtener la ruta de la imagen
	activity, err := s.activityRepo.FindByID(id)
	if err != nil {
		return err
	}
	if activity == nil {
		return utils.ErrResourceNotFound
	}

	// Eliminar la imagen si existe
	if activity.ImageUrl != "" {
		imagePath := filepath.Join("static", "activities", filepath.Base(activity.ImageUrl))
		if utils.FileExists(imagePath) {
			os.Remove(imagePath)
		}
	}

	// Eliminar la actividad de la base de datos
	if err := s.activityRepo.Delete(id); err != nil {
		return fmt.Errorf("error al eliminar la actividad: %w", err)
	}

	return nil
}

// SaveActivityImage guarda la imagen de la actividad y devuelve la URL
func SaveActivityImage(file *multipart.FileHeader) (string, error) {
	// Validar extensión de archivo
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !utils.IsValidImageExtension(ext) {
		return "", errors.New("tipo de archivo no válido. Solo se permiten imágenes (jpg, jpeg, png, gif, webp)")
	}

	// Generar nombre único para el archivo
	fileName := utils.GenerateUniqueFileName(file.Filename)

	// Crear directorio si no existe
	uploadDir := filepath.Join("static", "activities")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("error al crear directorio: %w", err)
	}

	// Ruta completa del archivo
	filePath := filepath.Join(uploadDir, fileName)

	// Guardar archivo
	if err := utils.SaveUploadedFile(file, filePath); err != nil {
		return "", fmt.Errorf("error al guardar archivo: %w", err)
	}

	// Devolver URL relativa para acceso desde el frontend
	return fmt.Sprintf("/static/activities/%s", fileName), nil
}

// EnrollUser inscribe a un usuario en una actividad
func (s *ActivityService) EnrollUser(userID, activityID uint) error {
	// Verificar si la actividad existe y tiene capacidad
	activity, err := s.activityRepo.FindByID(activityID)
	if err != nil {
		return err
	}
	if activity == nil {
		return utils.ErrResourceNotFound
	}

	// Verificar si hay cupo disponible
	if activity.Enrolled >= activity.Capacity {
		return errors.New("la actividad ya está llena")
	}

	// Verificar si el usuario ya está inscrito
	existingEnrollment, err := s.enrollmentRepo.FindByUserAndActivity(userID, activityID)
	if err != nil {
		return fmt.Errorf("error al verificar inscripción: %w", err)
	}
	if existingEnrollment != nil {
		return errors.New("el usuario ya está inscrito en esta actividad")
	}

	// Crear la inscripción dentro de una transacción
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Crear enrollment usando transacción directa (el repo no maneja transacciones)
	enrollment := models.Enrollment{
		UserID:     userID,
		ActivityID: activityID,
		Status:     "active",
	}

	if err := tx.Create(&enrollment).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error al crear inscripción: %w", err)
	}

	// Actualizar contador de inscritos
	if err := tx.Model(&models.Activity{}).Where("id = ?", activityID).
		Update("enrolled", gorm.Expr("enrolled + ?", 1)).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error al actualizar contador: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("error al confirmar transacción: %w", err)
	}

	return nil
}

// CancelEnrollment cancela la inscripción de un usuario a una actividad
func (s *ActivityService) CancelEnrollment(userID, activityID uint) error {
	// Verificar si la inscripción existe
	enrollment, err := s.enrollmentRepo.FindByUserAndActivity(userID, activityID)
	if err != nil {
		return err
	}
	if enrollment == nil {
		return errors.New("inscripción no encontrada")
	}

	// Verificar si la actividad existe
	activity, err := s.activityRepo.FindByID(activityID)
	if err != nil {
		return err
	}
	if activity == nil {
		return utils.ErrResourceNotFound
	}

	// Iniciar transacción
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Eliminar la inscripción usando transacción directa
	if err := tx.Where("user_id = ? AND activity_id = ?", userID, activityID).
		Delete(&models.Enrollment{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error al eliminar inscripción: %w", err)
	}

	// Actualizar contador de inscritos
	if activity.Enrolled > 0 {
		if err := tx.Model(&models.Activity{}).Where("id = ?", activityID).
			Update("enrolled", gorm.Expr("enrolled - ?", 1)).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("error al actualizar contador: %w", err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("error al confirmar transacción: %w", err)
	}

	return nil
}
