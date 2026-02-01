# 📋 FASE 3 + 4 - CHECKLIST DE IMPLEMENTACIÓN

**Fecha Inicio:** 2026-02-01  
**Duración Estimada:** 3-4 semanas  
**Objetivo:** Mapas Mentales + Traducciones + Grupos + Stripe

---

## 🎯 SEMANA 1: MAPAS MENTALES + BASE DE GRUPOS

### 📊 Día 1-2: Mapas Mentales - Backend

**Backend - Entidad y Base de Datos**
- [x] Crear `backend/src/entities/mind-map.entity.ts`
  - [x] Campos: id, userId, title, sourceText, structure (JSONB), createdAt, updatedAt
  - [x] Relación con User (ManyToOne)
  - [x] Validaciones de campos

- [x] Crear migration `1743700000000-CreateMindMapsTable.ts`
  - [x] Tabla mind_maps
  - [x] Índices (userId, createdAt)
  - [x] Foreign key a users
  - [x] JSONB para structure

- [x] Actualizar `app.module.ts`
  - [x] Agregar MindMap a entities array

- [x] Actualizar `data-source.ts`
  - [x] Agregar MindMap a entities

**Backend - Módulo MindMaps**
- [x] Crear directorio `backend/src/modules/mind-maps/`
- [x] Crear `mind-maps.module.ts`
  - [x] Importar TypeOrmModule.forFeature([MindMap])
  - [x] Importar forwardRef(() => AiModule)

- [x] Crear `mind-maps.service.ts`
  - [x] `generateMindMap(userId, text)` - Llama a Claude
  - [x] `getMindMaps(userId, page, limit)` - Lista con paginación
  - [x] `getMindMap(id, userId)` - Obtiene uno específico
  - [x] `deleteMindMap(id, userId)` - Elimina
  - [x] `downloadMindMap(id, userId)` - Exporta JSON

- [x] Crear `mind-maps.controller.ts`
  - [x] POST `/api/mind-maps/generate` - Generar con streaming
  - [x] GET `/api/mind-maps` - Listar con paginación
  - [x] GET `/api/mind-maps/:id` - Obtener uno
  - [x] DELETE `/api/mind-maps/:id` - Eliminar
  - [x] GET `/api/mind-maps/:id/download` - Descargar JSON

- [x] Crear DTOs
  - [x] `dto/generate-mind-map.dto.ts` (text, language?)
  - [x] `dto/mind-map-response.dto.ts`

**Backend - Integración con Claude**
- [x] Actualizar `ai.service.ts`
  - [x] `generateMindMapStructure(text)` - Prompt para extraer nodos y relaciones
  - [x] Formato de respuesta: `{ nodes: [...], edges: [...] }`
  - [x] Validar estructura JSON
  - [x] Mejorar algoritmo de posicionamiento (evitar superposición)

### 📊 Día 3: Mapas Mentales - Frontend

**Frontend - Componentes**
- [x] Crear `frontend/src/components/MindMapGenerator.tsx`
  - [x] Textarea para input
  - [x] Botón generar
  - [x] Loading state con streaming
  - [x] Vista previa del JSON generado

- [x] Crear `frontend/src/components/MindMapVisualization.tsx`
  - [x] Integrar React Flow o D3.js
  - [x] Renderizar nodos y edges
  - [x] Zoom y pan
  - [x] Tooltips en nodos
  - [x] Nodos arrastrables (drag & drop)
  - [x] Mejor espaciado para evitar superposición

- [x] Crear `frontend/src/components/MindMapsList.tsx`
  - [x] Cards con preview
  - [x] Paginación
  - [x] Botones: Ver, Descargar, Eliminar
  - [x] Filtros por fecha

- [x] Crear `frontend/src/pages/MindMaps.tsx`
  - [x] Layout principal
  - [x] Refactorizado: Solo mostrar lista de guardados (sin tab Generar)

