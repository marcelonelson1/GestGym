package routes

import (
	"curso-platform/controllers"
	"curso-platform/middleware"
	"curso-platform/repositories"
	"curso-platform/services"
	"curso-platform/utils"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRouter configura el router con todas las rutas y middleware
func SetupRouter(db *gorm.DB) *gin.Engine {
	router := gin.Default()

	// Configurar CORS
	setupCORS(router)

	// Middleware global
	router.Use(middleware.JSONMiddleware())
	router.Use(middleware.RecoveryMiddleware())
	router.Use(middleware.ErrorHandler())
	router.Use(middleware.ActivityLogger())

	// ========================================
	// INYECCIÓN DE DEPENDENCIAS - REPOSITORIOS
	// ========================================
	userRepo := repositories.NewUserRepository(db)
	activityRepo := repositories.NewActivityRepository(db)
	enrollmentRepo := repositories.NewEnrollmentRepository(db)
	passwordResetRepo := repositories.NewPasswordResetRepository(db)
	contactRepo := repositories.NewContactRepository(db)

	// ========================================
	// INYECCIÓN DE DEPENDENCIAS - SERVICIOS
	// ========================================
	// AuthService: requiere UserRepository
	authService := services.NewAuthService(userRepo)

	// UserService: requiere UserRepository
	userService := services.NewUserService(userRepo)

	// PasswordResetService: requiere PasswordResetRepository y UserRepository
	passwordResetService := services.NewPasswordResetService(passwordResetRepo, userRepo)

	// ContactService: requiere ContactRepository
	contactService := services.NewContactService(contactRepo)

	// ActivityService: requiere ActivityRepository, EnrollmentRepository y DB (para transacciones)
	activityService := services.NewActivityService(activityRepo, enrollmentRepo, db)

	// EnrollmentService: requiere EnrollmentRepository, ActivityRepository y DB (para transacciones)
	enrollmentService := services.NewEnrollmentService(enrollmentRepo, activityRepo, db)

	// ========================================
	// INYECCIÓN DE DEPENDENCIAS - CONTROLADORES
	// ========================================
	// AuthController: requiere AuthService, PasswordResetService y UserService
	authController := controllers.NewAuthController(authService, passwordResetService, userService)

	// ProfileController: requiere UserService y AuthService
	profileController := controllers.NewProfileController(userService, authService)

	// ContactController: requiere ContactService
	contactController := controllers.NewContactController(contactService)

	// ActivityController: requiere ActivityService
	activityController := controllers.NewActivityController(activityService)

	// EnrollmentController: requiere EnrollmentService
	enrollmentController := controllers.NewEnrollmentController(enrollmentService)

	// AdminController: requiere UserService y AuthService
	adminController := controllers.NewAdminController(userService, authService)

	// ========================================
	// REGISTRO DE RUTAS
	// ========================================
	authController.RegisterRoutes(router)
	profileController.RegisterRoutes(router)
	contactController.RegisterRoutes(router)
	activityController.RegisterRoutes(router)
	enrollmentController.RegisterRoutes(router)
	adminController.RegisterRoutes(router)

	// Configurar rutas para archivos estáticos
	setupStaticRoutes(router)

	// Ruta de verificación de salud
	router.GET("/api/health", healthCheck)

	return router
}

// setupCORS configura la política CORS para el router
func setupCORS(router *gin.Engine) {
	frontendURL := utils.GetEnv("FRONTEND_URL", "http://localhost:3000")
	log.Printf("Configurando CORS para permitir origen: %s", frontendURL)

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
}

// setupStaticRoutes configura las rutas para servir archivos estáticos
func setupStaticRoutes(router *gin.Engine) {
	// Servir archivos estáticos de perfiles
	router.GET("/static/profiles/:filename", func(c *gin.Context) {
		filename := c.Param("filename")
		c.File("./static/profiles/" + filename)
	})

	// Servir archivos estáticos de actividades
	router.GET("/static/activities/:filename", func(c *gin.Context) {
		filename := c.Param("filename")
		filepath := "./static/activities/" + filename

		if _, err := os.Stat(filepath); os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Imagen de actividad no encontrada"})
			return
		}

		c.Header("Cache-Control", "public, max-age=31536000")
		c.File(filepath)
	})
}

// healthCheck es un endpoint para verificar el estado de la aplicación
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"version": "1.0.0",
		"time":    time.Now().Format(time.RFC3339),
	})
}
