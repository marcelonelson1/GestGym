# Propuesta de Mejora: Separación de Responsabilidades en Modelos

## Problema Identificado

Actualmente, los modelos tienen **múltiples responsabilidades** violando el **Single Responsibility Principle (SRP)**:

### Código Actual (activity.go):
```go
type Activity struct {
    ID          uint           `gorm:"primaryKey" json:"id"`              // ⚠️ GORM + JSON
    Title       string         `gorm:"size:200;not null" json:"title"`   // ⚠️ GORM + JSON
    Description string         `gorm:"type:text" json:"description"`      // ⚠️ GORM + JSON
    Day         string         `gorm:"size:50;not null" json:"day"`      // ⚠️ GORM + JSON
    // ... más campos con doble responsabilidad
}
```

### Responsabilidades mezcladas:
1. ❌ **Dominio**: Estructura de datos del negocio
2. ❌ **Persistencia**: Mapeo a base de datos (tags `gorm`)
3. ❌ **Presentación**: Serialización JSON (tags `json`)
4. ❌ **Validación**: Reglas de validación (tags `binding`)

---

## Solución Propuesta: Clean Architecture

### Estructura de carpetas mejorada:

```
backend/
├── domain/              # ✅ Capa de dominio (entidades puras)
│   ├── entities/
│   │   ├── activity.go
│   │   ├── user.go
│   │   └── enrollment.go
│   └── repositories/    # Interfaces de repositorios
│       ├── activity_repository.go
│       └── user_repository.go
│
├── infrastructure/      # ✅ Capa de infraestructura (detalles técnicos)
│   ├── persistence/
│   │   ├── gorm/
│   │   │   ├── models/          # Modelos GORM (solo tags de BD)
│   │   │   │   ├── activity_model.go
│   │   │   │   └── user_model.go
│   │   │   └── repositories/    # Implementaciones GORM
│   │   │       ├── activity_repository.go
│   │   │       └── user_repository.go
│   │   └── mappers/             # Conversión entre capas
│   │       ├── activity_mapper.go
│   │       └── user_mapper.go
│   │
│   └── http/
│       ├── dtos/                # DTOs para HTTP (solo tags JSON)
│       │   ├── activity_dto.go
│       │   └── user_dto.go
│       └── requests/            # Request structs (tags binding)
│           ├── activity_requests.go
│           └── user_requests.go
│
├── application/         # ✅ Capa de aplicación (casos de uso)
│   └── services/
│       ├── activity_service.go
│       └── user_service.go
│
└── presentation/        # ✅ Capa de presentación (controllers)
    └── controllers/
        ├── activity_controller.go
        └── user_controller.go
```

---

## Ejemplo Detallado: Activity

### 1. Entidad de Dominio (domain/entities/activity.go)
**Responsabilidad: Solo lógica de negocio, sin dependencias externas**

```go
package entities

import "time"

// Activity es la entidad de dominio pura
// NO tiene tags de GORM ni JSON
type Activity struct {
    id          uint
    title       string
    description string
    day         string
    time        string
    duration    int
    instructor  string
    category    string
    capacity    int
    enrolled    int
    imageURL    string
    createdAt   time.Time
    updatedAt   time.Time
}

// Constructor
func NewActivity(
    title, description, day, time, instructor, category string,
    duration, capacity int,
    imageURL string,
) (*Activity, error) {
    // Validaciones de negocio
    if title == "" {
        return nil, ErrActivityTitleRequired
    }
    if capacity < 1 {
        return nil, ErrActivityCapacityInvalid
    }

    return &Activity{
        title:       title,
        description: description,
        day:         day,
        time:        time,
        duration:    duration,
        instructor:  instructor,
        category:    category,
        capacity:    capacity,
        enrolled:    0,
        imageURL:    imageURL,
        createdAt:   time.Now(),
        updatedAt:   time.Now(),
    }, nil
}

// Getters (encapsulación)
func (a *Activity) ID() uint            { return a.id }
func (a *Activity) Title() string       { return a.title }
func (a *Activity) Capacity() int       { return a.capacity }
func (a *Activity) Enrolled() int       { return a.enrolled }

// Métodos de negocio
func (a *Activity) CanEnroll() bool {
    return a.enrolled < a.capacity
}

func (a *Activity) Enroll() error {
    if !a.CanEnroll() {
        return ErrActivityFull
    }
    a.enrolled++
    a.updatedAt = time.Now()
    return nil
}

func (a *Activity) CancelEnrollment() error {
    if a.enrolled == 0 {
        return ErrNoEnrollmentsToCancel
    }
    a.enrolled--
    a.updatedAt = time.Now()
    return nil
}

func (a *Activity) UpdateDetails(title, description, instructor string) {
    if title != "" {
        a.title = title
    }
    if description != "" {
        a.description = description
    }
    if instructor != "" {
        a.instructor = instructor
    }
    a.updatedAt = time.Now()
}
```

