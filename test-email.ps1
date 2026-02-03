# Script para probar el envio de email de invitacion a grupo
Write-Host "=== Test de Email para Invitacion a Grupo ===" -ForegroundColor Cyan

# 1. Intentar login o registrarse
Write-Host "`n1. Autenticando usuario..." -ForegroundColor Yellow
$loginBody = @{
    email = "testuser@example.com"
    password = "Test1234!"
} | ConvertTo-Json

$token = $null
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Host "Login exitoso" -ForegroundColor Green
} catch {
    Write-Host "Usuario no existe. Registrando..." -ForegroundColor Yellow
    
    $registerBody = @{
        email = "testuser@example.com"
        password = "Test1234!"
        firstName = "Usuario"
        lastName = "Prueba"
    } | ConvertTo-Json
    
    try {
        $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
        
        # Ahora intentar login nuevamente
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
        $token = $loginResponse.accessToken
        Write-Host "Usuario registrado y autenticado" -ForegroundColor Green
    } catch {
        Write-Host "Error registrando: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Gray

# 2. Obtener grupos del usuario
Write-Host "`n2. Obteniendo grupos..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $groups = Invoke-RestMethod -Uri "http://localhost:3001/api/groups" -Method GET -Headers $headers
    
    if ($groups.Count -eq 0) {
        Write-Host "No hay grupos. Creando uno..." -ForegroundColor Yellow
        
        $createGroupBody = @{
            name = "Grupo de Prueba Email"
            description = "Grupo para probar notificaciones por email"
        } | ConvertTo-Json
        
        $newGroup = Invoke-RestMethod -Uri "http://localhost:3001/api/groups" -Method POST -Body $createGroupBody -ContentType "application/json" -Headers $headers
        $groupId = $newGroup.id
        Write-Host "Grupo creado: $($newGroup.name) (ID: $groupId)" -ForegroundColor Green
    } else {
        $groupId = $groups[0].id
        Write-Host "Usando grupo existente: $($groups[0].name) (ID: $groupId)" -ForegroundColor Green
    }
} catch {
    Write-Host "Error obteniendo/creando grupos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Agregar miembro al grupo (esto dispara el email)
Write-Host "`n3. Agregando miembro al grupo (enviara email)..." -ForegroundColor Yellow
$addMemberBody = @{
    email = "jc.ulloa@jkarlos.info"
    role = "member"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "http://localhost:3001/api/groups/$groupId/members" -Method POST -Body $addMemberBody -ContentType "application/json" -Headers $headers
    Write-Host "Miembro agregado exitosamente" -ForegroundColor Green
    Write-Host "Email enviado a: jc.ulloa@jkarlos.info" -ForegroundColor Green
    Write-Host "`nDetalles del miembro:" -ForegroundColor Cyan
    Write-Host "- ID: $($result.id)" -ForegroundColor Gray
    Write-Host "- Rol: $($result.role)" -ForegroundColor Gray
    Write-Host "- Fecha: $($result.createdAt)" -ForegroundColor Gray
} catch {
    Write-Host "Error agregando miembro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Respuesta: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Test completado ===" -ForegroundColor Cyan
Write-Host "Revisa el email en jc.ulloa@jkarlos.info" -ForegroundColor Yellow
