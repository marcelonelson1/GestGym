package dto

import (
	"curso-platform/models"
	"mime/multipart"
)

// CreateActivityRequest representa una solicitud para crear una actividad
// Solo contiene tags de validación (binding/form)
type CreateActivityRequest struct {
	Title       string                `form:"title" binding:"required"`
	Description string                `form:"description"`
	Day         string                `form:"day" binding:"required"`
	Time        string                `form:"time" binding:"required"`
	Duration    int                   `form:"duration" binding:"required"`
	Instructor  string                `form:"instructor" binding:"required"`
	Category    string                `form:"category" binding:"required"`
	Capacity    int                   `form:"capacity" binding:"required"`
	Image       *multipart.FileHeader `form:"image"`
}

// ToModel convierte el request a un modelo de Activity
func (r *CreateActivityRequest) ToModel(imageURL string) *models.Activity {
	return &models.Activity{
		Title:       r.Title,
		Description: r.Description,
		Day:         r.Day,
		Time:        r.Time,
		Duration:    r.Duration,
		Instructor:  r.Instructor,
		Category:    r.Category,
		Capacity:    r.Capacity,
		Enrolled:    0,
		ImageUrl:    imageURL,
	}
}

// UpdateActivityRequest representa una solicitud para actualizar una actividad
type UpdateActivityRequest struct {
	Title       string                `form:"title"`
	Description string                `form:"description"`
	Day         string                `form:"day"`
	Time        string                `form:"time"`
	Duration    int                   `form:"duration"`
	Instructor  string                `form:"instructor"`
	Category    string                `form:"category"`
	Capacity    int                   `form:"capacity"`
	Image       *multipart.FileHeader `form:"image"`
}

// EnrollmentRequest representa una solicitud para inscribirse en una actividad
type EnrollmentRequest struct {
	ActivityID uint `json:"activity_id" binding:"required"`
}
