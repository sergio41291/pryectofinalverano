# 📧 Configuración de Email para Invitaciones a Grupos

## Resumen

El sistema ahora envía emails automáticos cuando un usuario es agregado a un grupo. Los emails se envían usando tu propio servidor SMTP configurado en el archivo `.env`.

## 🔧 Configuración SMTP

### 1. Editar archivo `.env`

Abre el archivo `backend/.env` y configura las siguientes variables con los datos de tu servidor de email:

```bash
# ============================================
# SMTP EMAIL CONFIG (Custom SMTP Server)
# ============================================
SMTP_HOST=smtp.tuservidor.com          # Dirección de tu servidor SMTP
SMTP_PORT=587                          # Puerto SMTP (587 para TLS, 465 para SSL)
SMTP_SECURE=false                      # false para TLS (port 587), true para SSL (port 465)
SMTP_USER=tu_usuario@tudominio.com    # Usuario de autenticación SMTP
SMTP_PASSWORD=tu_contraseña_smtp       # Contraseña del usuario SMTP
SMTP_FROM_EMAIL=noreply@tudominio.com # Email remitente
SMTP_FROM_NAME=LearnMind AI            # Nombre del remitente
SMTP_ENABLED=true                      # true para habilitar, false para deshabilitar
```

### 2. Ejemplos de Configuración Común

#### Gmail (con App Password)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tucuenta@gmail.com
SMTP_PASSWORD=tu_app_password_de_16_digitos
SMTP_FROM_EMAIL=tucuenta@gmail.com
SMTP_FROM_NAME=LearnMind AI
SMTP_ENABLED=true
```

**Nota:** Para Gmail necesitas generar una [App Password](https://myaccount.google.com/apppasswords)

#### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tucuenta@outlook.com
SMTP_PASSWORD=tu_contraseña
SMTP_FROM_EMAIL=tucuenta@outlook.com
SMTP_FROM_NAME=LearnMind AI
SMTP_ENABLED=true
```

#### Servidor SMTP Personalizado
```bash
SMTP_HOST=mail.tudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@tudominio.com
SMTP_PASSWORD=tu_contraseña_segura
SMTP_FROM_EMAIL=noreply@tudominio.com
SMTP_FROM_NAME=LearnMind AI
SMTP_ENABLED=true
```

### 3. Verificar Configuración

Después de configurar, reinicia el backend:

```bash
cd backend
npm run start:dev
```

Busca en los logs de inicio:

- ✅ **Éxito:** `Servidor SMTP conectado correctamente`
- ❌ **Error:** `Error al conectar con el servidor SMTP`

## 📨 Funcionamiento

### ¿Cuándo se envían los emails?

Los emails se envían automáticamente cuando:

1. Un administrador o dueño del grupo agrega un nuevo miembro
2. El endpoint usado es: `POST /api/groups/:groupId/members`

### Contenido del Email

El email incluye:

- 📚 **Nombre del grupo**
- 👤 **Rol asignado** (Admin o Miembro)
- 🔗 **Enlace directo al grupo**
- ✅ **Lista de permisos** según el rol
- 👥 **Nombre de quien invitó**

### Plantilla del Email

La plantilla es responsive y profesional con:

- Diseño HTML con gradientes modernos
- Versión texto plano alternativa
- Logo de LearnMind AI
- Botón de call-to-action
- Footer con información legal

## 🧪 Probar el Sistema

### 1. Agregar un miembro a un grupo

**Request:**
```bash
POST http://localhost:3001/api/groups/{groupId}/members
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "role": "member"
}
```

**Roles disponibles:**
- `member` - Miembro estándar del grupo
- `admin` - Administrador del grupo

### 2. Verificar en los logs

Busca en los logs del backend:

```
[EmailService] Email de invitación enviado a usuario@ejemplo.com: <message-id>
```

## 🔒 Seguridad

### Buenas Prácticas

1. **No commitear credenciales:** El archivo `.env` está en `.gitignore`
2. **App Passwords:** Usa passwords específicas para aplicaciones en Gmail
3. **Variables seguras:** Usa contraseñas largas y únicas
4. **TLS habilitado:** Usa siempre `SMTP_PORT=587` con `SMTP_SECURE=false` (TLS)
5. **IP whitelisting:** Configura tu servidor SMTP para aceptar solo desde tu servidor

### Deshabilitar temporalmente

Si necesitas deshabilitar el envío de emails sin romper la aplicación:

```bash
SMTP_ENABLED=false
```

Esto hará que:
- ✅ Los miembros se agreguen normalmente al grupo
- ⚠️ No se envíen emails (solo se registra en logs)
- ✅ La aplicación funcione sin errores

## 🐛 Resolución de Problemas

### Error: "getaddrinfo ENOTFOUND"

**Causa:** El host SMTP no se puede resolver

**Solución:**
- Verifica que `SMTP_HOST` esté correctamente escrito
- Comprueba conectividad de red: `ping smtp.tuservidor.com`

### Error: "Invalid login"

**Causa:** Credenciales incorrectas

**Solución:**
- Verifica `SMTP_USER` y `SMTP_PASSWORD`
- Para Gmail, usa App Password en lugar de tu contraseña normal
- Comprueba que la cuenta SMTP esté activa

### Error: "Connection timeout"

**Causa:** Puerto bloqueado o firewall

**Solución:**
- Verifica que `SMTP_PORT` sea el correcto
- Comprueba que el puerto no esté bloqueado por firewall
- Intenta con puerto 587 (TLS) o 465 (SSL)

### Los emails no llegan

**Verifica:**

1. **Logs del backend:** ¿Dice "Email enviado"?
2. **Carpeta de spam:** Revisa la carpeta de spam del destinatario
3. **SPF/DKIM:** Configura registros SPF y DKIM en tu dominio
4. **Rate limits:** Algunos proveedores limitan emails por hora

## 📋 Checklist de Configuración

- [ ] Configurar `SMTP_HOST` con tu servidor
- [ ] Configurar `SMTP_PORT` (587 recomendado)
- [ ] Configurar `SMTP_USER` y `SMTP_PASSWORD`
- [ ] Configurar `SMTP_FROM_EMAIL` con email válido
- [ ] Establecer `SMTP_ENABLED=true`
- [ ] Reiniciar el backend
- [ ] Verificar logs: "Servidor SMTP conectado correctamente"
- [ ] Probar agregando un miembro a un grupo
- [ ] Verificar que el email llegue correctamente

## 🎨 Personalizar la Plantilla

Para modificar el diseño del email, edita:

```
backend/src/modules/email/email.service.ts
```

Métodos relevantes:
- `generateGroupInvitationHTML()` - Plantilla HTML
- `generateGroupInvitationText()` - Versión texto plano

## 📚 Documentación Adicional

- **Nodemailer:** https://nodemailer.com/
- **SMTP Setup:** https://nodemailer.com/smtp/
- **Gmail App Passwords:** https://support.google.com/accounts/answer/185833

## 🤝 Soporte

Si tienes problemas con la configuración SMTP, verifica:

1. Logs del backend para mensajes de error específicos
2. Configuración de tu proveedor SMTP
3. Restricciones de firewall o red

---

**Última actualización:** Febrero 2026
