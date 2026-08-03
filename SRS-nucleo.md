# Núcleo Sur — System Prompt para Cursor AI v2.0

> **Propósito:** Contexto maestro del proyecto para Cursor AI.
> Coloca este archivo en `.cursor/rules/project.mdc` para que Cursor
> lo lea automáticamente en cada sesión de chat y generación de código.
> Última actualización: junio 2026.

---

## 🏢 Contexto del negocio

### ¿Qué es Núcleo Sur?

Núcleo Sur es una plataforma SaaS B2B de gestión y cumplimiento sanitario
orientada a restaurantes, cafeterías, cocinerías y food trucks del radio
urbano de Osorno, Chile. Cubre el servicio anual de soporte, capacitación
y seguimiento BPM (Buenas Prácticas de Manufactura) que antes se hacía
manualmente con Excel, carpetas físicas y WhatsApp.

### El problema que resuelve

Un inspector del SEREMI puede llegar sin aviso a cualquier local de
alimentación y exigir documentación sanitaria al día: temperaturas diarias,
registros de limpieza, certificados de fumigación, listas de asistencia a
capacitaciones. Si el local no tiene eso ordenado y disponible en el momento,
arriesga multas, clausura temporal o cancelación de la resolución sanitaria.

Hoy los dueños de restaurantes en Osorno gestionan esto en cuadernos, Excel
o simplemente no lo gestionan. Núcleo Sur centraliza todo en una plataforma
accesible desde el celular, con un asesor asignado que los visita mensualmente
y un sistema de sellos que certifica su nivel de cumplimiento.

### El usuario principal

**María González, administradora del Restaurante Los Coihues, Osorno.**
- No tiene formación técnica. Usa su celular Samsung en la cocina.
- Necesita subir el registro de temperatura de la cámara de frío antes
  de abrir el local cada mañana.
- Quiere saber de un vistazo si está bien para la próxima visita del SEREMI.
- Le importa el sello — es lo que muestra a sus clientes y a los inspectores.

### El sistema de sellos (corazón del producto)

Cada mes el sistema evalúa el cumplimiento del local y emite un sello con
nivel y color. Es el diferenciador competitivo de Núcleo Sur:

```
< 60%   → Inicial     🔴 rojo    — Cumplimiento bajo, brechas importantes
60–74%  → Intermedio  🟡 amarillo — Cumplimiento parcial, aspectos por mejorar
75–89%  → Avanzado    🟢 verde   — Buen cumplimiento, procesos en orden
≥ 90%   → Premium     ⚫ negro   — Cumplimiento sobresaliente + descargos gratuitos
```

El sello **Premium** habilita un beneficio exclusivo: descargos administrativos
gratuitos ante la autoridad sanitaria por materias del servicio contratado.
Esto tiene valor económico real para el local.

### Planes de suscripción

| Plan | Precio | Incluye |
|------|--------|---------|
| Plan Calidad | $80.000 CLP/mes ($960.000 anual) | BPM, documentos, capacitaciones, sellos, visita mensual |
| Plan Integral | $150.000 CLP/mes ($1.800.000 anual) | Todo Calidad + gestión ambiental, segregación de residuos, Ventanilla Única |

### Servicios que NO están en la plataforma (se cobran aparte)

- Resolución sanitaria e inicio de actividades
- Elaboración de HACCP y manuales
- Etiquetado y rotulado nutricional
- Proyectos sanitarios y regularizaciones
- Defensa en sumarios graves

### Flujo mensual del negocio

```
Semana 1: Local sube registros diarios (temperaturas, limpieza)
Semana 2: Asesor realiza visita presencial — revisa, capacita, registra NC
Semana 3: Local completa tareas pendientes de la visita
Semana 4: Sistema calcula el sello — genera PDF — notifica al local
Día 1 del mes siguiente: Nuevo ciclo comienza
```

### Tono y lenguaje del sistema

- Español chileno, cercano y directo
- Sin tecnicismos ante el usuario final (dueño del local)
- Mensajes de éxito celebratorios: "¡Tu sello del mes está listo! 🎉"
- Mensajes de alerta sin alarmar: "Tienes 3 documentos por renovar"
- Los errores técnicos (logs, consola) pueden ir en inglés
- Fechas: DD/MM/AAAA — Montos: $80.000 (con punto, sin decimales)
- Zona horaria: America/Santiago siempre

---

