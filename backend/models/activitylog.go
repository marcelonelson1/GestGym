package models

import (
	"time"
)

// ActivityLog representa un registro de actividad en el sistema (capa de persistencia)
// Solo contiene tags de GORM para mapeo a base de datos
type ActivityLog struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"not null"`
	Action    string    `gorm:"size:50;not null"`
	Details   string    `gorm:"size:500"`
	IP        string    `gorm:"size:50"`
	UserAgent string    `gorm:"size:255"`
	CreatedAt time.Time
}

// TableName especifica el nombre de la tabla para el modelo ActivityLog
func (ActivityLog) TableName() string {
	return "activity_logs"
}