### 2. Modelo de Persistencia GORM (infrastructure/persistence/gorm/models/activity_model.go)
**Responsabilidad: Solo mapeo a base de datos**

```go
package models

import (
    "time"
    "gorm.io/gorm"
)

// ActivityModel representa la tabla en la base de datos
// Solo tiene tags de GORM, NO de JSON
type ActivityModel struct {
    ID          uint           `gorm:"primaryKey"`
    Title       string         `gorm:"size:200;not null"`
    Description string         `gorm:"type:text"`
    Day         string         `gorm:"size:50;not null"`
    Time        string         `gorm:"size:50;not null"`
    Duration    int            `gorm:"not null"`
    Instructor  string         `gorm:"size:100;not null"`
    Category    string         `gorm:"size:100;not null"`
    Capacity    int            `gorm:"not null"`
    Enrolled    int            `gorm:"default:0"`
    ImageURL    string         `gorm:"column:image_url;size:255"`
    CreatedAt   time.Time      `gorm:"autoCreateTime"`
    UpdatedAt   time.Time      `gorm:"autoUpdateTime"`
    DeletedAt   gorm.DeletedAt `gorm:"index"`
}

// TableName especifica el nombre de la tabla
func (ActivityModel) TableName() string {
    return "activities"
}
```

### 3. Mapper (infrastructure/persistence/mappers/activity_mapper.go)
**Responsabilidad: Conversión entre entidad de dominio y modelo GORM**

```go
package mappers

import (
    "curso-platform/domain/entities"
    "curso-platform/infrastructure/persistence/gorm/models"
    "reflect"
)

// ActivityMapper convierte entre entidad de dominio y modelo GORM
type ActivityMapper struct{}

// ToEntity convierte de modelo GORM a entidad de dominio
func (m *ActivityMapper) ToEntity(model *models.ActivityModel) (*entities.Activity, error) {
    if model == nil {
        return nil, nil
    }

    // Usar reflexión para acceder a campos privados
    // O tener un constructor especial FromPersistence
    activity := &entities.Activity{}

    // Alternativa: método de package en entities
    return entities.NewActivityFromPersistence(
        model.ID,
        model.Title,
        model.Description,
        model.Day,
        model.Time,
        model.Duration,
        model.Instructor,
        model.Category,
        model.Capacity,
        model.Enrolled,
        model.ImageURL,
        model.CreatedAt,
        model.UpdatedAt,
    ), nil
}

// ToModel convierte de entidad de dominio a modelo GORM
func (m *ActivityMapper) ToModel(entity *entities.Activity) (*models.ActivityModel, error) {
    if entity == nil {
        return nil, nil
    }

    return &models.ActivityModel{
        ID:          entity.ID(),
        Title:       entity.Title(),
        Description: entity.Description(),
        Day:         entity.Day(),
        Time:        entity.Time(),
        Duration:    entity.Duration(),
        Instructor:  entity.Instructor(),
        Category:    entity.Category(),
        Capacity:    entity.Capacity(),
        Enrolled:    entity.Enrolled(),
        ImageURL:    entity.ImageURL(),
        CreatedAt:   entity.CreatedAt(),
        UpdatedAt:   entity.UpdatedAt(),
    }, nil
}

// ToEntities convierte slice de modelos a entidades
func (m *ActivityMapper) ToEntities(models []*models.ActivityModel) ([]*entities.Activity, error) {
    entities := make([]*entities.Activity, 0, len(models))
    for _, model := range models {
        entity, err := m.ToEntity(model)
        if err != nil {
            return nil, err
        }
        entities = append(entities, entity)
    }
    return entities, nil
}
```