## 🎨 Diseño visual — Design System

### Identidad de marca

Núcleo Sur tiene una identidad visual definida: verde oscuro (naturaleza,
sostenibilidad, seguridad alimentaria) + azul marino (confianza, seriedad,
institucional). El logo muestra una "N" con montañas y árboles del sur de Chile
dentro de un círculo tipo reloj (continuidad, seguimiento 24h).

### Paleta de colores

```css
/* Primarios — usar en headers, botones principales, badges de sello */
--color-navy-dark:   #0B2545;   /* azul marino oscuro — textos principales */
--color-navy-mid:    #143556;   /* azul marino medio — headers, sidebar */
--color-green-dark:  #3A6E24;   /* verde oscuro — acentos, éxito */
--color-green-mid:   #4B8B2E;   /* verde medio — botones primarios, sellos */
--color-green-light: #EBF5E6;   /* verde claro — backgrounds de éxito */

/* Sellos — colores exactos por nivel */
--sello-inicial:     #DC2626;   /* rojo */
--sello-intermedio:  #D97706;   /* amarillo/ámbar */
--sello-avanzado:    #16A34A;   /* verde */
--sello-premium:     #1C1917;   /* negro casi */

/* Neutrales */
--color-gray-bg:     #F8F9FA;   /* fondo general de la app */
--color-gray-border: #E2E8F0;   /* bordes de tarjetas */
--color-gray-text:   #64748B;   /* texto secundario */
--color-white:       #FFFFFF;

/* Semánticos */
--color-danger:      #DC2626;
--color-warning:     #D97706;
--color-success:     #16A34A;
--color-info:        #2563EB;
```

### Tipografía

```css
/* Fuente principal — Inter (ya incluida en Next.js 15) */
font-family: 'Inter', sans-serif;

/* Jerarquía */
h1: 2rem    / 700 / #0B2545   /* títulos de página */
h2: 1.5rem  / 600 / #143556   /* secciones */
h3: 1.125rem/ 600 / #3A6E24   /* subsecciones */
body: 1rem  / 400 / #334155   /* texto general */
small: 0.875rem / 400 / #64748B /* metadatos, fechas */
```

### Componentes clave de UI

**Sidebar (escritorio):**
- Fondo: `#0B2545` (navy dark)
- Texto items: blanco con opacidad 0.7
- Item activo: fondo `#143556`, texto blanco, borde izquierdo `#4B8B2E` 3px
- Logo arriba, nombre del local y ciudad abajo
- En móvil: se convierte en bottom navigation bar de 5 íconos

**TopBar:**
- Fondo blanco con borde inferior `#E2E8F0`
- Saludo personalizado: "Bienvenida/o, María 👋"
- Nombre del local en subtítulo
- Avatar del usuario derecha + campana de notificaciones con badge rojo

**Dashboard — tarjeta del sello:**
- Tarjeta prominente, borde izquierdo 4px del color del nivel actual
- Badge circular con el ícono del sello (medal icon de Tabler)
- Porcentaje en grande (3rem, bold)
- Barra de progreso hacia el siguiente nivel
- Texto motivacional abajo

**Tarjetas de KPI:**
- Grid 2x2 en móvil, 4 columnas en desktop
- Fondo blanco, sombra sutil, borde `#E2E8F0`
- Porcentaje en color (verde si bien, rojo si bajo)
- Ícono representativo de cada categoría

**Alertas importantes:**
- Panel derecho en desktop, sección colapsable en móvil
- Ícono de color según urgencia (rojo = vencido, amarillo = próximo)
- Cada alerta es un link que lleva directo al problema

**Badges de estado:**
```
completo:   bg-green-100  text-green-800
pendiente:  bg-yellow-100 text-yellow-800
vencido:    bg-red-100    text-red-800
aprobado:   bg-green-100  text-green-800
observado:  bg-yellow-100 text-yellow-800
rechazado:  bg-red-100    text-red-800
```

**Formularios de registro (uso en cocina, móvil):**
- Inputs grandes (min-height: 48px) para uso con dedos
- Labels claros arriba del input, nunca placeholder como label
- Botón de submit al fondo, ancho completo en móvil
- Feedback inmediato con toast (éxito verde, error rojo)

### Responsive — mobile first

```
móvil:   360px – 767px   (operadores en cocina — prioridad máxima)
tablet:  768px – 1023px  (asesores en visitas)
desktop: 1024px+          (administración en oficina)
```

