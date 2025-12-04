package controllers

import (
	"curso-platform/middleware"
	"curso-platform/models"
	"curso-platform/repositories"
	"curso-platform/services"
	"curso-platform/utils"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// EnrollmentController gestiona las operaciones de inscripción a actividades
type EnrollmentController struct {
	enrollmentService services.IEnrollmentService
	activityLogRepo   repositories.ActivityLogRepository
}

// NewEnrollmentController crea una nueva instancia del controlador de inscripciones
func NewEnrollmentController(enrollmentService services.IEnrollmentService, activityLogRepo repositories.ActivityLogRepository) *EnrollmentController {
	return &EnrollmentController{
		enrollmentService: enrollmentService,
		activityLogRepo:   activityLogRepo,
	}
}

// Enroll inscribe a un usuario en una actividad
func (c *EnrollmentController) Enroll(ctx *gin.Context) {
	// Obtener usuario del contexto
	userValue, exists := ctx.Get("user")
	if !exists {
		utils.SendErrorResponse(ctx, utils.ErrUnauthorized, http.StatusUnauthorized)
		return
	}

	user, ok := userValue.(models.Usuario)
	if !ok {
		utils.SendErrorResponse(ctx, utils.ErrServerError, http.StatusInternalServerError)
		return
	}

	// Obtener ID de la actividad
	id := ctx.Param("id")
	activityID, err := strconv.Atoi(id)
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrBadRequest, http.StatusBadRequest)
		return
	}

	// Realizar la inscripción
	enrollment, err := c.enrollmentService.Enroll(user.ID, uint(activityID))
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	// Registrar actividad en el log
	middleware.LogActivity(ctx, user.ID, "enrollment",
		fmt.Sprintf("Usuario se inscribió en la actividad ID: %d", activityID), c.activityLogRepo)

	utils.SendSuccessResponse(ctx, gin.H{
		"message":    "Inscripción exitosa",
		"enrollment": enrollment,
	})
}

// GetUserActivities obtiene las actividades en las que está inscrito el usuario
func (c *EnrollmentController) GetUserActivities(ctx *gin.Context) {
	// Obtener usuario del contexto
	userValue, exists := ctx.Get("user")
	if !exists {
		utils.SendErrorResponse(ctx, utils.ErrUnauthorized, http.StatusUnauthorized)
		return
	}

	user, ok := userValue.(models.Usuario)
	if !ok {
		utils.SendErrorResponse(ctx, utils.ErrServerError, http.StatusInternalServerError)
		return
	}

	// Obtener actividades del usuario
	activities, err := c.enrollmentService.GetUserActivities(user.ID)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	utils.SendSuccessResponse(ctx, activities)
}

// GetUserEnrollments obtiene las inscripciones del usuario actual
func (c *EnrollmentController) GetUserEnrollments(ctx *gin.Context) {
	// Obtener usuario del contexto
	userValue, exists := ctx.Get("user")
	if !exists {
		utils.SendErrorResponse(ctx, utils.ErrUnauthorized, http.StatusUnauthorized)
		return
	}

	user, ok := userValue.(models.Usuario)
	if !ok {
		utils.SendErrorResponse(ctx, utils.ErrServerError, http.StatusInternalServerError)
		return
	}

	// Obtener inscripciones
	enrollments, err := c.enrollmentService.GetUserEnrollments(user.ID)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	utils.SendSuccessResponse(ctx, enrollments)
}

// CancelEnrollment cancela la inscripción de un usuario a una actividad
func (c *EnrollmentController) CancelEnrollment(ctx *gin.Context) {
	// Obtener usuario del contexto
	userValue, exists := ctx.Get("user")
	if !exists {
		utils.SendErrorResponse(ctx, utils.ErrUnauthorized, http.StatusUnauthorized)
		return
	}

	user, ok := userValue.(models.Usuario)
	if !ok {
		utils.SendErrorResponse(ctx, utils.ErrServerError, http.StatusInternalServerError)
		return
	}

	// Obtener ID de la actividad
	id := ctx.Param("id")
	activityID, err := strconv.Atoi(id)
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrBadRequest, http.StatusBadRequest)
		return
	}

	// Cancelar la inscripción
	err = c.enrollmentService.CancelEnrollment(user.ID, uint(activityID))
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	// Registrar actividad en el log
	middleware.LogActivity(ctx, user.ID, "enrollment_cancel",
		fmt.Sprintf("Usuario canceló su inscripción en la actividad ID: %d", activityID), c.activityLogRepo)

	utils.SendSuccessResponse(ctx, gin.H{
		"message": "Inscripción cancelada exitosamente",
	})
}

// RegisterRoutes registra las rutas para el controlador de inscripciones
func (c *EnrollmentController) RegisterRoutes(router *gin.Engine, authMiddleware gin.HandlerFunc) {
	enrollment := router.Group("/api/enrollments")
	enrollment.Use(authMiddleware)
	{
		enrollment.POST("/:id", c.Enroll)
		enrollment.DELETE("/:id", c.CancelEnrollment)
		enrollment.GET("/my-activities", c.GetUserActivities)
		enrollment.GET("", c.GetUserEnrollments)
	}
}