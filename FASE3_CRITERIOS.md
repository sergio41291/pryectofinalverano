# 📋 FASE 3 - Criterios y Plan de Desarrollo

## 🎯 Visión de Fase 3

**Objetivo:** Convertir LearnMind de un MVP a una plataforma lista para negocio con:
- Colaboración en grupos
- Sistema de pagos (monetización)
- Organización avanzada de documentos
- Búsqueda inteligente

**Duración estimada:** 4 semanas  
**Story Points totales:** ~42 puntos  
**Prioridad:** 🔴 CRÍTICA (es el diferenciador del producto)

---

## 🏗️ Arquitectura de Fase 3

### Entidades Nuevas a Crear

```typescript
// 1. GROUP - Colaboración
├─ id: UUID
├─ name: string
├─ description: text
├─ ownerId: UUID (User)
├─ subscriptionId: UUID (Subscription)
├─ createdAt: Date
└─ members: GroupMember[]

// 2. GROUP_MEMBER - Roles en grupos
├─ id: UUID
├─ groupId: UUID
├─ userId: UUID
├─ role: 'owner' | 'admin' | 'member'
├─ joinedAt: Date
└─ permissions: string[]

// 3. CATEGORY - Organización
├─ id: UUID
├─ userId: UUID
├─ name: string
├─ color: string
├─ icon: string
└─ documents: Document[]

// 4. PAYMENT - Stripe integration
├─ id: UUID
├─ userId: UUID
├─ stripePaymentId: string
├─ amount: decimal
├─ status: 'pending' | 'succeeded' | 'failed'
├─ subscriptionTier: string
└─ createdAt: Date
```

---

## 📅 Timeline de 4 Semanas

### SEMANA 1: Grupos (Colaboración)
**Objetivo:** Permitir que usuarios creen grupos y compartan documentos  
**Story Points:** 11  
**Prioridad:** 🔴 CRÍTICA

#### Tareas:
1. **Base de datos**
   - [ ] Crear entidad `Group`
   - [ ] Crear entidad `GroupMember`
   - [ ] Crear migration
   - [ ] Crear seeds de ejemplo

2. **Backend - Servicios**
   ```typescript
   // GroupService
   - createGroup(userId, dto) → Group
   - getMyGroups(userId) → Group[]
   - getGroup(groupId, userId) → Group
   - addMember(groupId, email, role) → GroupMember
   - removeMember(groupId, memberId) → void
   - updateMemberRole(groupId, memberId, role) → GroupMember
   - deleteGroup(groupId, userId) → void
   ```

3. **Backend - Controlador**
   ```typescript
   // GroupController
   POST   /groups                        → create
   GET    /groups                        → getMyGroups
   GET    /groups/:id                    → getGroup
   POST   /groups/:id/members            → addMember
   PUT    /groups/:id/members/:userId    → updateRole
   DELETE /groups/:id/members/:userId    → removeMember
   DELETE /groups/:id                    → deleteGroup
   ```

4. **Frontend - Componentes**
   - [ ] `GroupsList.tsx` - Listar mis grupos
   - [ ] `GroupModal.tsx` - Crear/editar grupo
   - [ ] `GroupMembersModal.tsx` - Gestionar miembros
   - [ ] `GroupCard.tsx` - Card de grupo

5. **Validaciones**
   - [ ] Role-based access control (RBAC)
   - [ ] Validar invitaciones por email
   - [ ] Limitar miembros según suscripción
   - [ ] Prevent owner from leaving

---

### SEMANA 2: Sistema de Pagos (Monetización)
**Objetivo:** Integrar Stripe y permitir suscripciones  
**Story Points:** 10  
**Prioridad:** 🔴 CRÍTICA

#### Tareas:
1. **Setup Stripe**
   - [ ] Crear cuenta en Stripe
   - [ ] Crear productos (FREE, PRO, BUSINESS)
   - [ ] Obtener API keys
   - [ ] Configurar webhooks

2. **Backend - Payment Service**
   ```typescript
   // PaymentService
   - initiateCheckout(userId, tier) → checkoutUrl
   - handleWebhook(event) → void
   - verifyPayment(sessionId) → Payment
   - updateSubscription(userId, tier) → User
   - cancelSubscription(userId) → void
   - getPaymentHistory(userId) → Payment[]
   ```

3. **Backend - Webhook Handling**
   ```typescript
   // Eventos a manejar:
   - payment_intent.succeeded
   - charge.failed
   - customer.subscription.created
   - customer.subscription.deleted
   - customer.subscription.updated
   ```

4. **Frontend - Componentes**
   - [ ] `SubscriptionPlans.tsx` - Mostrar planes
   - [ ] `CheckoutButton.tsx` - Botón de pago
   - [ ] `PaymentHistory.tsx` - Historial de pagos
   - [ ] `ManageSubscription.tsx` - Gestionar suscripción

