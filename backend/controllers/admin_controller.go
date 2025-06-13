package controllers

import (
	"curso-platform/middleware"
	"curso-platform/models"
	"curso-platform/services"
	"curso-platform/utils"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// AdminController gestiona las operaciones relacionadas con el panel de administración
type AdminController struct {
	userService  *services.UserService

	authService  *services.AuthService
}

// NewAdminController crea una nueva instancia del controlador de administración
func NewAdminController(userService *services.UserService, authService *services.AuthService) *AdminController {
	return &AdminController{
		userService:  userService,
		
		authService:  authService,
	}
}

// GetAdminStats obtiene estadísticas generales para el panel de administración


// GetSalesStats obtiene estadísticas detalladas de ventas


// GetAdminDashboard obtiene datos detallados para el dashboard del administrador


// GetActivityLog obtiene el registro de actividad con paginación y filtros


// ListUsers obtiene todos los usuarios con paginación y filtros
func (c *AdminController) ListUsers(ctx *gin.Context) {
	// Paginación
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	// Filtrado por rol
	role := ctx.Query("role")

	// Búsqueda por nombre o email
	search := ctx.Query("search")

	// Obtener usuarios con paginación
	users, total, err := c.userService.ListUsers(page, limit, role, search)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	// Registrar actividad
	userValue, _ := ctx.Get("user")
	user := userValue.(models.Usuario)
	middleware.LogActivity(ctx, user.ID, "list_users",
		fmt.Sprintf("Admin visualizó lista de usuarios (total: %d, página: %d)", len(users), page))

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"users": users,
			"pagination": gin.H{
				"total": total,
				"page":  page,
				"limit": limit,
				"pages": (total + int64(limit) - 1) / int64(limit),
			},
		},
	})
}

// GetUserById obtiene un usuario por su ID
func (c *AdminController) GetUserById(ctx *gin.Context) {
	id := ctx.Param("id")
	userID, err := strconv.Atoi(id)
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrBadRequest, http.StatusBadRequest)
		return
	}

	user, err := c.userService.GetUserByID(uint(userID))
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusNotFound)
		return
	}

	// Registrar actividad
	currentUser, _ := ctx.Get("user")
	adminUser := currentUser.(models.Usuario)
	middleware.LogActivity(ctx, adminUser.ID, "view_user_details",
		fmt.Sprintf("Admin consultó detalles del usuario ID: %s, Email: %s, Nombre: %s %s",
			id, user.Email, user.Nombre, user.Apellido))

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

// UpdateUser actualiza un usuario por su ID
func (c *AdminController) UpdateUser(ctx *gin.Context) {
	id := ctx.Param("id")
	userID, err := strconv.Atoi(id)
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrBadRequest, http.StatusBadRequest)
		return
	}

	var req models.UpdateProfileRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	// Obtener usuario antes de actualizar para el log
	oldUser, err := c.userService.GetUserByID(uint(userID))
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusNotFound)
		return
	}

	// Actualizar usuario
	updatedUser, err := c.userService.UpdateProfile(uint(userID), req)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	// Registrar actividad
	currentUser, _ := ctx.Get("user")
	adminUser := currentUser.(models.Usuario)
	middleware.LogActivity(ctx, adminUser.ID, "update_user",
		fmt.Sprintf("Admin actualizó usuario ID: %s, Email: '%s' -> '%s', Nombre: '%s %s' -> '%s %s'",
			id, oldUser.Email, updatedUser.Email,
			oldUser.Nombre, oldUser.Apellido,
			updatedUser.Nombre, updatedUser.Apellido))

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Usuario actualizado correctamente",
		"data":    updatedUser,
	})
}

// DeleteUser elimina un usuario
func (c *AdminController) DeleteUser(ctx *gin.Context) {
	id := ctx.Param("id")
	userID, err := strconv.Atoi(id)
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrBadRequest, http.StatusBadRequest)
		return
	}

	// Obtener usuario antes de eliminar para el log
	user, err := c.userService.GetUserByID(uint(userID))
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusNotFound)
		return
	}

	// Obtener usuario administrador actual
	adminValue, _ := ctx.Get("user")
	adminUser := adminValue.(models.Usuario)

	// Eliminar usuario
	if err := c.userService.DeleteUser(uint(userID), adminUser.ID); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusInternalServerError)
		return
	}

	// Registrar actividad
	middleware.LogActivity(ctx, adminUser.ID, "delete_user",
		fmt.Sprintf("Admin eliminó usuario ID: %s, Email: %s, Nombre: %s %s",
			id, user.Email, user.Nombre, user.Apellido))

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Usuario eliminado correctamente",
	})
}

// ChangeUserRole cambia el rol de un usuario
func (c *AdminController) ChangeUserRole(ctx *gin.Context) {
	id := ctx.Param("id")
	userID, err := strconv.Atoi(id)
	if err != nil {
		utils.SendErrorResponse(ctx, utils.ErrBadRequest, http.StatusBadRequest)
		return
	}

	var req models.ChangeRoleRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	// Obtener usuario antes de cambiar rol para el log
	oldUser, err := c.userService.GetUserByID(uint(userID))
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusNotFound)
		return
	}

	// Cambiar rol
	updatedUser, err := c.authService.ChangeUserRole(uint(userID), req.Role)
	if err != nil {
		utils.SendErrorResponse(ctx, err, http.StatusBadRequest)
		return
	}

	// Registrar actividad
	adminValue, _ := ctx.Get("user")
	adminUser := adminValue.(models.Usuario)
	middleware.LogActivity(ctx, adminUser.ID, "change_user_role",
		fmt.Sprintf("Admin cambió rol de usuario ID: %s, Email: %s, Nombre: %s %s, Rol: '%s' -> '%s'",
			id, updatedUser.Email, updatedUser.Nombre, updatedUser.Apellido, oldUser.Role, updatedUser.Role))

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Rol de usuario actualizado correctamente",
		"data":    updatedUser,
	})
}

// RegisterRoutes registra todas las rutas relacionadas con el panel de administración
func (c *AdminController) RegisterRoutes(router *gin.Engine) {
	admin := router.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
	

		
		
		admin.GET("/users", c.ListUsers)
		admin.GET("/users/:id", c.GetUserById)
		admin.PUT("/users/:id", c.UpdateUser)
		admin.DELETE("/users/:id", c.DeleteUser)
		admin.PUT("/users/:id/role", c.ChangeUserRole)
	}
}