El 80% de los usuarios del local usarán el sistema desde celular.
Toda funcionalidad core debe ser 100% operable desde 360px de ancho.
En móvil: sidebar → bottom nav, grid 4 cols → 2 cols, tablas → cards.

### Librería de íconos

Usar exclusivamente **Tabler Icons** (ya integrado en shadcn/ui):
```
Sello/Medal:      ti-medal
Temperatura:      ti-thermometer
Limpieza:         ti-spray
Plagas/Fumig.:    ti-bug
Documentos:       ti-file-description
Capacitaciones:   ti-school
Visitas:          ti-map-pin
Comunicaciones:   ti-message-2
Alertas:          ti-alert-triangle
Éxito/Check:      ti-circle-check
Dashboard:        ti-dashboard
Configuración:    ti-settings
```

---

## 🛠 Stack tecnológico (versiones estables, junio 2026)

### Monolito full-stack — una sola app, un solo deploy

```
Framework:      Next.js 15.3.3 (App Router + Turbopack)
Runtime:        Node.js 22 LTS
Lenguaje:       TypeScript 5.8.3 (strict: true — obligatorio)
UI:             React 19.1.0
Estilos:        Tailwind CSS v4 (sin postcss.config manual)
Componentes:    shadcn/ui (basado en Radix UI v2)
Gráficos:       Recharts 2.15.3
Formularios:    React Hook Form 7.56.4 + Zod resolver
API interna:    tRPC 11.1.0 (llamado directo desde Server Components, sin HTTP)
Validación:     Zod 3.24.2
ORM:            Prisma 6.9.0
Base de datos:  PostgreSQL 15 vía Supabase (región sa-east-1 — São Paulo)
Auth:           Supabase Auth (JWT con claims: rol + tenants + tenant_activo)
Storage:        Cloudflare R2 (S3-compatible, sin egress fees)
Deploy:         Vercel (monolito — frontend + API Route Handlers)
Email:          Resend SDK 4.x + React Email 3.x
Pagos:          Flow.cl (webhooks → Route Handlers)
PDF:            Browserless.io + React templates (Supabase Edge Function)
Tests:          Vitest 2.x (unitarios) + Playwright 1.x (E2E)
```

**No usar:** Railway, BullMQ, Redis, Turborepo, Fastify — fueron descartados.
Con 200 tenants máximos los Route Handlers de Next.js reemplazan todo eso.

---

## 👥 Roles de usuario (RBAC — 4 roles)

### Tabla de roles y permisos

| Rol | Claim JWT | Acceso BD | Descripción |
|-----|-----------|-----------|-------------|
| `trabajador_local` | `tenants: ['uuid']` | RLS por tenant activo | Personal del local — registra temperaturas, limpieza, asiste capacitaciones. Vista limitada solo a sus tareas diarias. No ve documentos ni sellos. |
| `admin_local` | `tenants: ['uuid-1', 'uuid-2', ...]` | RLS por tenant activo seleccionado | Dueño o encargado — gestión completa de su(s) local(es). Si tiene múltiples locales, puede cambiar el tenant activo desde un selector en el dashboard. |
| `asesor` | `locales_asignados: ['uuid', ...]` | RLS multi-tenant | Profesional Núcleo Sur — registra visitas, emite sellos, asigna tareas, capacita. Ve solo sus locales asignados. |
| `admin_nucleo` | sin restricción tenant | Sin RLS de tenant | Staff Núcleo Sur — acceso global. Configura pesos del sello, gestiona cuentas, genera reportes consolidados. |

### Modelo multi-local (admin_local con varios locales)

Un cliente puede tener múltiples locales (ej: dueño de 3 restaurantes en Osorno).
El JWT lleva `tenants: ['uuid-1', 'uuid-2', 'uuid-3']` y `tenant_activo: 'uuid-1'`.

El usuario puede cambiar de local activo desde un **selector en el TopBar**.
Al cambiar, el sistema actualiza `tenant_activo` en la sesión y recarga el dashboard
con los datos del local seleccionado. La cookie de sesión guarda el último local activo.

**Vista consolidada para multi-local:**
La ruta `(dashboard)/mis-locales/page.tsx` muestra un overview de todos los locales
del usuario: sello actual de cada uno, alertas pendientes y acceso rápido.
Solo visible si `tenants.length > 1`.

