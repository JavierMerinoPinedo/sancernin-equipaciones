# Equipaciones San Cernin

App web (pensada para móvil) con el calendario de partidos del **Club Deportivo San Cernin** en la FNB y la equipación que toca en cada partido.

- **Regla:** en casa, azul/azul. Fuera, blanco/azul si el local viste camiseta azul (marino, azul o celeste); si no, azul/azul.
- **Datos:** se cargan una vez al día desde la API pública que usa la web de la FNB (partidos + colores de cada equipo) y se guardan en Supabase.
- **Vistas:** semana (con filtros por equipo, solo fuera, solo blanco), mes, avisos y ajustes.
- **Avisos:** próximos partidos de blanco, rivales sin color, horas sin fijar y cambios detectados, con contador en la pestaña.
- **Colores de rival:** si la FNB no tiene el color o está mal, cualquier usuario puede corregirlo; vale para todo el club.
- **Avisos de cambios:** cada carga compara con la anterior (hora, pabellón, rival, color, local/visitante, partidos nuevos o eliminados).
- **Calendario .ics:** cada usuario tiene un enlace personal para suscribirse (todo el club o un equipo) en Google Calendar o iPhone.
- **WhatsApp:** resumen de la semana listo para enviar.

Tecnología: Next.js 15 (App Router) · Supabase (Postgres + Auth) · Vercel (hosting + Cron).

---

## Puesta en marcha (una sola vez, ~15 min)

### 1. Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com) (región Europa, plan gratuito). Las funciones de Vercel deben estar en la región más cercana: se fija con `regions` en [`vercel.json`](vercel.json).
2. **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
3. **Authentication → Sign In / Providers**: deja activado *Email* y **desactiva "Allow new users to sign up"** (así solo entra quien tú des de alta).
4. **Authentication → Users → Add user → Create new user**: crea los usuarios del club con email y contraseña (marca *Auto Confirm User*). Cada uno puede cambiar luego su contraseña en *Ajustes*.
5. **Project Settings → API**: copia la *Project URL*, la clave *anon / public* y la clave *service_role* (esta última es secreta).

### 2. Vercel
1. En [vercel.com](https://vercel.com) → **Add New → Project** → importa este repositorio de GitHub.
2. En **Environment Variables** añade:

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave anon / public |
   | `SUPABASE_SERVICE_ROLE_KEY` | clave service_role |
   | `CRON_SECRET` | una cadena larga aleatoria (p. ej. de un generador de contraseñas) |

3. **Deploy**.
4. Entra en la app con tu usuario, ve a **Ajustes → Actualizar ahora desde la FNB** para hacer la primera carga.

A partir de ahí, Vercel Cron llama a `/api/cron/sync` cada día a las 05:00 UTC (6:00–7:00 en Pamplona). Se cambia en [`vercel.json`](vercel.json). En el plan gratuito de Vercel el cron puede ejecutarse a cualquier minuto de esa hora y como máximo una vez al día.

---

## Desarrollo local

```bash
cp .env.example .env.local   # rellena las claves
npm install
npm run dev                  # http://localhost:3000
npm test                     # pruebas de la lógica (colores, equipación, cambios, .ics)
```

## Estructura

```
app/(app)/page.tsx          Semana
app/(app)/mes/page.tsx      Mes
app/(app)/avisos/page.tsx   Avisos: de blanco, rival sin color, hora sin fijar y cambios
app/(app)/ajustes/page.tsx  Enlaces .ics, carga manual, contraseña
app/api/cron/sync           Carga diaria (protegida con CRON_SECRET)
app/api/ics/[token]         Suscripción de calendario por usuario
lib/fnb.ts                  Cliente de la API de la FNB
lib/diff.ts                 Detección de cambios
lib/kit.ts                  Regla de equipación
lib/alerts.ts               Cálculo de avisos
lib/colors.ts               Interpretación de colores ("#000080", "AZUL", "VERDE/NEGRO"…)
supabase/schema.sql         Tablas y seguridad (RLS)
```

## Notas
- **Caché:** los datos son iguales para todo el club y se guardan en la caché de datos de Next (`lib/data.ts`), leídos con la service role. Se invalidan al terminar cada carga y al corregir un color. Por eso toda página que los use debe llamar antes a `requirePageUser()`.
- La API de la FNB (`esb.optimalwayconsulting.com`) es la misma que usa su web y no está documentada: si un día cambia, la carga fallará y en *Ajustes* se verá el error de la última carga. La dirección se puede cambiar con la variable `FNB_API_BASE` sin tocar código.
- Para otro club basta con cambiar `FNB_CLUB_ID` (el número del enlace `pagina-club/?id=`).
