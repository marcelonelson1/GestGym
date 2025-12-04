package models

import (
	"time"
)

// Usuario representa un usuario en el sistema (capa de persistencia)
// Solo contiene tags de GORM para mapeo a base de datos
type Usuario struct {
	ID        uint      `gorm:"primaryKey"`
	Nombre    string    `gorm:"size:50;not null"`
	Apellido  string    `gorm:"size:50;not null"`
	Email     string    `gorm:"size:100;not null;uniqueIndex"`
	Password  string    `gorm:"size:100;not null"`
	Role      string    `gorm:"size:20;default:'user'"`
	Phone     string    `gorm:"size:20"`
	ImageURL  string    `gorm:"size:255"`
	LastLogin time.Time `gorm:"autoUpdateTime:false"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

// TableName especifica el nombre de la tabla para el modelo Usuario
func (Usuario) TableName() string {
	return "usuarios"
}

// GetFullName devuelve el nombre completo del usuario
func (u Usuario) GetFullName() string {
	return u.Nombre + " " + u.Apellido
}
