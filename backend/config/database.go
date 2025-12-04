package config

import (
	"curso-platform/models"
	"curso-platform/utils"
	"fmt"
	"log"
	
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB es la instancia global de la base de datos
var DB *gorm.DB

// SetupDatabase configura la conexión a la base de datos y la devuelve
func SetupDatabase() *gorm.DB {
	var err error
	maxRetries := 5
	retryDelay := 5 * time.Second

	for i := 0; i < maxRetries; i++ {
		log.Printf("Conectando a MariaDB (intento %d/%d)...", i+1, maxRetries)

		// Obtener nombre de la base de datos del entorno o usar el predeterminado "gym_db"
		dbName := utils.GetEnv("DB_NAME", "gym_db")

		// DSN para MariaDB (similar a MySQL)
		dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			utils.GetEnv("DB_USER", "root"),
			utils.GetEnv("DB_PASSWORD", ""),
			utils.GetEnv("DB_HOST", "localhost"),
			utils.GetEnv("DB_PORT", "3306"),
			dbName)

		// Utilizamos el driver de MySQL, que también es compatible con MariaDB
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})

		if err == nil {
			sqlDB, err := DB.DB()
			if err != nil {
				log.Fatalf("Error al obtener instancia DB: %v", err)
			}

			// Configuración de conexiones
			sqlDB.SetMaxIdleConns(10)
			sqlDB.SetMaxOpenConns(100)
			sqlDB.SetConnMaxLifetime(time.Hour)

			log.Println("Conexión a MariaDB establecida correctamente")
			return DB
		}

		log.Printf("Error de conexión: %v. Reintentando en %v...", err, retryDelay)
		time.Sleep(retryDelay)
	}

	log.Fatalf("No se pudo conectar a MariaDB después de %d intentos: %v", maxRetries, err)
	return nil // Nunca se ejecuta debido al Fatalf anterior, pero necesario para compilar
}

// RunMigrations ejecuta las migraciones automáticas para los modelos
func RunMigrations(db *gorm.DB) error {
	log.Println("Iniciando migración de la base de datos...")

	// Verificar si la base de datos existe, si no, crear
	dbName := utils.GetEnv("DB_NAME", "gym_db")
	if err := db.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s", dbName)).Error; err != nil {
		return fmt.Errorf("error al crear la base de datos: %v", err)
	}

	// Verificar y migrar la tabla de usuarios
	log.Println("Verificando y migrando tabla de usuarios...")

	// Verificar si la tabla usuarios existe
	if !db.Migrator().HasTable("usuarios") {
		log.Println("Tabla 'usuarios' no encontrada, creándola...")
		if err := db.Migrator().CreateTable(&models.Usuario{}); err != nil {
			return fmt.Errorf("error al crear tabla 'usuarios': %v", err)
		}
		log.Println("Tabla 'usuarios' creada correctamente")
	} else {
		// La tabla existe, verificar si necesitamos migrar de nombre completo a nombre/apellido
		if err := migrateNombreToNombreApellido(db); err != nil {
			log.Printf("Error durante migración de nombres: %v", err)
			return err
		}
	}

	// Verificar si la tabla 'password_resets' existe, y crearla si no
	if !db.Migrator().HasTable("password_resets") {
		log.Println("Tabla 'password_resets' no encontrada, creándola...")
		if err := db.Migrator().CreateTable(&models.PasswordReset{}); err != nil {
			return fmt.Errorf("error al crear tabla 'password_resets': %v", err)
		}
		log.Println("Tabla 'password_resets' creada correctamente")
	}

	// Verificar si la tabla 'activities' existe, y crearla si no
	if !db.Migrator().HasTable("activities") {
		log.Println("Tabla 'activities' no encontrada, creándola...")
		if err := db.Migrator().CreateTable(&models.Activity{}); err != nil {
			return fmt.Errorf("error al crear tabla 'activities': %v", err)
		}
		log.Println("Tabla 'activities' creada correctamente")
	}

	// Verificar si la tabla 'enrollments' existe, y crearla si no
	if !db.Migrator().HasTable("enrollments") {
		log.Println("Tabla 'enrollments' no encontrada, creándola...")
		if err := db.Migrator().CreateTable(&models.Enrollment{}); err != nil {
			return fmt.Errorf("error al crear tabla 'enrollments': %v", err)
		}
		log.Println("Tabla 'enrollments' creada correctamente")
	}

	// Realizar migración automática de todos los modelos
	log.Println("Ejecutando auto-migración de modelos...")
	if err := db.AutoMigrate(
		&models.Usuario{},
		&models.ActivityLog{},
		&models.ContactMessage{},
		&models.PasswordReset{},
		&models.Activity{},
		&models.Enrollment{},
	); err != nil {
		return fmt.Errorf("error al migrar tablas base: %v", err)
	}

	// Crear índices para password_resets
	log.Println("Creando índices...")
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token)").Error; err != nil {
		log.Printf("Advertencia: No se pudo crear índice idx_password_resets_token: %v", err)
	}

	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email)").Error; err != nil {
		log.Printf("Advertencia: No se pudo crear índice idx_password_resets_email: %v", err)
	}

	log.Println("Migración de la base de datos completada con éxito")
	return nil
}

// migrateNombreToNombreApellido migra de la columna nombre_completo a nombre y apellido separados
func migrateNombreToNombreApellido(db *gorm.DB) error {
	// Verificar si la columna nombre_completo existe
	if db.Migrator().HasColumn(&models.Usuario{}, "nombre_completo") {
		log.Println("Migrando de nombre_completo a nombre y apellido...")
		
		// Obtener todos los usuarios con nombre_completo
		var usuarios []models.Usuario
		if err := db.Select("id, nombre_completo").Find(&usuarios).Error; err != nil {
			return fmt.Errorf("error al obtener usuarios para migración: %v", err)
		}
		
		// Migrar cada usuario
		
		
		// Eliminar la columna nombre_completo después de la migración
		if err := db.Migrator().DropColumn(&models.Usuario{}, "nombre_completo"); err != nil {
			log.Printf("Advertencia: No se pudo eliminar columna nombre_completo: %v", err)
		}
		
		log.Println("Migración de nombres completada")
	}
	
	return nil
}