### Permisos por módulo

| Módulo | trabajador_local | admin_local | asesor | admin_nucleo |
|--------|:---:|:---:|:---:|:---:|
| Registros (crear) | ✅ | ✅ | — | — |
| Registros (ver todos) | solo propios | ✅ | ✅ | ✅ |
| Documentos | — | ✅ | ✅ | ✅ |
| Sello (ver) | — | ✅ | ✅ | ✅ |
| Sello (emitir) | — | — | ✅ | ✅ |
| Visitas (ver) | — | ✅ | ✅ | ✅ |
| Visitas (registrar) | — | — | ✅ | ✅ |
| Capacitaciones | ✅ (asistir) | ✅ | ✅ | ✅ |
| Comunicaciones | — | ✅ | ✅ | ✅ |
| Mi cuenta (ARSOPB) | ✅ | ✅ | ✅ | ✅ |
| Config. sellos | — | — | — | ✅ |
| Panel ARSOPB global | — | — | — | ✅ |
| Todos los locales | — | solo propios | asignados | ✅ |

---

## 🏗 Arquitectura y patrones fundamentales

### Multitenancy con Row-Level Security (RLS)

**El patrón más crítico. Nunca omitirlo en ningún query.**

```sql
-- Política RLS estándar en CADA tabla:
CREATE POLICY tenant_isolation ON registros
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Para admin_nucleo se bypasea con service role de Supabase
-- Para asesor se setea el tenant del local que está visitando
```

El middleware Edge de Vercel extrae `tenant_activo` del JWT → lo inyecta en
header → el contexto tRPC ejecuta `SET app.current_tenant = 'uuid'` en la
sesión PostgreSQL antes de cualquier query.

**Regla absoluta:** si un test puede ver datos de otro tenant, es un bug
crítico de seguridad que bloquea el merge del PR.

### Conexión a Supabase desde Vercel (serverless)

```bash
# Siempre puerto 6543 (pgbouncer), nunca 5432
DATABASE_URL="postgresql://...@db.xxx.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@db.xxx.supabase.co:5432/postgres"
```

Vercel abre una conexión nueva por invocación de función serverless.
Sin pgbouncer se agotan las 60 conexiones del plan gratuito de Supabase.

### tRPC — patrones de llamada

```typescript
// Server Component — directo, sin HTTP, sin latencia de red:
import { createCaller } from '@/server/trpc/router'
const caller = createCaller({ tenantActivo, user, rol })
const sello = await caller.sellos.getActual()

// Client Component — React Query v5:
const { data } = trpc.sellos.getActual.useQuery()
const mutation = trpc.registros.crear.useMutation()
```

### Motor de sellos — función pura (núcleo del negocio)

```typescript
// src/server/sello-engine/calcular.ts
// NUNCA agregar BD, HTTP ni side effects aquí
export function calcularSello(input: SelloInput): SelloResult {
  // input viene de la BD, leído FUERA de esta función
  // Los pesos vienen de configuracion_sellos
  // Retorna: nivel, score, desglose, plan de mejoras
}

// Tipos en src/server/sello-engine/tipos.ts
interface SelloInput {
  registros_completados: number
  registros_requeridos: number
  documentos_vigentes: number
  documentos_totales: number
  capacitaciones_mes: number
  tareas_cerradas: number
  tareas_totales: number
  pesos: ConfiguracionPesos
}

interface SelloResult {
  nivel: 'inicial' | 'intermedio' | 'avanzado' | 'premium'
  score_general: number
  score_documentacion: number
  score_condiciones: number
  score_capacitaciones: number
  score_tareas: number
  plan_mejoras: string[]
  descargos_habilitados: boolean
}
```

Cobertura de tests requerida: **≥ 90%**. Es el módulo más crítico.

---

## 📁 Estructura de carpetas