### 4. DTO para HTTP (infrastructure/http/dtos/activity_dto.go)
**Responsabilidad: Solo serialización JSON**

```go
package dtos

import "time"

// ActivityDTO representa la actividad en respuestas HTTP
// Solo tiene tags JSON, NO de GORM
type ActivityDTO struct {
    ID          uint      `json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Day         string    `json:"day"`
    Time        string    `json:"time"`
    Duration    int       `json:"duration"`
    Instructor  string    `json:"instructor"`
    Category    string    `json:"category"`
    Capacity    int       `json:"capacity"`
    Enrolled    int       `json:"enrolled"`
    ImageURL    string    `json:"image_url"`
    Available   bool      `json:"available"`    // Campo calculado
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

// FromEntity convierte entidad de dominio a DTO
func NewActivityDTO(entity *entities.Activity) *ActivityDTO {
    if entity == nil {
        return nil
    }

    return &ActivityDTO{
        ID:          entity.ID(),
        Title:       entity.Title(),
        Description: entity.Description(),
        Day:         entity.Day(),
        Time:        entity.Time(),
        Duration:    entity.Duration(),
        Instructor:  entity.Instructor(),
        Category:    entity.Category(),
        Capacity:    entity.Capacity(),
        Enrolled:    entity.Enrolled(),
        ImageURL:    entity.ImageURL(),
        Available:   entity.CanEnroll(), // ✅ Lógica de negocio
        CreatedAt:   entity.CreatedAt(),
        UpdatedAt:   entity.UpdatedAt(),
    }
}

// ToEntitiesDTO convierte slice de entidades a DTOs
func ToActivityDTOs(entities []*entities.Activity) []*ActivityDTO {
    dtos := make([]*ActivityDTO, 0, len(entities))
    for _, entity := range entities {
        dtos = append(dtos, NewActivityDTO(entity))
    }
    return dtos
}
```

### 5. Request DTOs (infrastructure/http/requests/activity_requests.go)
**Responsabilidad: Solo validación de entrada HTTP**

```go
package requests

import "mime/multipart"

// CreateActivityRequest representa la petición HTTP para crear actividad
// Solo tiene tags de validación (binding), NO de GORM ni JSON de salida
type CreateActivityRequest struct {
    Title       string                `form:"title" binding:"required,min=3,max=200"`
    Description string                `form:"description" binding:"max=1000"`
    Day         string                `form:"day" binding:"required,oneof=Lunes Martes Miércoles Jueves Viernes Sábado Domingo"`
    Time        string                `form:"time" binding:"required"`
    Duration    int                   `form:"duration" binding:"required,min=15,max=180"`
    Instructor  string                `form:"instructor" binding:"required,min=3,max=100"`
    Category    string                `form:"category" binding:"required"`
    Capacity    int                   `form:"capacity" binding:"required,min=1,max=100"`
    Image       *multipart.FileHeader `form:"image"`
}

// ToEntity convierte request a entidad de dominio
func (r *CreateActivityRequest) ToEntity(imageURL string) (*entities.Activity, error) {
    return entities.NewActivity(
        r.Title,
        r.Description,
        r.Day,
        r.Time,
        r.Instructor,
        r.Category,
        r.Duration,
        r.Capacity,
        imageURL,
    )
}

// UpdateActivityRequest representa la petición para actualizar actividad
type UpdateActivityRequest struct {
    Title       string                `form:"title" binding:"omitempty,min=3,max=200"`
    Description string                `form:"description" binding:"omitempty,max=1000"`
    Day         string                `form:"day" binding:"omitempty"`
    Time        string                `form:"time" binding:"omitempty"`
    Duration    int                   `form:"duration" binding:"omitempty,min=15,max=180"`
    Instructor  string                `form:"instructor" binding:"omitempty,min=3,max=100"`
    Category    string                `form:"category" binding:"omitempty"`
    Capacity    int                   `form:"capacity" binding:"omitempty,min=1,max=100"`
    Image       *multipart.FileHeader `form:"image"`
}
```

### 6. Repositorio con nuevas interfaces (domain/repositories/activity_repository.go)
**Responsabilidad: Contrato de persistencia usando entidades de dominio**

```go
package repositories

