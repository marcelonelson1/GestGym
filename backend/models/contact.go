package models

import (
	"gorm.io/gorm"
)

// ContactMessage representa un mensaje de contacto enviado por un usuario (capa de persistencia)
// Solo contiene tags de GORM para mapeo a base de datos
type ContactMessage struct {
	gorm.Model
	Name    string `gorm:"size:100;not null"`
	Email   string `gorm:"size:100;not null"`
	Phone   string `gorm:"size:20"`
	Message string `gorm:"type:text;not null"`
	Read    bool   `gorm:"default:false"`
	Starred bool   `gorm:"default:false"`
}

// TableName especifica el nombre de la tabla para el modelo ContactMessage
func (ContactMessage) TableName() string {
	return "contact_messages"
}