```
nucleo-sur/
├── .cursor/
│   └── rules/
│       └── project.mdc              ← este archivo
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── supabase/
│   ├── config.toml                  ← crons: cálculo sellos día 1 del mes
│   └── functions/
│       ├── calcular-sellos/         ← Edge Function mensual automática
│       ├── generar-pdf/             ← genera informe mensual
│       └── suprimir-datos/          ← Ley 21.719: supresión post-baja
├── src/
│   ├── middleware.ts                ← Edge: auth JWT + tenant_activo
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           ← sidebar/bottom-nav + topbar + selector local
│   │   │   ├── page.tsx             ← dashboard principal
│   │   │   ├── mis-locales/         ← vista multi-local (si tenants.length > 1)
│   │   │   ├── registros/
│   │   │   ├── documentos/
│   │   │   ├── sellos/
│   │   │   ├── visitas/
│   │   │   ├── capacitaciones/
│   │   │   ├── comunicaciones/
│   │   │   └── mi-cuenta/           ← ARSOPB Ley 21.719
│   │   ├── (admin)/                 ← solo admin_nucleo
│   │   │   ├── layout.tsx
│   │   │   ├── locales/
│   │   │   ├── asesores/
│   │   │   ├── configuracion/       ← pesos del sello
│   │   │   └── arsopb/              ← panel gestión ARSOPB
│   │   ├── api/
│   │   │   ├── trpc/[trpc]/route.ts
│   │   │   └── webhooks/
│   │   │       ├── flow/route.ts
│   │   │       └── supabase/route.ts
│   │   └── politica-de-privacidad/page.tsx  ← pública, sin auth
│   ├── server/
│   │   ├── trpc/
│   │   │   ├── router.ts
│   │   │   ├── context.ts           ← tenants[], tenant_activo, user, rol
│   │   │   └── routers/
│   │   │       ├── sellos.ts
│   │   │       ├── registros.ts
│   │   │       ├── documentos.ts
│   │   │       ├── visitas.ts
│   │   │       ├── capacitaciones.ts
│   │   │       ├── comunicaciones.ts
│   │   │       ├── arsopb.ts
│   │   │       └── locales.ts       ← gestión multi-local
│   │   ├── sello-engine/
│   │   │   ├── calcular.ts          ← función pura, tests ≥90%
│   │   │   └── tipos.ts
│   │   ├── middleware/
│   │   │   ├── tenant.ts
│   │   │   └── rbac.ts              ← guard por rol y por tenant asignado
│   │   └── db/
│   │       ├── prisma.ts            ← singleton con pgbouncer
│   │       └── rls.ts
│   ├── components/
│   │   ├── ui/                      ← shadcn/ui (no editar)
│   │   ├── dashboard/
│   │   │   ├── SelloWidget.tsx      ← tarjeta principal con nivel y color
│   │   │   ├── KpiCard.tsx
│   │   │   ├── EvolucionChart.tsx   ← Recharts line chart 6 meses
│   │   │   ├── AlertasPanel.tsx
│   │   │   └── MultiLocalOverview.tsx ← solo si tenants.length > 1
│   │   ├── registros/
│   │   │   ├── FormTemperatura.tsx  ← optimizado para móvil
│   │   │   ├── FormLimpieza.tsx
│   │   │   └── RegistroCard.tsx
│   │   ├── sellos/
│   │   │   └── SelloBadge.tsx       ← badge reutilizable con color por nivel
│   │   └── layout/
│   │       ├── Sidebar.tsx          ← desktop: navy dark
│   │       ├── BottomNav.tsx        ← móvil: 5 ítems principales
│   │       ├── TopBar.tsx           ← saludo + selector de local
│   │       └── LocalSelector.tsx    ← dropdown para multi-local
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts
│       │   └── server.ts
│       ├── email/resend.ts
│       ├── storage/r2.ts
│       ├── payments/flow.ts
│       ├── pdf/generator.ts
│       └── schemas/
│           ├── registro.ts
│           ├── sello.ts
│           └── user.ts
```

---

## 🗄 Modelo de datos (Prisma schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // puerto 6543 pgbouncer
  directUrl = env("DIRECT_URL")      // puerto 5432 solo migraciones
}

// ── Core ─────────────────────────────────────────────────────────────

model Tenant {
  id          String   @id @default(uuid())
  nombre      String
  rut         String   @unique
  direccion   String
  ciudad      String   @default("Osorno")
  plan        String   // 'calidad' | 'integral'
  estado      String   @default("activo") // 'activo' | 'suspendido' | 'baja'
  created_at  DateTime @default(now())

  user_tenants  UserTenant[]
  registros     Registro[]
  sellos        Sello[]
  documentos    Documento[]
  visitas       Visita[]
  mensajes      Mensaje[]
}

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  nombre     String
  rol        String   // 'trabajador_local' | 'admin_local' | 'asesor' | 'admin_nucleo'
  activo     Boolean  @default(true)
  created_at DateTime @default(now())

  user_tenants UserTenant[]
}

