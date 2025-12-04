package controllers

import (
	"curso-platform/dto"
	"curso-platform/services"
	"curso-platform/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ContactController gestiona las operaciones relacionadas con los mensajes de contacto
type ContactController struct {
	contactService services.IContactService
}

// NewContactController crea una nueva instancia del controlador de contacto
func NewContactController(contactService services.IContactService) *ContactController {
	return &ContactController{
		contactService: contactService,
	}
}

// ContactHandler procesa un nuevo mensaje de contacto
func (c *ContactController) ContactHandler(ctx *gin.Context) {
	var req dto.ContactRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	// Guardar mensaje y enviar email
	if err := c.contactService.SendContactMessage(req); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	utils.SendSuccessResponse(ctx, gin.H{"message": "Mensaje enviado exitosamente"})
}

// GetContactMessages obtiene todos los mensajes de contacto (solo admin)
func (c *ContactController) GetContactMessages(ctx *gin.Context) {
	messages, err := c.contactService.GetAllMessages()
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	utils.SendSuccessResponse(ctx, messages)
}

// GetContactMessage obtiene un mensaje de contacto específico (solo admin)
func (c *ContactController) GetContactMessage(ctx *gin.Context) {
	id := ctx.Param("id")
	messageID, err := strconv.Atoi(id)
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrBadRequest, http.StatusBadRequest)
		return
	}

	message, err := c.contactService.GetMessageByID(uint(messageID))
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	utils.SendSuccessResponse(ctx, message)
}

// UpdateMessageStatus actualiza el estado (leído/destacado) de un mensaje
func (c *ContactController) UpdateMessageStatus(ctx *gin.Context) {
	id := ctx.Param("id")
	action := ctx.Param("action")
	
	messageID, err := strconv.Atoi(id)
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrBadRequest, http.StatusBadRequest)
		return
	}

	message, err := c.contactService.UpdateMessageStatus(uint(messageID), action)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	utils.SendSuccessResponse(ctx, message)
}

// DeleteContactMessage elimina un mensaje de contacto
func (c *ContactController) DeleteContactMessage(ctx *gin.Context) {
	id := ctx.Param("id")
	messageID, err := strconv.Atoi(id)
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrBadRequest, http.StatusBadRequest)
		return
	}

	if err := c.contactService.DeleteMessage(uint(messageID)); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	utils.SendSuccessResponse(ctx, gin.H{"message": "Mensaje eliminado correctamente"})
}

// ReplyToMessage envía una respuesta a un mensaje de contacto
func (c *ContactController) ReplyToMessage(ctx *gin.Context) {
	id := ctx.Param("id")
	messageID, err := strconv.Atoi(id)
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrBadRequest, http.StatusBadRequest)
		return
	}

	var req struct {
		Message string `json:"message" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	if err := c.contactService.ReplyToMessage(uint(messageID), req.Message); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	utils.SendSuccessResponse(ctx, gin.H{"message": "Respuesta enviada correctamente"})
}

// RegisterRoutes registra todas las rutas relacionadas con los mensajes de contacto
func (c *ContactController) RegisterRoutes(router *gin.Engine, authMiddleware gin.HandlerFunc, adminMiddleware gin.HandlerFunc) {
	// Ruta pública para enviar mensajes de contacto
	router.POST("/api/contact", c.ContactHandler)

	// Rutas protegidas para administrar mensajes (solo admin)
	admin := router.Group("/api/admin/messages")
	admin.Use(authMiddleware, adminMiddleware)
	{
		admin.GET("", c.GetContactMessages)
		admin.GET("/:id", c.GetContactMessage)
		admin.PATCH("/:id/:action", c.UpdateMessageStatus)
		admin.DELETE("/:id", c.DeleteContactMessage)
		admin.POST("/:id/reply", c.ReplyToMessage)
	}
}