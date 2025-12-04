package repositories

import (
	"curso-platform/models"
	"errors"

	"gorm.io/gorm"
)

// UserRepository define las operaciones para usuarios
type UserRepository interface {
	FindByID(id uint) (*models.Usuario, error)
	FindByEmail(email string) (*models.Usuario, error)
	FindAll(filters map[string]interface{}, limit, offset int) ([]models.Usuario, int64, error)
	Create(user *models.Usuario) (*models.Usuario, error)
	Update(user *models.Usuario) (*models.Usuario, error)
	UpdateField(id uint, field string, value interface{}) error
	UpdateFields(id uint, updates map[string]interface{}) error
	Delete(id uint) error
}

type userRepository struct {
	*BaseRepository
}

// NewUserRepository crea una nueva instancia de UserRepository
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

func (r *userRepository) FindByID(id uint) (*models.Usuario, error) {
	var user models.Usuario
	if err := r.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByEmail(email string) (*models.Usuario, error) {
	var user models.Usuario
	if err := r.DB.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindAll(filters map[string]interface{}, limit, offset int) ([]models.Usuario, int64, error) {
	var users []models.Usuario
	query := r.DB.Model(&models.Usuario{}).Order("created_at desc")

	// Aplicar filtros
	if role, ok := filters["role"]; ok && role != "" {
		query = query.Where("role = ?", role)
	}

	if search, ok := filters["search"]; ok && search != "" {
		searchStr := search.(string)
		query = query.Where("nombre LIKE ? OR apellido LIKE ? OR email LIKE ?",
			"%"+searchStr+"%", "%"+searchStr+"%", "%"+searchStr+"%")
	}

	// Contar total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Aplicar paginación
	if err := query.Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *userRepository) Create(user *models.Usuario) (*models.Usuario, error) {
	if err := r.DB.Create(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) Update(user *models.Usuario) (*models.Usuario, error) {
	if err := r.DB.Save(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) UpdateField(id uint, field string, value interface{}) error {
	return r.DB.Model(&models.Usuario{}).Where("id = ?", id).Update(field, value).Error
}

func (r *userRepository) UpdateFields(id uint, updates map[string]interface{}) error {
	return r.DB.Model(&models.Usuario{}).Where("id = ?", id).Updates(updates).Error
}

func (r *userRepository) Delete(id uint) error {
	return r.DB.Delete(&models.Usuario{}, id).Error
}
