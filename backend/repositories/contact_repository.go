package repositories

import (
	"curso-platform/models"
	"errors"

	"gorm.io/gorm"
)

// ContactRepository define las operaciones para mensajes de contacto
type ContactRepository interface {
	FindAll() ([]models.ContactMessage, error)
	FindByID(id uint) (*models.ContactMessage, error)
	Create(message *models.ContactMessage) (*models.ContactMessage, error)
	UpdateField(id uint, field string, value interface{}) error
	Delete(id uint) error
}

type contactRepository struct {
	*BaseRepository
}

// NewContactRepository crea una nueva instancia de ContactRepository
func NewContactRepository(db *gorm.DB) ContactRepository {
	return &contactRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

func (r *contactRepository) FindAll() ([]models.ContactMessage, error) {
	var messages []models.ContactMessage
	if err := r.DB.Order("created_at DESC").Find(&messages).Error; err != nil {
		return nil, err
	}
	return messages, nil
}

func (r *contactRepository) FindByID(id uint) (*models.ContactMessage, error) {
	var message models.ContactMessage
	if err := r.DB.First(&message, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &message, nil
}

func (r *contactRepository) Create(message *models.ContactMessage) (*models.ContactMessage, error) {
	if err := r.DB.Create(message).Error; err != nil {
		return nil, err
	}
	return message, nil
}

func (r *contactRepository) UpdateField(id uint, field string, value interface{}) error {
	return r.DB.Model(&models.ContactMessage{}).Where("id = ?", id).Update(field, value).Error
}

func (r *contactRepository) Delete(id uint) error {
	return r.DB.Delete(&models.ContactMessage{}, id).Error
}
