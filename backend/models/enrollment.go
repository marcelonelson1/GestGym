package models

import (
	"time"

	"gorm.io/gorm"
)

// Enrollment representa una inscripción de un usuario a una actividad (capa de persistencia)
// Solo contiene tags de GORM para mapeo a base de datos
type Enrollment struct {
	gorm.Model
	UserID     uint      `gorm:"not null"`
	ActivityID uint      `gorm:"not null"`
	EnrolledAt time.Time `gorm:"not null"`
	Status     string    `gorm:"not null;default:'active'"` // active, cancelled, completed
}