// Relación many-to-many User ↔ Tenant (soporta multi-local)
model UserTenant {
  id        String @id @default(uuid())
  user_id   String
  tenant_id String
  // para trabajador_local y admin_local dentro de un tenant
  // para asesor: se usa tabla AsignacionAsesor separada

  user   User   @relation(fields: [user_id], references: [id])
  tenant Tenant @relation(fields: [tenant_id], references: [id])

  @@unique([user_id, tenant_id])
}

// Asignación de asesores a locales (N:M)
model AsignacionAsesor {
  id        String @id @default(uuid())
  asesor_id String // user.id con rol='asesor'
  tenant_id String
  activo    Boolean  @default(true)
  desde     DateTime @default(now())

  @@unique([asesor_id, tenant_id])
}

// ── Sellos ───────────────────────────────────────────────────────────

model Sello {
  id                   String   @id @default(uuid())
  tenant_id            String
  periodo              String   // 'YYYY-MM'
  nivel                String   // 'inicial' | 'intermedio' | 'avanzado' | 'premium'
  score_general        Float
  score_documentacion  Float
  score_condiciones    Float
  score_capacitaciones Float
  score_tareas         Float
  pesos_usados         Json     // snapshot de ConfiguracionSellos al momento
  inputs_snapshot      Json     // datos de entrada para auditoría
  emitido_por          String   // user_id del asesor
  emitido_at           DateTime @default(now())

  revisiones RevisionSello[]
  tenant     Tenant @relation(fields: [tenant_id], references: [id])

  @@unique([tenant_id, periodo])
}

model RevisionSello {
  id             String   @id @default(uuid())
  sello_id       String
  solicitado_por String   // user_id del admin_local
  motivo         String
  respuesta      String?
  estado         String   @default("pendiente") // 'pendiente' | 'resuelta'
  created_at     DateTime @default(now())

  sello Sello @relation(fields: [sello_id], references: [id])
}

model ConfiguracionSellos {
  id                   String   @id @default(uuid())
  peso_documentacion   Float    @default(0.30)
  peso_condiciones     Float    @default(0.25)
  peso_capacitaciones  Float    @default(0.25)
  peso_tareas          Float    @default(0.20)
  umbral_intermedio    Float    @default(60)
  umbral_avanzado      Float    @default(75)
  umbral_premium       Float    @default(90)
  updated_by           String
  updated_at           DateTime @updatedAt
}

// ── Registros BPM ────────────────────────────────────────────────────

model Registro {
  id          String   @id @default(uuid())
  tenant_id   String
  tipo        String   // 'temperatura' | 'limpieza' | 'plagas' | 'capacitacion'
  fecha       DateTime
  datos       Json
  estado      String   @default("completo")
  adjunto_url String?
  created_by  String   // user_id — puede ser trabajador_local o admin_local
  created_at  DateTime @default(now())

  tenant Tenant @relation(fields: [tenant_id], references: [id])
}

model Documento {
  id          String    @id @default(uuid())
  tenant_id   String
  nombre      String
  categoria   String
  mes         String    // 'YYYY-MM'
  url         String    // Cloudflare R2
  vencimiento DateTime?
  estado      String    @default("pendiente")
  observacion String?
  version     Int       @default(1)
  created_by  String
  created_at  DateTime  @default(now())

  tenant Tenant @relation(fields: [tenant_id], references: [id])
}

model Visita {
  id               String   @id @default(uuid())
  tenant_id        String
  asesor_id        String
  tipo             String   // 'programada' | 'sorpresa'
  fecha            DateTime
  hallazgos        String?
  no_conformidades NoConformidad[]
  created_at       DateTime @default(now())

  tenant Tenant @relation(fields: [tenant_id], references: [id])
}

model NoConformidad {
  id           String    @id @default(uuid())
  visita_id    String
  descripcion  String
  severidad    String    // 'menor' | 'mayor'
  estado       String    @default("abierta")
  fecha_limite DateTime?

  visita Visita @relation(fields: [visita_id], references: [id])
}

model Mensaje {
  id          String   @id @default(uuid())
  tenant_id   String
  de          String   // user_id
  para        String   // user_id
  contenido   String
  adjunto_url String?
  leido       Boolean  @default(false)
  created_at  DateTime @default(now())

  tenant Tenant @relation(fields: [tenant_id], references: [id])
}