**Frontend - Servicios**
- [x] Crear `frontend/src/services/mindMapService.ts`
  - [x] `generateMindMap(text)` - Streaming
  - [x] `getMindMaps(page, limit)`
  - [x] `getMindMap(id)`
  - [x] `deleteMindMap(id)`
  - [x] `downloadMindMap(id)`

**Frontend - Integración**
- [x] Actualizar `Sidebar.tsx`
  - [x] Agregar item "Mapas Mentales" con ícono Network
  - [x] Navegación a sección

**Frontend - Refactorización IA Lab (COMPLETADO)**
- [x] Crear `frontend/src/components/MindMapModal.tsx`
  - [x] Seguir patrón de SummaryModal
  - [x] Tab Nuevo Archivo: Drag & drop, upload PDF/Image/Audio
  - [x] Tab Archivos Existentes: Seleccionar archivos ya procesados
  - [x] Integración con OCR y transcripción de audio
  - [x] Generar mapa mental desde texto extraído
  - [x] Mostrar vista previa del mapa generado

- [x] Actualizar `frontend/src/pages/Home.tsx`
  - [x] Agregar estado `isMindMapModalOpen`
  - [x] Agregar card "Mapas Mentales" en sección IA Lab
  - [x] Grid de 3 columnas (Resumen, Cuestionario, Mapas Mentales)
  - [x] Botón "Probar ahora" con hover effect
  - [x] Color morado/purple para card
  - [x] Icono Network
  - [x] Agregar MindMapModal al final con otros modales

- [x] Modificar `frontend/src/pages/MindMaps.tsx`
  - [x] Eliminar MindMapGenerator import y uso
  - [x] Quitar tab "Generar"
  - [x] Solo mostrar MindMapsList (visualización de guardados)
  - [x] Actualizar descripción: "Visualiza y gestiona tus mapas mentales guardados"
  - [x] Info box: Indicar que generación se hace desde IA Lab

- [x] Actualizar `Home.tsx`
  - [x] Case 'mapas-mentales' en renderContenido()
  - [x] Renderizar componente MindMaps

### 📊 Día 4-5: Base de Datos para Grupos

**Backend - Entidades**
- [ ] Crear `backend/src/entities/group.entity.ts`
  - [ ] Campos: id, name, description, ownerId, createdAt, updatedAt
  - [ ] Relación con User (ManyToOne)
  - [ ] Relación con GroupMember (OneToMany)

- [ ] Crear `backend/src/entities/group-member.entity.ts`
  - [ ] Campos: id, groupId, userId, role, permissions, joinedAt
  - [ ] Enum roles: 'owner' | 'admin' | 'member'
  - [ ] Relación con Group (ManyToOne)
  - [ ] Relación con User (ManyToOne)

- [ ] Crear migration `1743800000000-CreateGroupsAndMembers.ts`
  - [ ] Tabla groups
  - [ ] Tabla group_members
  - [ ] Índices
  - [ ] Foreign keys

- [ ] Actualizar `app.module.ts` y `data-source.ts`
  - [ ] Agregar Group y GroupMember

**Backend - Seeds (Opcional)**
- [ ] Crear `backend/scripts/seed-groups.ts`
  - [ ] Grupos de ejemplo
  - [ ] Miembros de ejemplo

---

## 🎯 SEMANA 2: GRUPOS + RBAC

### 📊 Día 6-8: Backend - Grupos

**Backend - Módulo Groups**
- [ ] Crear directorio `backend/src/modules/groups/`
- [ ] Crear `groups.module.ts`

- [ ] Crear `groups.service.ts`
  - [ ] `createGroup(userId, dto)` - Crear grupo y añadir owner
  - [ ] `getMyGroups(userId)` - Listar mis grupos
  - [ ] `getGroup(groupId, userId)` - Obtener detalle
  - [ ] `updateGroup(groupId, userId, dto)` - Actualizar (solo owner)
  - [ ] `deleteGroup(groupId, userId)` - Eliminar (solo owner)
  - [ ] `addMember(groupId, userId, email, role)` - Invitar miembro
  - [ ] `updateMemberRole(groupId, memberId, role)` - Cambiar rol
  - [ ] `removeMember(groupId, memberId)` - Expulsar miembro
  - [ ] `leaveGroup(groupId, userId)` - Salir de grupo

