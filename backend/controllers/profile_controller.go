package controllers

import (
	"curso-platform/dto"
	"curso-platform/models"
	"curso-platform/services"
	"curso-platform/utils"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// ProfileController gestiona las operaciones relacionadas con el perfil de usuario
type ProfileController struct {
	userService services.IUserService
	authService services.IAuthService
}

// NewProfileController crea una nueva instancia del controlador de perfil
func NewProfileController(userService services.IUserService, authService services.IAuthService) *ProfileController {
	return &ProfileController{
		userService: userService,
		authService: authService,
	}
}

// GetProfile obtiene el perfil del usuario actual
func (c *ProfileController) GetProfile(ctx *gin.Context) {
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

	// Convertir a DTO para asegurar serialización correcta con tags JSON
	userDTO := dto.ToUserDTO(&user)

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    userDTO,
	})
}

// UpdateProfile actualiza el perfil del usuario
func (c *ProfileController) UpdateProfile(ctx *gin.Context) {
	var req dto.UpdateProfileRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	// Obtener usuario actual
	userValue, _ := ctx.Get("user")
	currentUser := userValue.(models.Usuario)

	// Actualizar perfil
	updatedUser, err := c.userService.UpdateProfile(currentUser.ID, req)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Perfil actualizado correctamente",
		"user":    updatedUser,
	})
}

// ChangePassword cambia la contraseña del usuario
func (c *ProfileController) ChangePassword(ctx *gin.Context) {
	var req dto.ChangePasswordRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	// Obtener usuario actual
	userValue, _ := ctx.Get("user")
	currentUser := userValue.(models.Usuario)

	// Cambiar contraseña
	if err := c.authService.ChangePassword(currentUser.ID, req.CurrentPassword, req.NewPassword); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Contraseña actualizada correctamente",
	})
}

// UploadProfileImage sube una imagen de perfil
func (c *ProfileController) UploadProfileImage(ctx *gin.Context) {
	// Obtener usuario actual
	userValue, _ := ctx.Get("user")
	currentUser := userValue.(models.Usuario)

	// Obtener archivo
	file, err := ctx.FormFile("image")
	if err != nil {
		utils.SendErrorResponse(ctx, fmt.Errorf("error al recibir imagen"), http.StatusBadRequest)
		return
	}

	// Crear archivo temporal para procesar
	tempFile, err := os.CreateTemp("", "profile-*.tmp")
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrServerError, http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile.Name())
	defer tempFile.Close()

	// Guardar FormFile en archivo temporal
	if err := ctx.SaveUploadedFile(file, tempFile.Name()); err != nil {
		utils.SendErrorResponse(ctx, fmt.Errorf("error al procesar imagen"), http.StatusInternalServerError)
		return
	}

	// Subir imagen de perfil
	imageURL, err := c.userService.UploadProfileImage(currentUser.ID, tempFile, file.Filename, file.Size)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  "Imagen de perfil actualizada correctamente",
		"imageUrl": imageURL,
	})
}

// GetNotificationSettings obtiene las preferencias de notificación
func (c *ProfileController) GetNotificationSettings(ctx *gin.Context) {
	// Obtener usuario actual
	userValue, _ := ctx.Get("user")
	currentUser := userValue.(models.Usuario)

	// Registrar la acción
	log.Printf("Usuario %s %s (ID: %d, Email: %s) consultó sus preferencias de notificación",
		currentUser.Nombre, currentUser.Apellido, currentUser.ID, currentUser.Email)

	// En una implementación real, obtendríamos esto de la base de datos
	// Por ahora, devolvemos valores predeterminados
	settings := dto.NotificationSettingsRequest{
		EmailNotifications: true,
		NewMessages:        true,
		NewEnrollments:     true,
		SystemUpdates:      false,
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":  true,
		"settings": settings,
	})
}

// UpdateNotificationSettings actualiza las preferencias de notificación
func (c *ProfileController) UpdateNotificationSettings(ctx *gin.Context) {
	var req dto.NotificationSettingsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	// Obtener usuario actual
	userValue, _ := ctx.Get("user")
	currentUser := userValue.(models.Usuario)

	// Registrar la acción
	log.Printf("Usuario %s %s (ID: %d, Email: %s) actualizó sus preferencias de notificación",
		currentUser.Nombre, currentUser.Apellido, currentUser.ID, currentUser.Email)

	// En una implementación real, guardaríamos esto en la base de datos

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Preferencias de notificación actualizadas correctamente",
	})
}

// RegisterRoutes registra todas las rutas relacionadas con el perfil
func (c *ProfileController) RegisterRoutes(router *gin.Engine, authMiddleware gin.HandlerFunc) {
	profile := router.Group("/api/auth/profile")
	profile.Use(authMiddleware)
	{
		profile.GET("", c.GetProfile)
		profile.PUT("", c.UpdateProfile)
		profile.POST("/change-password", c.ChangePassword)
		profile.POST("/image", c.UploadProfileImage)
		profile.GET("/notification-settings", c.GetNotificationSettings)
		profile.PUT("/notification-settings", c.UpdateNotificationSettings)
	}
}
