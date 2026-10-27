# Finanzas — Mercado Pago + Claude AI

App de finanzas personales (uso propio, un solo usuario) que lee los movimientos
de Mercado Pago y usa Claude para dar consejos financieros.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Supabase · Recharts · Anthropic API

## Setup

1. Instalá dependencias:

   ```bash
   npm install
   ```

2. Copiá el archivo de entorno y completá las variables:

   ```bash
   cp .env.local.example .env.local
   ```

   Para el **paso 1** solo hacen falta las de Supabase:

   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase → Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` → misma pantalla (service_role, **solo server-side**)

3. Creá el usuario manualmente en Supabase (Authentication → Users → Add user).
   No hay registro público.

4. Levantá el server de desarrollo:

   ```bash
   npm run dev
   ```

   Abrí http://localhost:3000 — si no hay sesión, redirige a `/login`.

> Mientras Supabase no esté configurado, la app arranca igual y muestra un
> aviso de setup en vez de romper.

## Estructura

```
app/
  (auth)/login/        Login (Supabase Auth)
  (dashboard)/         Rutas protegidas (dashboard, movements, analysis, alerts, projections, ai)
components/ui/         Sidebar y componentes de UI
lib/
  supabase/            Clientes browser/server + middleware de auth
  formatters.ts        Formato AR de números y fechas
types/                 Tipos compartidos (Movement, etc.)
middleware.ts          Guard de auth en todas las rutas
```

## Orden de implementación

1. ✅ Setup Next.js + Supabase + auth con middleware
2. ⬜ Integración con Mercado Pago
3. ⬜ Dashboard con métricas y gráficos
4. ⬜ Movimientos con filtros
5. ⬜ Categorización automática
6. ⬜ Alertas
7. ⬜ Proyecciones
8. ⬜ Chat IA con contexto financiero
9. ⬜ Polish (responsive, loading, errores)
