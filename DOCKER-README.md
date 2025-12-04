# 🐳 GestGym - Guía de Docker

Esta guía te ayudará a ejecutar todo el proyecto GestGym (Backend, Frontend y Base de Datos) usando Docker.

## 📋 Prerrequisitos

- **Docker** versión 20.10 o superior
- **Docker Compose** versión 2.0 o superior
- Al menos **4GB de RAM** disponible
- **Puertos libres**: 80 (frontend), 5000 (backend), 3306 (database)

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

Copia el archivo de ejemplo y configúralo:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus valores:

```bash
# Mínimo requerido para empezar
DB_ROOT_PASSWORD=tu_password_seguro
DB_PASSWORD=tu_password_db
JWT_SECRET=tu_clave_jwt_muy_segura
```

### 2. Construir y Levantar los Servicios

Ejecuta todos los servicios con un solo comando:

```bash
docker-compose up -d --build
```

Este comando:
- ✅ Construye las imágenes Docker
- ✅ Crea la red interna
- ✅ Levanta MariaDB con datos persistentes
- ✅ Inicia el backend (Go/Gin)
- ✅ Inicia el frontend (React/Nginx)

### 3. Verificar que Todo Funciona

```bash
# Ver el estado de los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### 4. Acceder a la Aplicación

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **Base de Datos**: localhost:3306

## 🛠️ Comandos Útiles

### Gestión de Servicios

```bash
# Detener todos los servicios
docker-compose stop

# Iniciar servicios detenidos
docker-compose start

# Reiniciar un servicio específico
docker-compose restart backend

# Detener y eliminar contenedores
docker-compose down

# Detener y eliminar TODO (incluye volúmenes)
docker-compose down -v
```

### Logs y Debugging

```bash
# Ver logs de todos los servicios
docker-compose logs

# Seguir logs en tiempo real
docker-compose logs -f

# Ver últimas 100 líneas de logs del backend
docker-compose logs --tail=100 backend

# Entrar a un contenedor
docker-compose exec backend sh
docker-compose exec database bash
```

### Reconstruir Imágenes

```bash
# Reconstruir solo el backend
docker-compose build backend

# Reconstruir sin usar cache
docker-compose build --no-cache

# Reconstruir y levantar
docker-compose up -d --build
```

### Base de Datos

```bash
# Conectarse a MariaDB
docker-compose exec database mysql -u gymuser -p gym_db

# Backup de la base de datos
docker-compose exec database mysqldump -u root -p gym_db > backup.sql

# Restaurar backup
docker-compose exec -T database mysql -u root -p gym_db < backup.sql

# Ver tablas
docker-compose exec database mysql -u gymuser -p gym_db -e "SHOW TABLES;"
```

## 📂 Estructura de Volúmenes

Los datos se persisten en volúmenes Docker:

```
gestgym-mariadb-data    → Datos de la base de datos
gestgym-backend-static  → Archivos estáticos (imágenes, perfiles)
gestgym-backend-logs    → Logs de la aplicación
```

### Ver Volúmenes

```bash
# Listar volúmenes
docker volume ls | grep gestgym

# Inspeccionar un volumen
docker volume inspect gestgym-mariadb-data

# Eliminar volúmenes no utilizados
docker volume prune
```

## 🔧 Configuración Avanzada

### Variables de Entorno

Todas las variables configurables están en `.env`:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DB_ROOT_PASSWORD` | Password root de MariaDB | rootpassword |
| `DB_NAME` | Nombre de la base de datos | gym_db |
| `DB_USER` | Usuario de la BD | gymuser |
| `DB_PASSWORD` | Password del usuario | gympassword |
| `JWT_SECRET` | Clave secreta para JWT | - |
| `FRONTEND_URL` | URL del frontend | http://localhost:3000 |
| `EMAIL_FROM` | Email remitente SMTP | - |
| `SMTP_HOST` | Host del servidor SMTP | smtp.gmail.com |
| `SMTP_PORT` | Puerto SMTP | 587 |

### Puertos Personalizados

Edita `.env` para cambiar los puertos:

```bash
FRONTEND_PORT=8080
BACKEND_PORT=5001
DB_PORT=3307
```

### Modo de Desarrollo

Para desarrollo con hot-reload:

```bash
# Backend (requiere código montado)
docker-compose -f docker-compose.dev.yml up

# Frontend con hot-reload
cd frontend && npm start
```

## 🩺 Health Checks

Los servicios tienen health checks configurados:

```bash
# Ver estado de salud
docker-compose ps

# Backend health
curl http://localhost:5000/api/health

# Database health
docker-compose exec database healthcheck.sh --connect
```

## 🐛 Solución de Problemas

### El backend no se conecta a la base de datos

```bash
# Verificar que la BD esté saludable
docker-compose ps database

# Ver logs de la BD
docker-compose logs database

# Verificar conectividad
docker-compose exec backend ping database
```

### Errores de permisos

```bash
# Reiniciar con permisos correctos
docker-compose down
sudo chown -R $USER:$USER .
docker-compose up -d --build
```

### Puerto ya en uso

```bash
# Ver qué proceso usa el puerto 80
netstat -tulpn | grep :80

# Cambiar el puerto en .env
FRONTEND_PORT=8080
```

### Limpiar y empezar de cero

```bash
# Detener todo
docker-compose down -v

# Limpiar imágenes
docker system prune -a

# Reconstruir desde cero
docker-compose up -d --build
```

## 📊 Monitoreo y Performance

### Ver uso de recursos

```bash
# Estadísticas en tiempo real
docker stats

# Solo contenedores de gestgym
docker stats $(docker ps --filter name=gestgym -q)
```

### Limitar recursos

Edita `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## 🚢 Despliegue en Producción

### Consideraciones de Seguridad

1. **Cambiar todas las contraseñas** en `.env`
2. **Usar JWT_SECRET aleatorio y seguro**:
   ```bash
   openssl rand -base64 64
   ```
3. **Configurar HTTPS** con Nginx y Let's Encrypt
4. **Usar secretos de Docker** para datos sensibles
5. **Limitar acceso a puertos** (firewall)

### Optimizaciones

```bash
# Usar GIN_MODE release
GIN_MODE=release

# Limitar logs
docker-compose logs --tail=1000

# Configurar logrotate
```

## 📝 Notas Adicionales

### Migraciones de Base de Datos

Las migraciones se ejecutan automáticamente al iniciar el backend.

### Backup Automático

Configura un cron job para backups periódicos:

```bash
# Agregar a crontab
0 2 * * * cd /ruta/gestgym && docker-compose exec -T database mysqldump -u root -p$(grep DB_ROOT_PASSWORD .env | cut -d '=' -f2) gym_db > backups/backup_$(date +\%Y\%m\%d).sql
```

### Actualizar el Proyecto

```bash
# Obtener últimos cambios
git pull origin main

# Reconstruir imágenes
docker-compose build --no-cache

# Reiniciar servicios
docker-compose up -d
```

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs: `docker-compose logs`
2. Verifica el estado: `docker-compose ps`
3. Prueba el health check del backend: `curl http://localhost:5000/api/health`
4. Revisa las variables de entorno en `.env`

## 📖 Referencias

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MariaDB Docker Image](https://hub.docker.com/_/mariadb)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)
