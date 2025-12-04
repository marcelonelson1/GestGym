package repositories

import (
	"curso-platform/models"

	"gorm.io/gorm"
)

// ActivityLogRepository define las operaciones para logs de actividad
type ActivityLogRepository interface {
	Create(log *models.ActivityLog) (*models.ActivityLog, error)
	FindByUser(userID uint, limit int) ([]models.ActivityLog, error)
	FindAll(limit, offset int) ([]models.ActivityLog, int64, error)
}

type activityLogRepository struct {
	*BaseRepository
}

// NewActivityLogRepository crea una nueva instancia de ActivityLogRepository
func NewActivityLogRepository(db *gorm.DB) ActivityLogRepository {
	return &activityLogRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

func (r *activityLogRepository) Create(log *models.ActivityLog) (*models.ActivityLog, error) {
	if err := r.DB.Create(log).Error; err != nil {
		return nil, err
	}
	return log, nil
}

func (r *activityLogRepository) FindByUser(userID uint, limit int) ([]models.ActivityLog, error) {
	var logs []models.ActivityLog
	query := r.DB.Where("user_id = ?", userID).Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

func (r *activityLogRepository) FindAll(limit, offset int) ([]models.ActivityLog, int64, error) {
	var logs []models.ActivityLog
	var total int64

	// Contar total
	if err := r.DB.Model(&models.ActivityLog{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Obtener logs con paginación
	query := r.DB.Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}

	if err := query.Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}
