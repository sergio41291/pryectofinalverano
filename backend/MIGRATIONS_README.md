# 📝 Nota sobre Migraciones del Backend

## Estado Actual en VPS

En el VPS (producción), las migraciones están configuradas así:

### Migraciones Activas:
1. **1700000000000-InitialSchema.ts** - Crea TODAS las tablas del esquema inicial
2. **1706530800000-AddCascadeDeleteToOcrResults.ts** - Modifica restricciones FK

### Migraciones en Backup:
Las siguientes migraciones están en `backend/migrations_backup/` en el VPS porque sus tablas ya fueron creadas por InitialSchema:

- 1738602000000-AddCategories.ts
- 1738604000000-CreateDocumentShares.ts
- 1740000001000-AddAudioSummaryAndStoragePaths.ts
- 1743638400000-CreateSummariesTable.ts
- 1743700000000-CreateMindMapsTable.ts
- 1743800000000-CreateGroupsAndMembers.ts
- 1743900000000-AddGroupIdToContent.ts
- 1744000000000-CreateTranslationsTable.ts
- 1745000000000-CreatePaymentsTable.ts
- 1745100000000-AddStripeFieldsToUsers.ts

## ⚠️ IMPORTANTE para Desarrollo Local

Si necesitas inicializar tu base de datos local desde cero:

### Opción 1: Usar InitialSchema (Recomendado para coincidir con producción)

```bash
cd backend

# 1. Generar InitialSchema localmente
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate src/migrations/InitialSchema -d src/data-source.ts

# 2. Renombrar con timestamp anterior
# De: src/migrations/TIMESTAMP-InitialSchema.ts
# A:  src/migrations/1700000000000-InitialSchema.ts

# 3. Editar el archivo y cambiar el nombre de la clase
# De: export class InitialSchemaXXXXXXXXXXXXX
# A:  export class InitialSchema1700000000000

# 4. Mover migraciones antiguas a backup (para no ejecutarlas)
mkdir -p src/migrations_backup
mv src/migrations/1738*.ts src/migrations/174*.ts src/migrations_backup/

# 5. Ejecutar migraciones
npm run migration:run
```

### Opción 2: Usar las migraciones individuales (Método original)

```bash
cd backend

# Ejecutar todas las migraciones en orden
npm run migration:run
```

## 🔄 Para Nuevas Migraciones

Cuando necesites agregar cambios al esquema:

```bash
cd backend

# Generar migración automática
npm run migration:generate -- src/migrations/NombreDescriptivo

# O crear migración vacía (para escribir manualmente)
npm run migration:create -- src/migrations/NombreDescriptivo
```

Las nuevas migraciones se ejecutarán tanto en local como en producción con:

```bash
npm run migration:run
```

## 🚀 En el VPS (Producción)

Para actualizar el backend en producción:

```bash
# 1. Conectar al VPS
ssh root@89.117.75.145

# 2. Ir al directorio
cd /home/sw1/pryectofinalverano/backend

# 3. Pull de cambios
git pull origin develop

# 4. Ejecutar nuevas migraciones
npm run migration:run

# 5. Reiniciar backend
pm2 restart learnmind-backend
```

## ℹ️ Por Qué InitialSchema

En producción se consolidaron todas las migraciones iniciales en una sola (InitialSchema) por estas razones:

1. **Orden de Ejecución**: Evita problemas de dependencias circulares
2. **Velocidad**: Una migración grande es más rápida que 10 pequeñas
3. **Mantenibilidad**: Más fácil de entender el esquema completo
4. **Limpieza**: Elimina migraciones redundantes o conflictivas

## 📋 Verificar Estado de Migraciones

```bash
# Ver migraciones ejecutadas
npm run migration:show

# Ver tablas en la base de datos
# PostgreSQL:
docker exec -it learnmind-postgres psql -U learnmind_user -d learnmind_production -c "\dt"

# Contar migraciones en la tabla
docker exec -it learnmind-postgres psql -U learnmind_user -d learnmind_production -c "SELECT COUNT(*) FROM migrations;"
```

## 🎯 Tablas Creadas por InitialSchema

La migración InitialSchema crea estas 17 tablas:

1. users
2. subscriptions
3. ocr_results
4. group_members
5. groups
6. categories
7. uploads
8. questionnaires
9. audio_results
10. questionnaire_responses
11. questionnaire_shares
12. summaries
13. mind_maps
14. translations
15. payments
16. document_shares
17. migrations (automática de TypeORM)

Todas con sus índices, foreign keys y constraints.