// ── Compliance Ley 21.719 ────────────────────────────────────────────

model Consentimiento {
  id                String   @id @default(uuid())
  tenant_id         String
  titular_id        String   // user_id
  tipo              String   // 'otorgamiento' | 'revocacion' | 'actualizacion'
  documento_version String
  timestamp_evento  DateTime
  ip_origen         String
  canal             String   // 'web' | 'mobile_pwa'
  created_at        DateTime @default(now())
}

model SolicitudArsopb {
  id             String    @id @default(uuid())
  tenant_id      String
  titular_id     String
  tipo_derecho   String    // 'acceso' | 'rectificacion' | 'supresion' | 'oposicion' | 'portabilidad' | 'bloqueo'
  descripcion    String?
  estado         String    @default("pendiente")
  fecha_ingreso  DateTime
  fecha_limite   DateTime  // ingreso + 30 días corridos
  respondida_por String?
  fecha_respuesta DateTime?
  resolucion     String?
  created_at     DateTime  @default(now())
}

model DataProcessor {
  id                String   @id @default(uuid())
  nombre            String
  pais              String
  tipo_datos        String[]
  finalidad         String
  base_contractual  String
  dpa_firmado_fecha DateTime
  dpa_url           String?
  activo            Boolean  @default(true)
  updated_at        DateTime @updatedAt
}

model IncidenteSeguridad {
  id                    String    @id @default(uuid())
  descripcion           String
  datos_afectados       String[]
  titulares_afectados   Int?
  fecha_deteccion       DateTime
  notificacion_agencia  DateTime?
  medidas_adoptadas     String
  estado                String
  created_at            DateTime  @default(now())
}
```

---

## 🧠 Instrucciones de comportamiento para Cursor

### Al generar cualquier código

1. **TypeScript strict siempre.** Sin `any`, sin `as unknown as X`.
   Si no conoces el tipo exacto, definirlo con `interface` o `type`.

2. **RLS en toda query.** Si un router tRPC hace un query sin que
   `tenant_activo` esté en contexto, marcarlo como error crítico.

3. **Zod en todo input externo.** Formularios, Route Handlers, webhooks —
   todo lo que llega del exterior pasa por `.safeParse()` antes de usarse.

4. **Server Components por defecto.** Usar `'use client'` solo cuando sea
   estrictamente necesario: estado interactivo, event handlers, browser APIs.

5. **sello-engine es una función pura.** Nunca agregar BD, HTTP ni side
   effects en `calcular.ts`. Los side effects van en el router tRPC.

6. **Prisma solo por el singleton.** Nunca crear `new PrismaClient()` fuera
   de `src/server/db/prisma.ts`. El singleton ya configura pgbouncer.

7. **Variables de entorno validadas.** Usar módulo central con Zod. Nunca
   `process.env.X` directamente en componentes o routers.

8. **Errores al usuario en español chileno.** Mensajes técnicos en inglés.

9. **Fechas siempre en America/Santiago.** Formato display: DD/MM/AAAA.
   Montos en CLP con punto de miles: $80.000

10. **Multi-local consciente.** Al escribir código que accede a datos de un
    tenant, siempre usar `tenant_activo` del contexto tRPC, nunca asumir
    que el usuario tiene un solo tenant.

11. **RBAC explícito.** Cada procedimiento tRPC debe tener un guard de rol.
    `trabajador_local` no puede ver sellos ni documentos. `admin_local` no
    puede emitir sellos. Verificar con `ctx.rol` antes de ejecutar la lógica.

12. **Compliance Ley 21.719.** Si el código toca datos personales (nombre,
    RUT, email, IP, asistencias con nombres), agregar comentario con el
    artículo de la ley que justifica el tratamiento:
    `// Ley 21.719 Art.13(c) — necesario para ejecución del contrato`

### Al generar componentes UI

- Usar siempre shadcn/ui antes de crear un componente custom.
- Paleta de colores: navy dark `#0B2545`, verde `#4B8B2E` — nunca azul genérico.
- Mobile-first: todos los componentes del dashboard deben funcionar en 360px.
- Formularios: inputs grandes (min-h-12) para uso con dedos en cocina.
- Íconos: solo Tabler Icons. Nunca Heroicons ni Lucide fuera de shadcn.
- Sellos: siempre usar `<SelloBadge nivel={sello.nivel} />` — nunca colores hardcodeados.
- Toasts: éxito con `✅ Registro guardado`, error con `❌ Error al guardar — intenta de nuevo`.

