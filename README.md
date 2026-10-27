# 💰 Finanzas — App de finanzas personales con IA

Aplicación web full-stack para registrar y analizar tus finanzas personales, con un **asesor financiero por IA (Claude)** que entiende lenguaje natural y **carga tus movimientos a partir de capturas de pantalla** usando visión por computadora.

**🔗 Demo en vivo:** [finanzas-nine-amber.vercel.app](https://finanzas-nine-amber.vercel.app) · *(requiere credenciales — ver [Demo](#-demo))*

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=white)
![Anthropic](https://img.shields.io/badge/Claude-Vision%20%2B%20Tools-D97757?logo=anthropic&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)

---

## ✨ Características

- **📊 Dashboard** — balance, ingresos/egresos del mes, gasto promedio diario, y gráficos de evolución (6 meses) y distribución por categoría.
- **💸 Movimientos** — tabla con filtros (fecha, tipo, categoría, monto, texto), edición de categoría inline, exportación a CSV y alta manual. Vista adaptada a mobile con tarjetas expandibles.
- **📈 Análisis** — gasto por categoría, comparativa entre meses y evolución de una categoría en el tiempo.
- **🔔 Alertas** — avisos configurables (gasto diario, mensual por categoría, o movimiento individual) que aparecen en el dashboard.
- **🔮 Proyecciones** — estimación de gasto de fin de mes y días hasta agotar el balance, según el ritmo actual.
- **🤖 Asesor IA (Claude)** — chat que conoce tu contexto financiero y, lo más interesante: **le mandás una captura de tu actividad bancaria y la IA extrae y carga los movimientos automáticamente** (visión + *tool use*).
- **🔐 Auth** — login propio con Supabase Auth; todas las rutas protegidas por middleware.
- **📱 Responsive** — pensada mobile-first, con dark mode y estados de carga/error.

---

## 🧩 El desafío técnico más interesante

El objetivo original era leer los movimientos directamente desde la API de Mercado Pago. Al investigarlo, descubrí que **la API pública de MP no expone el historial de una cuenta personal** (solo cobros de vendedor), y que **ningún agregador de open finance cubre Mercado Pago en Argentina**.

En vez de frenar, pivoteé la solución: **el usuario le manda capturas de pantalla al asesor IA, y Claude las lee con visión, extrae cada movimiento (monto, fecha, contraparte, categoría) y los inserta en la base mediante una herramienta (*tool use*)**. Es rápido, funciona con cualquier banco/billetera, y resultó mejor UX que una integración frágil.

> Esta decisión muestra el enfoque del proyecto: investigar la realidad técnica, descartar un camino inviable y resolver el problema real del usuario con la herramienta adecuada.

---

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 14** (App Router, Server Components, Server Actions, Route Handlers) |
| Lenguaje | **TypeScript** |
| Base de datos + Auth | **Supabase** (PostgreSQL con Row Level Security) |
| Estilos | **Tailwind CSS** (dark mode, mobile-first) |
| Gráficos | **Recharts** |
| IA | **Anthropic Claude** — visión (lectura de capturas) + *tool use* (alta de movimientos) |
| Deploy | **Vercel** |

---

## 🎬 Demo

La [app en vivo](https://finanzas-nine-amber.vercel.app) está desplegada en Vercel. Como es una herramienta de uso personal con datos financieros reales detrás del login, **las credenciales de demo están disponibles a pedido** (o puedo mostrarte un recorrido en video / captura).

> ¿Reclutás y querés ver el código funcionando? Escribime y te doy acceso a un entorno de demo con datos de ejemplo.

## 📸 Capturas

<!-- Agregá capturas en docs/screenshots/ y referencialas acá, por ej: -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->

*(Capturas próximamente.)*

---

## 🏗️ Arquitectura y decisiones técnicas

- **Next.js App Router** con separación clara: Server Components para lectura de datos, **Server Actions** para mutaciones (crear/editar/borrar movimientos y alertas) y **Route Handlers** para el chat de IA y la exportación.
- **Seguridad:** la `SUPABASE_SERVICE_ROLE_KEY` se usa únicamente server-side (nunca con prefijo `NEXT_PUBLIC_`); un **middleware** protege todas las rutas verificando la sesión.
- **IA con tool use:** el endpoint `/api/chat` corre un loop de *tool calling* — Claude decide cuándo llamar a la herramienta `agregar_movimientos`, que valida y persiste los datos extraídos de las imágenes.
- **Fechas en zona horaria AR:** manejo cuidadoso de timezones (UTC-3) para que las fechas no se corran de día.
- **Categorización automática** por keywords (sin gastar tokens de IA), editable a mano.
- **UX:** toasts, skeletons de carga, error boundaries y una lista de movimientos que se adapta de tabla (desktop) a tarjetas expandibles (mobile).

---

## 📂 Estructura

```
app/
  (auth)/login/          Login (Supabase Auth)
  (dashboard)/           Rutas protegidas: dashboard, movimientos, análisis, alertas, proyecciones, IA
  api/                   Route handlers (chat IA, export CSV, etc.)
components/              UI: charts, movements, alerts, ai, ui
lib/
  supabase/              Clientes browser/server/admin + middleware de auth
  anthropic.ts           Cliente Claude, system prompt y definición de la tool
  metrics.ts             Cálculos del dashboard y análisis
  projections.ts         Lógica de proyecciones
  alerts.ts              Evaluación de alertas
  categorizer.ts         Categorización automática por keywords
supabase/migrations/     Esquema SQL (movements, alerts)
```

---

## ⚙️ Correr localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local   # completá los valores (Supabase + Anthropic)

# 3. Crear las tablas en Supabase (SQL Editor)
#    Correr supabase/migrations/0001_movements.sql y 0002_alerts.sql

# 4. Levantar el server de desarrollo
npm run dev                  # http://localhost:3000
```

El usuario se crea manualmente en Supabase (Authentication → Users), no hay registro público.

---

## 📄 Licencia

MIT — ver [LICENSE](LICENSE).
