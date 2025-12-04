package dto

import (
	"curso-platform/models"
	"time"
)

// EnrollmentDTO representa una inscripción en las respuestas HTTP
// Solo contiene tags JSON para serialización
type EnrollmentDTO struct {
	ID         uint      `json:"id"`
	UserID     uint      `json:"userId"`
	ActivityID uint      `json:"activityId"`
	Status     string    `json:"status"`
	EnrolledAt time.Time `json:"enrolledAt"`
}

// EnrollmentResponseDTO es el modelo de respuesta para una inscripción que incluye detalles de la actividad
type EnrollmentResponseDTO struct {
	ID         uint        `json:"id"`
	UserID     uint        `json:"userId"`
	ActivityID uint        `json:"activityId"`
	EnrolledAt time.Time   `json:"enrolledAt"`
	Status     string      `json:"status"`
	Activity   ActivityDTO `json:"activity"`
}

// ToEnrollmentDTO convierte un modelo de Enrollment a DTO
func ToEnrollmentDTO(enrollment *models.Enrollment) *EnrollmentDTO {
	if enrollment == nil {
		return nil
	}

	return &EnrollmentDTO{
		ID:         enrollment.ID,
		UserID:     enrollment.UserID,
		ActivityID: enrollment.ActivityID,
		Status:     enrollment.Status,
		EnrolledAt: enrollment.EnrolledAt,
	}
}

// ToEnrollmentDTOs convierte un slice de Enrollments a DTOs
func ToEnrollmentDTOs(enrollments []models.Enrollment) []EnrollmentDTO {
	dtos := make([]EnrollmentDTO, 0, len(enrollments))
	for _, enrollment := range enrollments {
		dtos = append(dtos, *ToEnrollmentDTO(&enrollment))
	}
	return dtos
}