- [ ] Crear `groups.controller.ts`
  - [ ] POST `/api/groups` - Crear
  - [ ] GET `/api/groups` - Listar mis grupos
  - [ ] GET `/api/groups/:id` - Detalle
  - [ ] PUT `/api/groups/:id` - Actualizar
  - [ ] DELETE `/api/groups/:id` - Eliminar
  - [ ] POST `/api/groups/:id/members` - Añadir miembro
  - [ ] PUT `/api/groups/:id/members/:userId` - Actualizar rol
  - [ ] DELETE `/api/groups/:id/members/:userId` - Remover miembro
  - [ ] POST `/api/groups/:id/leave` - Salir del grupo

- [ ] Crear DTOs
  - [ ] `dto/create-group.dto.ts`
  - [ ] `dto/update-group.dto.ts`
  - [ ] `dto/add-member.dto.ts`
  - [ ] `dto/update-member-role.dto.ts`

**Backend - RBAC (Role-Based Access Control)**
- [ ] Crear `common/guards/group-role.guard.ts`
  - [ ] Verificar si user es owner/admin/member
  - [ ] Decorator @RequireGroupRole('owner')

- [ ] Crear `common/decorators/group-role.decorator.ts`
  - [ ] @RequireGroupRole('owner' | 'admin' | 'member')

**Backend - Validaciones**
- [ ] Validar que owner no puede salir del grupo
- [ ] Validar límites de miembros por plan (FREE: 0, PRO: 5, BUSINESS: ilimitado)
- [ ] Validar permisos por rol
- [ ] Validar emails únicos en grupo

**Backend - Tests**
- [ ] Unit tests para GroupService (8 tests)
  - [ ] Crear grupo
  - [ ] Añadir miembro
  - [ ] Cambiar rol
  - [ ] Remover miembro
  - [ ] Validar permisos
  - [ ] Limitar miembros por plan
  - [ ] Owner no puede salir
  - [ ] Eliminar grupo

### 📊 Día 9-10: Frontend - Grupos

**Frontend - Componentes**
- [ ] Crear `frontend/src/components/GroupsList.tsx`
  - [ ] Cards de grupos
  - [ ] Botones: Ver, Editar, Eliminar
  - [ ] Badge de rol (Owner/Admin/Member)
  - [ ] Contador de miembros

- [ ] Crear `frontend/src/components/GroupModal.tsx`
  - [ ] Formulario crear/editar
  - [ ] Nombre, descripción
  - [ ] Validaciones

- [ ] Crear `frontend/src/components/GroupMembersModal.tsx`
  - [ ] Lista de miembros
  - [ ] Botón invitar (input email)
  - [ ] Dropdown cambiar rol
  - [ ] Botón remover
  - [ ] Indicador de owner

- [ ] Crear `frontend/src/components/GroupCard.tsx`
  - [ ] Diseño de card
  - [ ] Avatares de miembros
  - [ ] Acciones según rol

- [ ] Crear `frontend/src/pages/Groups.tsx`
  - [ ] Layout principal
  - [ ] Botón "Crear Grupo"
  - [ ] Lista de grupos

**Frontend - Servicios**
- [ ] Crear `frontend/src/services/groupService.ts`
  - [ ] CRUD completo
  - [ ] Gestión de miembros

**Frontend - Integración**
- [ ] Actualizar `Sidebar.tsx`
  - [ ] Item "Mis Grupos" con ícono Users

- [ ] Actualizar `Home.tsx`
  - [ ] Case 'grupos' en renderContenido()

---

## 🎯 SEMANA 3: STRIPE + PAGOS

### 📊 Día 11-13: Backend - Stripe

