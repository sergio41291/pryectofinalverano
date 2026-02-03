# 🚀 Guía Rápida de Deployment

## Deployment en VPS (89.117.75.145)

### Paso 1: Preparar Archivos Localmente

```bash
# Verificar que todo está listo
./verify-deployment.ps1  # Windows
./verify-deployment.sh   # Linux
```

### Paso 2: Copiar al Servidor

```bash
# Desde tu máquina local
scp -r . usuario@89.117.75.145:/opt/learnmind-ai
```

O usando Git:

```bash
# En el servidor
cd /opt
git clone https://github.com/tu-usuario/learnmind-ai.git
cd learnmind-ai
```

### Paso 3: Configurar Variables

```bash
# En el servidor
cp .env.production .env
nano .env

# CAMBIAR OBLIGATORIAMENTE:
# - Todas las contraseñas (DB, MongoDB, Redis, MinIO)
# - JWT secrets (32+ caracteres)
# - API keys (Anthropic, Google, Stripe, ElevenLabs)
```

### Paso 4: Ejecutar Deployment

```bash
chmod +x deploy.sh setup-ssl.sh
./deploy.sh
```

### Paso 5: Verificar

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Health check
curl https://learnmind-ai.jkhoster.com/api/health

# Acceder
# Frontend: https://learnmind-ai.jkhoster.com
# API: https://learnmind-ai.jkhoster.com/api
```

---

## Comandos Útiles

### Ver Estado de Servicios
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Ver Logs
```bash
# Todos
docker-compose -f docker-compose.prod.yml logs -f

# Específico
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Reiniciar Servicio
```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
docker-compose -f docker-compose.prod.yml restart nginx
```

### Detener Todo
```bash
docker-compose -f docker-compose.prod.yml down
```

### Actualizar Aplicación
```bash
git pull origin main
./deploy.sh
```

### Backup Base de Datos
```bash
# PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U learnmind_user learnmind_production > backup.sql

# MongoDB
docker-compose -f docker-compose.prod.yml exec mongodb mongodump --authenticationDatabase admin -u learnmind_mongo -p PASSWORD --out /backup
```

---

## Troubleshooting Rápido

### Backend no responde
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Frontend muestra error
```bash
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml restart frontend
```

### SSL no funciona
```bash
./setup-ssl.sh
docker-compose -f docker-compose.prod.yml restart nginx
```

### Migraciones no corrieron
```bash
docker-compose -f docker-compose.prod.yml run --rm backend npm run migration:run
```

---

## URLs Importantes

| Servicio | URL |
|----------|-----|
| **Frontend** | https://learnmind-ai.jkhoster.com |
| **Backend API** | https://learnmind-ai.jkhoster.com/api |
| **API Docs** | https://learnmind-ai.jkhoster.com/api/docs |
| **Health Check** | https://learnmind-ai.jkhoster.com/api/health |
| **MinIO Console** | http://89.117.75.145:9001 |

---

## Checklist de Deployment

- [ ] Servidor VPS preparado (Docker, Docker Compose, Git)
- [ ] Firewall configurado (puertos 22, 80, 443)
- [ ] DNS configurado (learnmind-ai.jkhoster.com → 89.117.75.145)
- [ ] Archivo .env.production con todas las credenciales
- [ ] API keys obtenidas (Anthropic, Google, Stripe, ElevenLabs)
- [ ] Google Cloud credentials JSON copiado a backend/credentials/
- [ ] Scripts de deployment ejecutables (chmod +x)
- [ ] Deployment ejecutado (./deploy.sh)
- [ ] SSL certificado obtenido (Let's Encrypt)
- [ ] Health check exitoso
- [ ] Frontend carga correctamente
- [ ] Login funciona
- [ ] Upload de documento funciona
- [ ] OCR funciona
- [ ] Resumen con IA funciona
- [ ] Emails se envían correctamente

---

## Contacto y Soporte

**Email**: jc.ulloa@jkarlos.info  
**Dominio**: learnmind-ai.jkhoster.com  
**IP VPS**: 89.117.75.145

Para más detalles, ver [README.md](README.md) y [DEPLOYMENT.md](DEPLOYMENT.md)
