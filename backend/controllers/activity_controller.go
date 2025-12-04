package controllers

import (
	"curso-platform/dto"
	"curso-platform/middleware"
	"curso-platform/models"
	"curso-platform/services"
	"curso-platform/utils"
	"fmt"
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
)

// ActivityController gestiona las operaciones HTTP relacionadas con actividades
type ActivityController struct {
	activityService services.IActivityService
}

// NewActivityController crea una nueva instancia del controlador de actividades
func NewActivityController(activityService services.IActivityService) *ActivityController {
	return &ActivityController{
		activityService: activityService,
	}
}

// GetActivities obtiene todas las actividades con filtros opcionales
func (c *ActivityController) GetActivities(ctx *gin.Context) {
	// Obtener parámetros de consulta
	search := ctx.Query("search")
	category := ctx.Query("category")
	
	// Obtener actividades
	activities, err := c.activityService.GetActivities(search, category)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}
	
	// Enviar respuesta
	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    activities,
	})
}

// GetActivityByID obtiene una actividad por su ID
func (c *ActivityController) GetActivityByID(ctx *gin.Context) {
	// Obtener ID de la ruta
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.SendErrorResponse(ctx, fmt.Errorf("ID inválido"), http.StatusBadRequest)
		return
	}
	
	// Obtener actividad
	activity, err := c.activityService.GetActivityByID(uint(id))
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusNotFound)
		return
	}
	
	// Enviar respuesta
	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    activity,
	})
}

// CreateActivity crea una nueva actividad
func (c *ActivityController) CreateActivity(ctx *gin.Context) {
	// Verificar que el usuario es administrador
	userValue, _ := ctx.Get("user")
	user := userValue.(models.Usuario)
	if user.Role != "admin" {
		utils.SendErrorResponse(ctx, fmt.Errorf("no autorizado"), http.StatusForbidden)
		return
	}
	
	// Obtener datos del formulario multipart
	var req dto.CreateActivityRequest
	if err := ctx.ShouldBind(&req); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	// Procesar imagen si existe
	var imageURL string
	file, err := ctx.FormFile("image")
	if err == nil {
		// Guardar imagen
		imageURL, err = services.SaveActivityImage(file)
		if err != nil {
			utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
			return
		}
	}

	// Crear actividad
	activity, err := c.activityService.CreateActivity(req, imageURL)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}
	
	// Registrar actividad
	middleware.LogActivity(ctx, user.ID, "create_activity", 
		fmt.Sprintf("Creó una nueva actividad: %s", activity.Title))
	
	// Enviar respuesta
	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Actividad creada correctamente",
		"data":    activity,
	})
}

// UpdateActivity actualiza una actividad existente
func (c *ActivityController) UpdateActivity(ctx *gin.Context) {
	// Verificar que el usuario es administrador
	userValue, _ := ctx.Get("user")
	user := userValue.(models.Usuario)
	if user.Role != "admin" {
		utils.SendErrorResponse(ctx, fmt.Errorf("no autorizado"), http.StatusForbidden)
		return
	}
	
	// Obtener ID de la ruta
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.SendErrorResponse(ctx, fmt.Errorf("ID inválido"), http.StatusBadRequest)
		return
	}
	
	// Obtener datos del formulario multipart
	var req dto.UpdateActivityRequest
	if err := ctx.ShouldBind(&req); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	// Procesar imagen si existe
	var imageURL string
	file, err := ctx.FormFile("image")
	if err == nil {
		// Guardar imagen
		imageURL, err = services.SaveActivityImage(file)
		if err != nil {
			utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
			return
		}
	}

	// Actualizar actividad
	activity, err := c.activityService.UpdateActivity(uint(id), req, imageURL)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}
	
	// Registrar actividad
	middleware.LogActivity(ctx, user.ID, "update_activity", 
		fmt.Sprintf("Actualizó la actividad: %s (ID: %d)", activity.Title, activity.ID))
	
	// Enviar respuesta
	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Actividad actualizada correctamente",
		"data":    activity,
	})
}

// DeleteActivity elimina una actividad
func (c *ActivityController) DeleteActivity(ctx *gin.Context) {
	// Verificar que el usuario es administrador
	userValue, _ := ctx.Get("user")
	user := userValue.(models.Usuario)
	if user.Role != "admin" {
		utils.SendErrorResponse(ctx, fmt.Errorf("no autorizado"), http.StatusForbidden)
		return
	}
	
	// Obtener ID de la ruta
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.SendErrorResponse(ctx, fmt.Errorf("ID inválido"), http.StatusBadRequest)
		return
	}
	
	// Obtener actividad antes de eliminar para el log
	activity, err := c.activityService.GetActivityByID(uint(id))
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusNotFound)
		return
	}
	
	// Eliminar actividad
	if err := c.activityService.DeleteActivity(uint(id)); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}
	
	// Registrar actividad
	middleware.LogActivity(ctx, user.ID, "delete_activity", 
		fmt.Sprintf("Eliminó la actividad: %s (ID: %d)", activity.Title, activity.ID))
	
	// Enviar respuesta
	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Actividad eliminada correctamente",
	})
}

// RegisterRoutes registra todas las rutas relacionadas con actividades
func (c *ActivityController) RegisterRoutes(router *gin.Engine) {
	// Rutas públicas
	activities := router.Group("/api/activities")
	{
		activities.GET("", c.GetActivities)
		activities.GET("/:id", c.GetActivityByID)
	}

	// Rutas de administración (requieren rol de administrador)
	adminActivities := router.Group("/api/admin/activities")
	adminActivities.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminActivities.POST("", c.CreateActivity)
		adminActivities.PUT("/:id", c.UpdateActivity)
		adminActivities.DELETE("/:id", c.DeleteActivity)
	}
}