import "curso-platform/domain/entities"

// ActivityRepository define operaciones de persistencia
// Trabaja con entidades de dominio, NO con modelos GORM
type ActivityRepository interface {
    FindAll(filters map[string]interface{}) ([]*entities.Activity, error)
    FindByID(id uint) (*entities.Activity, error)
    FindByIDs(ids []uint) ([]*entities.Activity, error)
    Create(activity *entities.Activity) (*entities.Activity, error)
    Update(activity *entities.Activity) (*entities.Activity, error)
    Delete(id uint) error
}
```

### 7. Implementación del repositorio (infrastructure/persistence/gorm/repositories/activity_repository.go)
**Responsabilidad: Implementación GORM del contrato**

```go
package repositories

import (
    "curso-platform/domain/entities"
    domainRepos "curso-platform/domain/repositories"
    "curso-platform/infrastructure/persistence/gorm/models"
    "curso-platform/infrastructure/persistence/mappers"
    "errors"

    "gorm.io/gorm"
)

type activityRepository struct {
    db     *gorm.DB
    mapper *mappers.ActivityMapper
}

// NewActivityRepository crea repositorio GORM
func NewActivityRepository(db *gorm.DB) domainRepos.ActivityRepository {
    return &activityRepository{
        db:     db,
        mapper: &mappers.ActivityMapper{},
    }
}

func (r *activityRepository) FindByID(id uint) (*entities.Activity, error) {
    var model models.ActivityModel

    if err := r.db.First(&model, id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, nil
        }
        return nil, err
    }

    // Convertir modelo GORM a entidad de dominio
    return r.mapper.ToEntity(&model)
}

func (r *activityRepository) Create(activity *entities.Activity) (*entities.Activity, error) {
    // Convertir entidad a modelo GORM
    model, err := r.mapper.ToModel(activity)
    if err != nil {
        return nil, err
    }

    // Persistir
    if err := r.db.Create(model).Error; err != nil {
        return nil, err
    }

    // Convertir de vuelta a entidad con ID generado
    return r.mapper.ToEntity(model)
}

func (r *activityRepository) Update(activity *entities.Activity) (*entities.Activity, error) {
    model, err := r.mapper.ToModel(activity)
    if err != nil {
        return nil, err
    }

    if err := r.db.Save(model).Error; err != nil {
        return nil, err
    }

    return r.mapper.ToEntity(model)
}
```

### 8. Controller actualizado (presentation/controllers/activity_controller.go)
**Responsabilidad: Manejar HTTP, usar DTOs**

```go
package controllers

import (
    "curso-platform/application/services"
    "curso-platform/infrastructure/http/dtos"
    "curso-platform/infrastructure/http/requests"
    "net/http"

    "github.com/gin-gonic/gin"
)

type ActivityController struct {
    service services.IActivityService
}

func NewActivityController(service services.IActivityService) *ActivityController {
    return &ActivityController{service: service}
}

func (c *ActivityController) GetActivities(ctx *gin.Context) {
    search := ctx.Query("search")
    category := ctx.Query("category")

    // Servicio retorna entidades de dominio
    activities, err := c.service.GetActivities(search, category)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Convertir entidades a DTOs para respuesta HTTP
    activityDTOs := dtos.ToActivityDTOs(activities)

    ctx.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    activityDTOs,
    })
}

