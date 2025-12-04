package models

import (
	"time"
)

// PasswordReset modelo para almacenar los tokens de restablecimiento (capa de persistencia)
// Solo contiene tags de GORM para mapeo a base de datos
type PasswordReset struct {
	ID        uint      `gorm:"primaryKey"`
	Email     string    `gorm:"size:100;not null;index"`
	Token     string    `gorm:"size:100;not null;uniqueIndex"`
	CreatedAt time.Time
	ExpiresAt time.Time
	Used      bool `gorm:"default:false"`
}

// TableName especifica el nombre de la tabla para el modelo PasswordReset
func (PasswordReset) TableName() string {
	return "password_resets"
}