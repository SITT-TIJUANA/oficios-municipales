# Sistema de Oficios Municipales

Sistema web administrativo para el control y seguimiento de oficios e instrucciones internas de ayuntamientos.

## Stack tecnológico

- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Hosting:** Vercel (recomendado)
- **Reportes:** jsPDF, docx, xlsx

---

## Instalación paso a paso

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un **nuevo proyecto** (guarda la contraseña de la BD)
3. Espera a que el proyecto inicie (~2 min)

### 2. Configurar la base de datos

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Haz clic en **New query**
3. Copia y pega todo el contenido del archivo `supabase/schema.sql`
4. Haz clic en **Run** (▶)
5. Verifica que no haya errores

### 3. Configurar Storage

El schema ya crea el bucket `oficios-archivos` automáticamente. Verifica en **Storage** que aparezca.

### 4. Obtener credenciales de Supabase

En tu proyecto de Supabase → **Settings → API**:

- Copia el **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copia el **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copia el **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` y llena los valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_AYUNTAMIENTO_NOMBRE=H. Ayuntamiento de Ejemplo
NEXT_PUBLIC_AYUNTAMIENTO_MUNICIPIO=Ejemplo, Estado
```

### 6. Instalar dependencias y ejecutar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 7. Crear el primer usuario administrador

1. En Supabase → **Authentication → Users → Add user**
2. Ingresa email y contraseña del administrador
3. Inicia sesión en el sistema
4. En Supabase → **Table Editor → perfiles** → busca el perfil recién creado
5. Cambia el campo `rol` a `admin`
6. Cambia `activo` a `true`
7. Asigna un `departamento_id` si aplica

---

## Despliegue en Vercel

1. Sube el proyecto a GitHub
2. En [vercel.com](https://vercel.com) → **New Project** → importa el repo
3. En **Environment Variables**, agrega todas las variables de `.env.local`
4. Haz clic en **Deploy**

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/login/          # Página de inicio de sesión
│   ├── (dashboard)/           # Todas las páginas protegidas
│   │   ├── dashboard/         # Estadísticas y resumen
│   │   ├── oficios/           # Lista, detalle y nuevo oficio
│   │   ├── instrucciones/     # Tablero Kanban de instrucciones
│   │   ├── reportes/          # Generación de reportes PDF/Word/Excel
│   │   ├── plantillas/        # Gestión de plantillas
│   │   ├── usuarios/          # Administración de usuarios (solo admin)
│   │   └── flujo/             # Diagrama visual del flujo
│   └── api/                   # Endpoints REST
├── components/                # Componentes React
├── lib/
│   ├── data/                  # Consultas a Supabase
│   ├── supabase/              # Clientes browser/server
│   ├── reportes.ts            # Generadores PDF/Word/Excel
│   └── utils.ts               # Utilidades compartidas
├── types/                     # Tipos TypeScript
└── middleware.ts              # Protección de rutas
```

---

## Flujo de un oficio

```
RECIBIDO → EN PROCESO → FIRMADO → REQUIERE RESPUESTA → RESPONDIDO → TERMINADO → ARCHIVADO
                                 ↘ SIN RESPUESTA → REITERADO ↗
```

---

## Roles de usuario

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total, gestión de usuarios |
| `director` | Ver todos los oficios, avanzar estados |
| `secretaria` | Capturar oficios, subir archivos |
| `usuario` | Ver sus propios oficios asignados |

---

## Soporte

Ante cualquier problema, verifica:
1. Las variables de entorno están correctamente configuradas
2. El schema SQL se ejecutó sin errores
3. El bucket de Storage existe en Supabase
4. El usuario tiene `activo = true` en la tabla `perfiles`
