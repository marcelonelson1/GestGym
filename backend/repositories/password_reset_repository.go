package repositories

import (
	"curso-platform/models"
	"errors"
	"time"

	"gorm.io/gorm"
)

// PasswordResetRepository define las operaciones para tokens de reseteo de contraseña
type PasswordResetRepository interface {
	FindByToken(token string) (*models.PasswordReset, error)
	FindByEmail(email string) (*models.PasswordReset, error)
	Create(reset *models.PasswordReset) (*models.PasswordReset, error)
	UpdateUsed(id uint, used bool) error
	DeleteByEmail(email string) error
}

type passwordResetRepository struct {
	*BaseRepository
}

// NewPasswordResetRepository crea una nueva instancia de PasswordResetRepository
func NewPasswordResetRepository(db *gorm.DB) PasswordResetRepository {
	return &passwordResetRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

func (r *passwordResetRepository) FindByToken(token string) (*models.PasswordReset, error) {
	var reset models.PasswordReset
	if err := r.DB.Where("token = ?", token).First(&reset).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &reset, nil
}

func (r *passwordResetRepository) FindByEmail(email string) (*models.PasswordReset, error) {
	var reset models.PasswordReset
	if err := r.DB.Where("email = ?", email).First(&reset).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &reset, nil
}

func (r *passwordResetRepository) Create(reset *models.PasswordReset) (*models.PasswordReset, error) {
	// Establecer tiempo de creación
	reset.CreatedAt = time.Now()

	if err := r.DB.Create(reset).Error; err != nil {
		return nil, err
	}
	return reset, nil
}

func (r *passwordResetRepository) UpdateUsed(id uint, used bool) error {
	return r.DB.Model(&models.PasswordReset{}).Where("id = ?", id).Update("used", used).Error
}

func (r *passwordResetRepository) DeleteByEmail(email string) error {
	return r.DB.Where("email = ?", email).Delete(&models.PasswordReset{}).Error
}
