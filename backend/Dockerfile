# Etapa 1: Builder - Compilar la aplicación
FROM golang:1.20-alpine AS builder

# Instalar dependencias necesarias para compilar
RUN apk add --no-cache git gcc musl-dev

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (para aprovechar cache de Docker)
COPY go.mod go.sum ./
RUN go mod download

# Copiar el código fuente
COPY . .

# Compilar la aplicación
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o main .

# Etapa 2: Runtime - Imagen final optimizada
FROM alpine:latest

# Instalar certificados SSL y tzdata para zona horaria
RUN apk --no-cache add ca-certificates tzdata

# Crear usuario no-root para ejecutar la aplicación
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# Establecer directorio de trabajo
WORKDIR /app

# Copiar el binario compilado desde la etapa builder
COPY --from=builder /app/main .

# Copiar archivos necesarios en runtime
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/.env .env

# Crear directorios para archivos estáticos
RUN mkdir -p static/activities static/profiles && \
    chown -R appuser:appuser /app

# Cambiar al usuario no-root
USER appuser

# Exponer el puerto de la aplicación
EXPOSE 5000

# Comando para ejecutar la aplicación
CMD ["./main"]