**Setup Stripe**
- [ ] Crear cuenta en Stripe Dashboard
- [ ] Obtener API keys (test mode)
  - [ ] STRIPE_PUBLIC_KEY
  - [ ] STRIPE_SECRET_KEY
  - [ ] STRIPE_WEBHOOK_SECRET

- [ ] Crear productos en Stripe Dashboard
  - [ ] FREE (gratis)
  - [ ] PRO ($9.99/mes)
  - [ ] BUSINESS ($29.99/mes)

- [ ] Configurar webhooks en Stripe
  - [ ] URL: https://tu-dominio.com/api/payments/webhook
  - [ ] Eventos: payment_intent.succeeded, customer.subscription.*

**Backend - Entidad Payment**
- [ ] Crear `backend/src/entities/payment.entity.ts`
  - [ ] Campos: id, userId, stripePaymentId, amount, status, subscriptionTier, createdAt

- [ ] Crear migration `1743900000000-CreatePaymentsTable.ts`

- [ ] Actualizar `app.module.ts` y `data-source.ts`

**Backend - Módulo Payments**
- [ ] Instalar dependencia: `npm install stripe`

- [ ] Crear directorio `backend/src/modules/payments/`
- [ ] Crear `payments.module.ts`

- [ ] Crear `payments.service.ts`
  - [ ] `createCheckoutSession(userId, tier)` - Inicia checkout Stripe
  - [ ] `handleWebhook(event)` - Procesa eventos de Stripe
  - [ ] `verifyPayment(sessionId)` - Verifica pago completado
  - [ ] `updateSubscription(userId, tier)` - Actualiza suscripción en BD
  - [ ] `cancelSubscription(userId)` - Cancela suscripción
  - [ ] `getPaymentHistory(userId)` - Historial de pagos

- [ ] Crear `payments.controller.ts`
  - [ ] POST `/api/payments/create-checkout` - Crear sesión Stripe
  - [ ] POST `/api/payments/webhook` - Webhook de Stripe (sin auth)
  - [ ] GET `/api/payments/history` - Historial
  - [ ] POST `/api/payments/cancel` - Cancelar suscripción
  - [ ] GET `/api/payments/verify/:sessionId` - Verificar pago

- [ ] Crear DTOs
  - [ ] `dto/create-checkout.dto.ts`
  - [ ] `dto/payment-response.dto.ts`

**Backend - Seguridad**
- [ ] Validar firma de webhooks con `stripe.webhooks.constructEvent()`
- [ ] Implementar idempotencia (verificar payment_id)
- [ ] Rate limiting en endpoints de pago
- [ ] Logs de auditoría para pagos

**Backend - Actualizar User Entity**
- [ ] Agregar campo `subscriptionTier` a User
  - [ ] Enum: 'FREE' | 'PRO' | 'BUSINESS'
  - [ ] Default: 'FREE'

- [ ] Agregar campo `stripeCustomerId`

- [ ] Crear migration para nuevos campos

**Backend - Middleware de Límites**
- [ ] Crear `common/guards/subscription-limit.guard.ts`
  - [ ] Verificar límites según plan
  - [ ] FREE: 5 docs, 10MB, 0 grupos
  - [ ] PRO: 100 docs, 5GB, 5 grupos
  - [ ] BUSINESS: ilimitado

**Backend - Tests**
- [ ] Unit tests para PaymentService (6 tests)
- [ ] Integration tests para webhooks (5 tests)

### 📊 Día 14-15: Frontend - Stripe

**Frontend - Instalar Stripe**
- [ ] `npm install @stripe/stripe-js`

**Frontend - Componentes**
- [ ] Crear `frontend/src/components/SubscriptionPlans.tsx`
  - [ ] 3 cards (FREE, PRO, BUSINESS)
  - [ ] Botones "Elegir Plan"
  - [ ] Lista de features por plan
  - [ ] Badge "Actual" en plan activo