5. **Seguridad**
   - [ ] Validar webhooks con signature
   - [ ] Idempotencia en webhooks
   - [ ] Rate limiting en pagos
   - [ ] Logs de auditoría
   - [ ] Encriptar datos sensibles

#### Estructura de Planes
```
FREE (Gratuito)
├─ 5 documentos/mes
├─ 10 MB almacenamiento
├─ Sin grupos
└─ OCR básico

PRO ($9.99/mes)
├─ 100 documentos/mes
├─ 5 GB almacenamiento
├─ Hasta 5 grupos
├─ OCR + Resúmenes Claude
└─ Traducciones

BUSINESS ($29.99/mes)
├─ Documentos ilimitados
├─ 50 GB almacenamiento
├─ Grupos ilimitados
├─ OCR + Claude + Maps + Audio
└─ Soporte prioritario
```

---

### SEMANA 3: Categorías y Búsqueda
**Objetivo:** Organización inteligente de documentos  
**Story Points:** 9  
**Prioridad:** 🟢 MEDIA

#### Tareas:
1. **Base de datos**
   - [ ] Crear entidad `Category`
   - [ ] Agregar `categoryId` a `Document`
   - [ ] Crear índices para búsqueda
   - [ ] Crear migration

2. **Backend - Category Service**
   ```typescript
   // CategoryService
   - createCategory(userId, dto) → Category
   - getMyCategories(userId) → Category[]
   - updateCategory(categoryId, userId, dto) → Category
   - deleteCategory(categoryId, userId) → void
   - addDocumentToCategory(docId, catId) → void
   ```

3. **Backend - Search Service**
   ```typescript
   // SearchService
   - searchDocuments(userId, query, filters) → Document[]
   - Filtros: category, dateFrom, dateTo, type, minSize
   - Full-text search en PostgreSQL
   - Paginación con límite
   ```

4. **Backend - Endpoints**
   ```typescript
   POST   /categories                 → create
   GET    /categories                 → getMyCategories
   PUT    /categories/:id             → update
   DELETE /categories/:id             → delete
   GET    /documents/search?q=...     → search (con filtros)
   ```

5. **Frontend - Componentes**
   - [ ] `CategoryList.tsx` - Listar categorías
   - [ ] `CategoryModal.tsx` - Crear/editar
   - [ ] `SearchBar.tsx` - Búsqueda avanzada
   - [ ] `FilterPanel.tsx` - Filtros (fechas, tipo, etc)

#### Ejemplo de búsqueda:
```
GET /documents/search?q=machine+learning&category=AI&dateFrom=2026-01-01
→ Devuelve todos los documentos que contengan "machine learning" 
  en la categoría "AI" desde enero 2026
```

---

### SEMANA 4: Testing, Documentación & Pulido
**Objetivo:** Código production-ready  
**Story Points:** 12  
**Prioridad:** 🟠 ALTA

#### Tareas:
1. **Testing**
   - [ ] Unit tests para GroupService (8 tests)
   - [ ] Unit tests para PaymentService (6 tests)
   - [ ] Unit tests para CategoryService (5 tests)
   - [ ] Integration tests para pagos (5 tests)
   - [ ] E2E tests para flujos críticos (4 tests)
   - [ ] Cobertura mínima: 80%

2. **Documentación**
   - [ ] Actualizar ARCHITECTURE.md
   - [ ] API docs con Swagger
   - [ ] Guía de setup de Stripe
   - [ ] Guía de RBAC
   - [ ] Troubleshooting de pagos

3. **Performance**
   - [ ] Optimizar queries (índices)
   - [ ] Caché de categorías
   - [ ] Pagination en búsqueda
   - [ ] Rate limiting en endpoints sensibles

4. **DevOps**
   - [ ] Actualizar docker-compose.yml
   - [ ] Variables de entorno para Stripe
   - [ ] Migrations automáticas
   - [ ] Health checks

---

## 🛣️ Cómo Empezar Fase 3

### Paso 1: Preparar el Entorno (15 minutos)
```bash
# 1. Crear rama feature
git checkout -b feature/phase3-groups-payments develop

# 2. Crear archivo de variables de entorno
cp .env.example .env

# 3. Agregar variables de Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 4. Verificar que todo compila
npm run build
```

### Paso 2: Crear Entidades (30 minutos)
```bash
# Crear archivos en backend/src/entities/
# - group.entity.ts
# - group-member.entity.ts
# - category.entity.ts
# - payment.entity.ts

# Ver template en sección "Entidades Nuevas a Crear"
```

### Paso 3: Crear Módulo Groups (2 horas)
```bash
# Generar estructura
cd backend/src/modules
mkdir groups
cd groups
touch groups.module.ts groups.service.ts groups.controller.ts
mkdir dto

# Crear DTOs
# - create-group.dto.ts
# - add-member.dto.ts
# - update-member-role.dto.ts
```

