package models

import (
	"time"
	"gorm.io/gorm"
)

// Activity representa una actividad o clase en el sistema (capa de persistencia)
// Solo contiene tags de GORM para mapeo a base de datos
type Activity struct {
	ID          uint           `gorm:"primaryKey"`
	Title       string         `gorm:"size:200;not null"`
	Description string         `gorm:"type:text"`
	Day         string         `gorm:"size:50;not null"`
	Time        string         `gorm:"size:50;not null"`
	Duration    int            `gorm:"not null"`
	Instructor  string         `gorm:"size:100;not null"`
	Category    string         `gorm:"size:100;not null"`
	Capacity    int            `gorm:"not null"`
	Enrolled    int            `gorm:"default:0"`
	ImageUrl    string         `gorm:"size:255"`
	CreatedAt   time.Time      `gorm:"autoCreateTime"`
	UpdatedAt   time.Time      `gorm:"autoUpdateTime"`
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

// TableName especifica el nombre de la tabla en la base de datos
func (Activity) TableName() string {
	return "activities"
}