- [ ] Crear `frontend/src/components/CheckoutButton.tsx`
  - [ ] Redirige a Stripe Checkout
  - [ ] Loading state
  - [ ] Success/error handling

- [ ] Crear `frontend/src/components/PaymentHistory.tsx`
  - [ ] Tabla de pagos
  - [ ] Columnas: Fecha, Monto, Plan, Estado
  - [ ] Filtros por fecha

- [ ] Crear `frontend/src/components/ManageSubscription.tsx`
  - [ ] Mostrar plan actual
  - [ ] Botón "Cambiar Plan"
  - [ ] Botón "Cancelar Suscripción"
  - [ ] Fecha de renovación

- [ ] Crear `frontend/src/pages/Subscription.tsx`
  - [ ] Tabs: Planes | Historial | Gestionar

**Frontend - Servicios**
- [ ] Crear `frontend/src/services/paymentService.ts`
  - [ ] `createCheckout(tier)`
  - [ ] `getPaymentHistory()`
  - [ ] `cancelSubscription()`
  - [ ] `verifyPayment(sessionId)`

**Frontend - Integración**
- [ ] Actualizar `Sidebar.tsx`
  - [ ] Item "Mi Suscripción" con ícono CreditCard

- [ ] Actualizar `Home.tsx`
  - [ ] Case 'suscripcion' en renderContenido()

**Frontend - Success Page**
- [ ] Crear `frontend/src/pages/PaymentSuccess.tsx`
  - [ ] Verificar payment con sessionId
  - [ ] Mensaje de confirmación
  - [ ] Botón volver al dashboard

**Frontend - Variables de Entorno**
- [ ] Agregar a `.env`
  - [ ] VITE_STRIPE_PUBLIC_KEY=pk_test_...

---

## 🎯 SEMANA 4: TRADUCCIONES + PULIDO

### 📊 Día 16-17: Traducciones

**Backend - Módulo Translations**
- [ ] Actualizar `ai.service.ts`
  - [ ] `translateText(text, targetLang)` - Usa Claude o Google Translate
  - [ ] Soporte para: EN, ES, FR, DE, PT, IT
  - [ ] Cache de traducciones (Redis)

- [ ] Actualizar `ai.controller.ts`
  - [ ] POST `/api/processing/translate`
  - [ ] Body: { text, targetLanguage }
  - [ ] Retorna: { original, translated, targetLanguage }

- [ ] Crear DTOs
  - [ ] `dto/translate.dto.ts`

**Backend - Cache**
- [ ] Implementar cache en Redis
  - [ ] Key: `translation:${hash(text)}:${lang}`
  - [ ] TTL: 30 días

**Frontend - Componentes**
- [ ] Crear `frontend/src/components/TranslateModal.tsx`
  - [ ] Textarea input
  - [ ] Dropdown idiomas
  - [ ] Botón traducir
  - [ ] Mostrar resultado
  - [ ] Botón copiar

- [ ] Crear selector de idioma en:
  - [ ] SummaryModal (traducir resumen)
  - [ ] QuestionnaireGenerator (traducir cuestionario)
  - [ ] AudioSummaryModal (traducir transcripción)

**Frontend - Servicios**
- [ ] Actualizar `aiService.ts`
  - [ ] `translate(text, targetLanguage)`

**Frontend - Integración**
- [ ] Agregar botón "Traducir" en:
  - [ ] Resúmenes guardados
  - [ ] Cuestionarios
  - [ ] Transcripciones de audio

### 📊 Día 18-20: Pulido y Testing

**Testing**
- [ ] Unit tests para MindMapService (5 tests)
- [ ] Unit tests para GroupService (8 tests)
- [ ] Unit tests para PaymentService (6 tests)
- [ ] Integration tests para flujos completos
- [ ] E2E tests para features críticas
- [ ] Verificar cobertura >80%

**Documentación**
- [ ] Actualizar README.md
  - [ ] Nuevas features
  - [ ] Setup de Stripe