### Paso 4: Implementar GroupService
**Orden recomendado:**
1. Service methods (CRUD básico)
2. Validaciones (RBAC, límites)
3. Error handling
4. Tests unitarios

### Paso 5: Implementar GroupController
**Endpoints en orden de prioridad:**
1. POST /groups (crear)
2. GET /groups (listar mios)
3. POST /groups/:id/members (añadir)
4. DELETE /groups/:id/members/:userId (remover)
5. PUT /groups/:id/members/:userId (actualizar rol)
6. DELETE /groups/:id (eliminar grupo)

### Paso 6: Frontend (después de tener API lista)
```bash
cd frontend/src/components
# Crear componentes
touch GroupsList.tsx GroupModal.tsx GroupMembersModal.tsx
```

---

## 📊 Criterios de Aceptación por Feature

### ✅ Grupos
- [ ] Usuario puede crear un grupo
- [ ] Usuario propietario puede invitar otros usuarios
- [ ] Roles (owner/admin/member) funcionan correctamente
- [ ] No se puede eliminar grupo si no eres owner
- [ ] Límite de miembros según suscripción
- [ ] RBAC implementado en backend
- [ ] Tests: 80% coverage

### ✅ Pagos
- [ ] Usuario puede ver planes disponibles
- [ ] Checkout redirige a Stripe
- [ ] Webhook actualiza suscripción automáticamente
- [ ] Cancelación funciona
- [ ] Historial de pagos visible
- [ ] Email de confirmación enviado
- [ ] Tests: 80% coverage

### ✅ Categorías & Búsqueda
- [ ] Usuario puede crear categoría
- [ ] Puede filtrar documentos por categoría
- [ ] Full-text search funciona
- [ ] Filtros (fecha, tipo) funcionan
- [ ] Paginación correcta
- [ ] Índices en BD para performance
- [ ] Tests: 80% coverage

---

## 🚀 Inicio Rápido Alternativo

Si quieres empezar MÁS RÁPIDO, priorizar en este orden:

### MVP de Fase 3 (2 semanas)
1. **Semana 1:** Solo Groups básico (sin roles avanzados)
2. **Semana 2:** Stripe integration (sin edge cases)

### Después (Semanas 3-4)
3. Categorías y búsqueda
4. Testing y documentación

---

## 📈 Métricas de Éxito Fase 3

| Métrica | Target | Cómo Medir |
|---------|--------|-----------|
| **Endpoints Funcionales** | 15+ | Postman collection |
| **Test Coverage** | 80%+ | npm run test:cov |
| **Response Time** | <300ms (p95) | Artillery load test |
| **Compilación** | 0 errors | npm run build |
| **Documentación** | 100% | README + Swagger |
| **Security** | OWASP Top 10 | Code review |

---

## ⚠️ Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|--------|-----------|
| Webhook Stripe falla | Media | Alto | Validar webhooks, reintentos, logs |
| RBAC incompleto | Media | Medio | Tests exhaustivos de roles |
| Performance query search | Baja | Alto | Índices, caché, paginación |
| Edge cases en pagos | Media | Crítico | Idempotencia, validación |

---

## 📚 Recursos Necesarios

### Desarrollo
- Visual Studio Code
- Postman (testing APIs)
- Git + GitHub

### Servicios Externos
- Stripe Test API keys
- PostgreSQL (ya tienes)
- Redis (ya tienes)

### Documentación
- [Stripe API Docs](https://stripe.com/docs/api)
- [NestJS Guards & RBAC](https://docs.nestjs.com/guards)
- [PostgreSQL Full-text Search](https://www.postgresql.org/docs/current/textsearch.html)

---

## 🎯 Siguiente: Cómo Empezar HOY

### 1. Crear rama
```bash
git checkout -b feature/phase3-groups-payments develop
```

### 2. Crear entidades
Crear archivos: `group.entity.ts`, `group-member.entity.ts`, etc.

### 3. Crear migration
```bash
typeorm migration:create -n CreateGroupsAndCategories
```

### 4. Primer test
```bash
npm test -- groups.service.spec.ts
```

### 5. Commit inicial
```bash
git commit -m "feat(phase3): setup entities and migrations for groups and payments"
```

---

## 📞 Preguntas a Responder Antes de Empezar

1. **¿Cuál es tu prioridad?**
   - Grupos colaborativos primero? → Semana 1 intensa en RBAC
   - Monetización primero? → Semana 1 intensa en Stripe

2. **¿Usarás MongoDB para pagos?**
   - Recomendado: PostgreSQL para todo

3. **¿Necesitas soporte multi-moneda?**
   - Stripe lo soporta nativamente

4. **¿Qué tan rápido necesitas?**
   - MVP 2 semanas vs Pulido 4 semanas

---

**¿Listo para comenzar? Avísame si tienes dudas o necesitas más detalles en algún área.** 🚀
