package controllers

import (
	"curso-platform/dto"
	"curso-platform/services"
	"curso-platform/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// PasswordResetController maneja las solicitudes relacionadas con la recuperación de contraseña
type PasswordResetController struct {
	service     services.IPasswordResetService
	userService services.IUserService
}

// NewPasswordResetController crea una nueva instancia del controlador
func NewPasswordResetController(service services.IPasswordResetService, userService services.IUserService) *PasswordResetController {
	return &PasswordResetController{
		service:     service,
		userService: userService,
	}
}

// RegisterRoutes registra las rutas del controlador en el enrutador
func (c *PasswordResetController) RegisterRoutes(router *gin.Engine) {
	auth := router.Group("/api/auth")
	{
		auth.POST("/forgot-password", c.ForgotPassword)
		auth.GET("/reset-password/:token/validate", c.ValidateResetToken)
		auth.POST("/reset-password", c.ResetPassword)
	}
}

// ForgotPassword maneja la solicitud de recuperación de contraseña
func (c *PasswordResetController) ForgotPassword(ctx *gin.Context) {
	var req dto.ForgotPasswordRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.SendErrorResponse(ctx, utils.ErrInvalidRequest, http.StatusBadRequest)
		return
	}

	// Intentar generar un token de recuperación
	reset, err := c.service.GenerateResetToken(req.Email)
	
	// Respuesta base segura (no revelar si el email existe)
	response := gin.H{
		"message": "Si el email existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.",
	}

	// Si hay un error, solo lo registramos pero no lo devolvemos al cliente
	if err != nil {
		utils.SendSuccessResponse(ctx, response)
		return
	}

	// Construir el enlace de restablecimiento
	frontendURL := utils.GetEnv("FRONTEND_URL", "http://localhost:3000")
	resetLink := frontendURL + "/reset-password/" + reset.Token

	// Buscar el usuario por email para obtener su nombre
	user, userErr := c.userService.GetUserByEmail(req.Email)
	if userErr != nil {
		utils.SendSuccessResponse(ctx, response)
		return
	}

	// Enviar correo electrónico
	emailError := c.service.SendPasswordResetEmail(req.Email, user.Nombre, resetLink)
	appEnv := utils.GetEnv("APP_ENV", "development")

	// Solo en desarrollo, incluir información adicional
	if appEnv == "development" {
		response["resetToken"] = reset.Token
		response["resetLink"] = resetLink
		if emailError != nil {
			response["emailError"] = emailError.Error()
		}
	}

	utils.SendSuccessResponse(ctx, response)
}

// ValidateResetToken valida un token de restablecimiento
func (c *PasswordResetController) ValidateResetToken(ctx *gin.Context) {
	token := ctx.Param("token")
	if token == "" {
		utils.SendErrorResponse(ctx, utils.ErrInvalidRequest, http.StatusBadRequest)
		return
	}

	// Validar el token
	reset, err := c.service.ValidateResetToken(token)
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrInvalidToken, http.StatusBadRequest)
		return
	}

	utils.SendSuccessResponse(ctx, gin.H{"valid": true, "email": reset.Email})
}

// ResetPassword restablece la contraseña de un usuario
func (c *PasswordResetController) ResetPassword(ctx *gin.Context) {
	var req dto.ResetPasswordRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.SendErrorResponse(ctx, utils.ErrInvalidRequest, http.StatusBadRequest)
		return
	}

	// Intentar restablecer la contraseña
	err := c.service.ResetPassword(req.Token, req.Password)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	utils.SendSuccessResponse(ctx, gin.H{"message": "Contraseña actualizada correctamente"})
}