- [ ] Actualizar ARCHITECTURE.md
  - [ ] Nuevas entidades
  - [ ] Flujos de pago

- [ ] Crear Swagger docs
  - [ ] Documentar todos los endpoints
  - [ ] Ejemplos de requests/responses

- [ ] Crear guía de Stripe
  - [ ] Setup de webhooks
  - [ ] Testing en modo test
  - [ ] Troubleshooting

**Performance**
- [ ] Optimizar queries con índices
  - [ ] Índice en groups.ownerId
  - [ ] Índice en payments.userId
  - [ ] Índice compuesto en group_members

- [ ] Implementar paginación en:
  - [ ] Mapas mentales
  - [ ] Grupos
  - [ ] Historial de pagos

- [ ] Cache de datos frecuentes
  - [ ] User subscription tier
  - [ ] Group memberships

**DevOps**
- [ ] Actualizar docker-compose.yml
  - [ ] Variables de Stripe

- [ ] Crear health checks
  - [ ] /api/health/stripe (verifica API key)
  - [ ] /api/health/redis (verifica cache)

- [ ] Rate limiting
  - [ ] Payments: 5 req/min
  - [ ] AI endpoints: 10 req/min

**Seguridad**
- [ ] Validar inputs en todos los DTOs
- [ ] Sanitizar outputs
- [ ] CSRF protection en webhooks
- [ ] Logs de auditoría para acciones críticas

**UI/UX**
- [ ] Loading states en todos los componentes
- [ ] Error handling con mensajes claros
- [ ] Confirmaciones en acciones destructivas
- [ ] Tooltips explicativos
- [ ] Responsive design

---

## 📊 MÉTRICAS DE ÉXITO

| Feature | Tests | Docs | Performance | Status |
|---------|-------|------|-------------|--------|
| Mapas Mentales | 5 tests | ✅ Swagger | <300ms | ⏳ |
| Grupos | 8 tests | ✅ Swagger | <200ms | ⏳ |
| Stripe | 11 tests | ✅ Guide | <500ms | ⏳ |
| Traducciones | 3 tests | ✅ Swagger | <400ms | ⏳ |

---

## 🎯 CRITERIOS DE ACEPTACIÓN

### Mapas Mentales
- [ ] Usuario puede generar mapa mental desde texto
- [ ] Visualización interactiva funciona (zoom, pan)
- [ ] Se guardan en base de datos
- [ ] Se pueden descargar como JSON
- [ ] Lista con paginación funciona

### Grupos
- [ ] Usuario puede crear grupo
- [ ] Owner puede invitar miembros por email
- [ ] Roles funcionan correctamente (owner/admin/member)
- [ ] Owner no puede salir del grupo
- [ ] Límites por plan funcionan
- [ ] RBAC bloquea acciones no autorizadas

### Stripe
- [ ] Checkout redirige correctamente
- [ ] Webhook actualiza suscripción
- [ ] Cancelación funciona
- [ ] Historial de pagos se muestra
- [ ] Límites por plan se aplican
- [ ] Validación de firma de webhook

### Traducciones
- [ ] Traduce texto correctamente
- [ ] Cache funciona (no traduce 2 veces mismo texto)
- [ ] Soporta 6 idiomas
- [ ] Integrado en resúmenes y cuestionarios

---

## 🚀 PRÓXIMOS PASOS DESPUÉS DE FASE 3+4

1. **Deploy a Staging**
   - [ ] Configurar Railway/Vercel
   - [ ] Variables de entorno
   - [ ] SSL certificates
   - [ ] Health checks

2. **Monitoreo**
   - [ ] Sentry para errores
   - [ ] Analytics
   - [ ] Logs centralizados

3. **Marketing**
   - [ ] Landing page
   - [ ] Documentación pública
   - [ ] Video demo

---

**Última actualización:** 2026-02-01  
**Estado:** 🚀 READY TO START  
**Prioridad:** Mapas Mentales → Grupos → Stripe → Traducciones