func (c *ActivityController) CreateActivity(ctx *gin.Context) {
    var req requests.CreateActivityRequest

    if err := ctx.ShouldBind(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Manejar imagen...
    imageURL := ""
    // ... lógica de imagen

    // Convertir request a entidad de dominio
    activityEntity, err := req.ToEntity(imageURL)
    if err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Servicio recibe y retorna entidad
    created, err := c.service.CreateActivity(activityEntity)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Convertir entidad a DTO para respuesta
    activityDTO := dtos.NewActivityDTO(created)

    ctx.JSON(http.StatusCreated, gin.H{
        "success": true,
        "data":    activityDTO,
    })
}
```

---

## Ventajas de esta Arquitectura

### 1. **Single Responsibility Principle (SRP) ✅**
- Cada struct tiene UNA sola responsabilidad
- `ActivityModel` → Solo persistencia GORM
- `ActivityDTO` → Solo serialización JSON
- `Activity` (entidad) → Solo lógica de negocio

### 2. **Testabilidad ✅**
```go
// Puedes testear la entidad sin depender de GORM o JSON
func TestActivity_Enroll(t *testing.T) {
    activity, _ := entities.NewActivity("Yoga", "...", "Lunes", "10:00", "Ana", "Fitness", 60, 10, "")

    err := activity.Enroll()
    assert.NoError(t, err)
    assert.Equal(t, 1, activity.Enrolled())
}
```

### 3. **Independencia de frameworks ✅**
- La entidad de dominio no conoce GORM
- Puedes cambiar GORM por otro ORM sin tocar el dominio
- Puedes cambiar JSON por Protocol Buffers sin tocar el dominio

### 4. **Encapsulación ✅**
```go
// ❌ Antes: campos públicos, cualquiera puede modificar
activity.Enrolled = 999  // Sin validación

// ✅ Ahora: campos privados, solo modificación controlada
err := activity.Enroll()  // Con validación de negocio
```

### 5. **Lógica de negocio centralizada ✅**
```go
// La lógica está en la entidad, no dispersa en servicios
func (a *Activity) CanEnroll() bool {
    return a.enrolled < a.capacity
}

func (a *Activity) Enroll() error {
    if !a.CanEnroll() {
        return ErrActivityFull
    }
    a.enrolled++
    return nil
}
```

### 6. **Campos calculados en DTOs ✅**
```go
type ActivityDTO struct {
    // ...
    Available bool `json:"available"` // No existe en BD, calculado del dominio
}
```

---

## Comparación

| Aspecto | Arquitectura Actual | Arquitectura Propuesta |
|---------|---------------------|------------------------|
| **SRP** | ❌ Múltiples responsabilidades mezcladas | ✅ Una responsabilidad por struct |
| **Testabilidad** | ⚠️ Tests dependen de GORM tags | ✅ Tests puros de lógica de negocio |
| **Acoplamiento** | ❌ Alto con GORM y JSON | ✅ Bajo, capas desacopladas |
| **Encapsulación** | ❌ Campos públicos, sin control | ✅ Campos privados, getters |
| **Lógica de negocio** | ⚠️ Dispersa en servicios | ✅ Centralizada en entidades |
| **Cambio de ORM** | ❌ Afecta todos los archivos | ✅ Solo capa infrastructure |
| **Complejidad** | ✅ Simple, directo | ⚠️ Más archivos, más boilerplate |

---

## Recomendación

### **Para proyecto actual (pequeño/mediano):**
- ✅ **Mantener arquitectura actual** está bien
- ⚠️ Considerar separación parcial:
  - Separar DTOs de requests en archivos distintos
  - Mover validaciones complejas a métodos de entidades

### **Para proyecto grande/empresarial:**
- ✅ **Implementar Clean Architecture completa**
- ✅ Separar completamente: Entidades → Modelos GORM → DTOs
- ✅ Usar mappers para conversiones

### **Separación mínima recomendada (compromise):**

```
backend/
├── domain/
│   └── entities/
│       └── activity.go         # Entidad pura con lógica de negocio
│
├── models/
│   ├── persistence/
│   │   └── activity_model.go   # Solo tags GORM
│   └── dto/
│       ├── activity_dto.go     # Solo tags JSON
│       └── activity_requests.go # Solo tags binding
│
└── repositories/
    └── mappers/
        └── activity_mapper.go  # Conversión entre capas
```

---

## Conclusión

**Tu observación es correcta:** Los tags JSON y GORM deberían estar separados para cumplir SRP.

La arquitectura propuesta:
- ✅ Cumple 100% con SOLID
- ✅ Facilita testing
- ✅ Permite cambiar tecnologías sin afectar dominio
- ⚠️ Aumenta complejidad inicial (más archivos, más código)

**Decisión:** Depende del tamaño y proyección del proyecto.