### Al generar tests

```typescript
// Patrón requerido para sello-engine:
describe('calcularSello', () => {
  it('retorna Inicial cuando score < 60%', () => { ... })
  it('retorna Intermedio cuando score 60–74%', () => { ... })
  it('retorna Avanzado cuando score 75–89%', () => { ... })
  it('retorna Premium cuando score ≥ 90%', () => { ... })
  it('habilita descargos solo en nivel Premium', () => { ... })
  it('aplica pesos personalizados de configuracion_sellos', () => { ... })
  it('genera plan de mejoras con las brechas detectadas', () => { ... })
})

// Test obligatorio en CADA router tRPC nuevo:
it('rechaza acceso cross-tenant', async () => {
  // Usuario del tenant A no debe ver datos del tenant B
  // Si este test falla → bloquea el merge del PR
})

// Test de permisos por rol en cada router:
it('trabajador_local no puede ver sellos', async () => { ... })
it('admin_local no puede emitir sellos', async () => { ... })
```

---

## 💰 Variables de entorno

```bash
# .env.local

# Supabase — región sa-east-1 (São Paulo)
DATABASE_URL="postgresql://postgres:[pw]@db.[ref].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Cloudflare R2
R2_ACCOUNT_ID="d9453f824d81f76d39d511655e9cf532"
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="nucleo-sur-docs"
R2_PUBLIC_URL="https://d9453f824d81f76d39d511655e9cf532.r2.cloudflarestorage.com"

# Resend
RESEND_API_KEY="re_..."

# Flow.cl
FLOW_API_KEY=""
FLOW_SECRET=""
FLOW_WEBHOOK_SECRET=""

# Browserless
BROWSERLESS_TOKEN=""

# App
NEXT_PUBLIC_APP_URL="https://app.nucleosur.cl"
NEXTAUTH_SECRET=""
```

---

## 🚀 Comandos del proyecto

```bash
pnpm dev               # Next.js con Turbopack
pnpm build             # Build producción
pnpm lint              # ESLint + TypeScript check

pnpm prisma:migrate    # Migraciones (usa DIRECT_URL)
pnpm prisma:generate   # Genera Prisma Client
pnpm prisma:studio     # UI visual BD
pnpm prisma:seed       # Datos de prueba

pnpm test              # Vitest unitarios
pnpm test:coverage     # Coverage — sello-engine ≥90%
pnpm test:e2e          # Playwright E2E
pnpm test:e2e:ui       # Playwright con interfaz visual

pnpm supabase:start    # Supabase local (Docker)
pnpm supabase:deploy   # Deploy Edge Functions
```

---

## 📏 Reglas de calidad no negociables

| Regla | Umbral |
|-------|--------|
| TypeScript strict | Sin errores, sin `any` |
| Cobertura sello-engine | ≥ 90% |
| Cobertura backend general | ≥ 70% |
| Test cross-tenant | En cada router tRPC nuevo |
| Test de permisos por rol | En cada router tRPC nuevo |
| Latencia API P95 | ≤ 300ms |
| First Contentful Paint | ≤ 2s en 4G |
| Mobile mínimo | 360px sin scroll horizontal |

---

## 📅 Hitos del roadmap

| Semana | Hito |
|--------|------|
| 2 | Auth 4 roles + RLS + multi-local + sello-engine ≥90% |
| 8 | Primer local operativo en staging |
| 12 | Ciclo mensual completo: registro → sello → PDF → email |
| 16 | MVP en producción con locales piloto + pagos Flow.cl |
| 20 | Plan Integral + WhatsApp Business API |
| **01-DIC-2026** | **⚠️ Ley 21.719 en vigor — RF-55 a RF-72 deben estar activos** |

---

## 🔗 Referencias

- Ley N° 21.719 → https://bcn.cl/gJo3hf
- Supabase RLS → https://supabase.com/docs/guides/auth/row-level-security
- tRPC v11 + Next.js App Router → https://trpc.io/docs/client/nextjs/app-dir
- Prisma + Supabase pgbouncer → https://www.prisma.io/docs/guides/database/supabase
- shadcn/ui → https://ui.shadcn.com
- Tabler Icons → https://tabler.io/icons

---

*Núcleo Sur v2.0 — junio 2026*