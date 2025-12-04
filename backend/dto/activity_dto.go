package dto

import (
	"curso-platform/models"
	"time"
)

// ActivityDTO representa una actividad en las respuestas HTTP
// Solo contiene tags JSON para serialización
type ActivityDTO struct {
	ID          uint      `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Day         string    `json:"day"`
	Time        string    `json:"time"`
	Duration    int       `json:"duration"`
	Instructor  string    `json:"instructor"`
	Category    string    `json:"category"`
	Capacity    int       `json:"capacity"`
	Enrolled    int       `json:"enrolled"`
	ImageUrl    string    `json:"image_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ToActivityDTO convierte un modelo de Activity a DTO
func ToActivityDTO(activity *models.Activity) *ActivityDTO {
	if activity == nil {
		return nil
	}

	return &ActivityDTO{
		ID:          activity.ID,
		Title:       activity.Title,
		Description: activity.Description,
		Day:         activity.Day,
		Time:        activity.Time,
		Duration:    activity.Duration,
		Instructor:  activity.Instructor,
		Category:    activity.Category,
		Capacity:    activity.Capacity,
		Enrolled:    activity.Enrolled,
		ImageUrl:    activity.ImageUrl,
		CreatedAt:   activity.CreatedAt,
		UpdatedAt:   activity.UpdatedAt,
	}
}

// ToActivityDTOs convierte un slice de Activities a DTOs
func ToActivityDTOs(activities []models.Activity) []ActivityDTO {
	dtos := make([]ActivityDTO, 0, len(activities))
	for _, activity := range activities {
		dtos = append(dtos, *ToActivityDTO(&activity))
	}
	return dtos
}
