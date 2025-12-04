# Etapa 1: Builder - Compilar la aplicación React
FROM node:18-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (para aprovechar cache de Docker)
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install --production && npm cache clean --force

# Copiar el código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa 2: Runtime - Servir con Nginx
FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos build desde la etapa builder
COPY --from=builder /app/build /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 3000

# Comando para ejecutar Nginx
CMD ["nginx", "-g", "daemon off;"]
