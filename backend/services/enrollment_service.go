package services

import (
	"curso-platform/dto"
	"curso-platform/models"
	"curso-platform/repositories"
	"curso-platform/utils"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// EnrollmentService gestiona la lógica de negocio para inscripciones
type EnrollmentService struct {
	enrollmentRepo repositories.EnrollmentRepository
	activityRepo   repositories.ActivityRepository
	db             *gorm.DB // Necesario para transacciones
}

// NewEnrollmentService crea una nueva instancia del servicio de inscripciones
func NewEnrollmentService(enrollmentRepo repositories.EnrollmentRepository, activityRepo repositories.ActivityRepository, db *gorm.DB) IEnrollmentService {
	return &EnrollmentService{
		enrollmentRepo: enrollmentRepo,
		activityRepo:   activityRepo,
		db:             db,
	}
}

// Enroll inscribe a un usuario en una actividad
func (s *EnrollmentService) Enroll(userID uint, activityID uint) (*dto.EnrollmentDTO, error) {
	// Verificar si la actividad existe
	activity, err := s.activityRepo.FindByID(activityID)
	if err != nil {
		return nil, err
	}
	if activity == nil {
		return nil, utils.ErrResourceNotFound
	}

	// Verificar si hay cupo disponible
	if activity.Enrolled >= activity.Capacity {
		return nil, errors.New("no hay cupo disponible para esta actividad")
	}

	// Verificar si el usuario ya está inscrito
	existingEnrollment, err := s.enrollmentRepo.FindByUserAndActivity(userID, activityID)
	if err != nil {
		return nil, err
	}
	if existingEnrollment != nil {
		return nil, errors.New("ya estás inscrito en esta actividad")
	}

	// Iniciar transacción
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Crear la inscripción
	enrollment := models.Enrollment{
		UserID:     userID,
		ActivityID: activityID,
		EnrolledAt: time.Now(),
		Status:     "active",
	}

	// Guardar la inscripción
	if err := tx.Create(&enrollment).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("error al crear la inscripción: %w", err)
	}

	// Incrementar el contador de inscripciones
	if err := tx.Model(&models.Activity{}).
		Where("id = ?", activityID).
		Update("enrolled", gorm.Expr("enrolled + ?", 1)).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("error al actualizar contador de inscripciones: %w", err)
	}

	// Confirmar transacción
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("error al confirmar la inscripción: %w", err)
	}

	return dto.ToEnrollmentDTO(&enrollment), nil
}

// CancelEnrollment cancela la inscripción de un usuario
func (s *EnrollmentService) CancelEnrollment(userID, activityID uint) error {
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

	// Eliminar la inscripción
	if err := tx.Where("user_id = ? AND activity_id = ?", userID, activityID).
		Delete(&models.Enrollment{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error al eliminar inscripción: %w", err)
	}

	// Decrementar el contador de inscripciones
	if activity.Enrolled > 0 {
		if err := tx.Model(&models.Activity{}).
			Where("id = ?", activityID).
			Update("enrolled", gorm.Expr("enrolled - ?", 1)).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("error al actualizar contador de inscripciones: %w", err)
		}
	}

	// Confirmar transacción
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("error al confirmar cancelación: %w", err)
	}

	return nil
}

// GetUserEnrollments obtiene todas las inscripciones de un usuario
func (s *EnrollmentService) GetUserEnrollments(userID uint) ([]dto.EnrollmentDTO, error) {
	enrollments, err := s.enrollmentRepo.FindByUser(userID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener inscripciones del usuario: %w", err)
	}

	return dto.ToEnrollmentDTOs(enrollments), nil
}

// GetUserActivities obtiene las actividades en las que está inscrito el usuario
func (s *EnrollmentService) GetUserActivities(userID uint) ([]dto.ActivityDTO, error) {
	// Obtener inscripciones del usuario
	enrollments, err := s.enrollmentRepo.FindByUser(userID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener inscripciones: %w", err)
	}

	// Extraer IDs de actividades
	var activityIDs []uint
	for _, enrollment := range enrollments {
		if enrollment.Status == "active" {
			activityIDs = append(activityIDs, enrollment.ActivityID)
		}
	}

	if len(activityIDs) == 0 {
		return []dto.ActivityDTO{}, nil
	}

	// Obtener actividades
	activities, err := s.activityRepo.FindByIDs(activityIDs)
	if err != nil {
		return nil, fmt.Errorf("error al obtener actividades: %w", err)
	}

	return dto.ToActivityDTOs(activities), nil
}

// GetActivityEnrollments obtiene todas las inscripciones para una actividad específica
func (s *EnrollmentService) GetActivityEnrollments(activityID uint) ([]dto.EnrollmentDTO, error) {
	enrollments, err := s.enrollmentRepo.FindByActivity(activityID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener inscripciones de la actividad: %w", err)
	}

	return dto.ToEnrollmentDTOs(enrollments), nil
}
