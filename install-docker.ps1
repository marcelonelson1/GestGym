# Script para instalar Docker Desktop en Windows
# Requiere ejecutarse como Administrador

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Instalador de Docker Desktop para Windows" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se está ejecutando como administrador
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Este script requiere privilegios de administrador." -ForegroundColor Red
    Write-Host "Por favor, ejecuta PowerShell como Administrador y vuelve a intentar." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pasos:" -ForegroundColor Yellow
    Write-Host "1. Busca 'PowerShell' en el menu Inicio" -ForegroundColor Yellow
    Write-Host "2. Click derecho -> 'Ejecutar como administrador'" -ForegroundColor Yellow
    Write-Host "3. Navega a la carpeta del proyecto" -ForegroundColor Yellow
    Write-Host "4. Ejecuta: .\install-docker.ps1" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✓ Ejecutando con privilegios de administrador" -ForegroundColor Green
Write-Host ""

# Verificar si Docker ya está instalado
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerInstalled) {
    Write-Host "Docker ya está instalado en el sistema." -ForegroundColor Yellow
    docker --version
    Write-Host ""
    $response = Read-Host "¿Deseas reinstalar Docker Desktop? (S/N)"
    if ($response -ne "S" -and $response -ne "s") {
        Write-Host "Instalación cancelada." -ForegroundColor Yellow
        exit 0
    }
}

# Verificar requisitos del sistema
Write-Host "Verificando requisitos del sistema..." -ForegroundColor Cyan

# Verificar Windows 10/11
$osVersion = [System.Environment]::OSVersion.Version
if ($osVersion.Major -lt 10) {
    Write-Host "ERROR: Docker Desktop requiere Windows 10 versión 1903 o superior, o Windows 11." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Versión de Windows compatible" -ForegroundColor Green

# Verificar WSL 2
Write-Host ""
Write-Host "Verificando WSL 2..." -ForegroundColor Cyan
$wslInstalled = wsl --status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WSL 2 no está instalado. Instalando..." -ForegroundColor Yellow

    # Habilitar características de Windows necesarias
    Write-Host "Habilitando características de Windows..." -ForegroundColor Cyan
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

    Write-Host ""
    Write-Host "IMPORTANTE: Se requiere reiniciar el sistema." -ForegroundColor Yellow
    Write-Host "Después del reinicio, ejecuta este script nuevamente para continuar." -ForegroundColor Yellow
    $response = Read-Host "¿Deseas reiniciar ahora? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        Restart-Computer -Force
    }
    exit 0
}
Write-Host "✓ WSL 2 está instalado" -ForegroundColor Green

# Descargar Docker Desktop
Write-Host ""
Write-Host "Descargando Docker Desktop..." -ForegroundColor Cyan
$dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
$installerPath = "$env:TEMP\DockerDesktopInstaller.exe"

try {
    # Usar WebClient para mostrar progreso
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($dockerUrl, $installerPath)
    Write-Host "✓ Descarga completada" -ForegroundColor Green
} catch {
    Write-Host "ERROR al descargar Docker Desktop: $_" -ForegroundColor Red
    exit 1
}

# Instalar Docker Desktop
Write-Host ""
Write-Host "Instalando Docker Desktop..." -ForegroundColor Cyan
Write-Host "Esta operación puede tardar varios minutos..." -ForegroundColor Yellow

try {
    Start-Process -FilePath $installerPath -ArgumentList "install", "--quiet", "--accept-license" -Wait -NoNewWindow
    Write-Host "✓ Instalación completada" -ForegroundColor Green
} catch {
    Write-Host "ERROR durante la instalación: $_" -ForegroundColor Red
    exit 1
}

# Limpiar archivo temporal
Remove-Item $installerPath -Force -ErrorAction SilentlyContinue

# Mensaje final
Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  Docker Desktop instalado correctamente" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Reinicia tu computadora" -ForegroundColor Yellow
Write-Host "2. Inicia Docker Desktop desde el menú Inicio" -ForegroundColor Yellow
Write-Host "3. Acepta los términos de servicio" -ForegroundColor Yellow
Write-Host "4. Espera a que Docker Desktop se inicie completamente" -ForegroundColor Yellow
Write-Host "5. Verifica la instalación ejecutando: docker --version" -ForegroundColor Yellow
Write-Host ""
Write-Host "Luego podrás ejecutar el proyecto con:" -ForegroundColor Cyan
Write-Host "  docker-compose up -d --build" -ForegroundColor White
Write-Host ""

$response = Read-Host "¿Deseas reiniciar ahora? (S/N)"
if ($response -eq "S" -or $response -eq "s") {
    Write-Host "Reiniciando el sistema..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    Restart-Computer -Force
}
