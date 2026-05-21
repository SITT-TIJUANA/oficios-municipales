-- ================================================================
-- SISTEMA DE OFICIOS MUNICIPALES
-- Schema completo de base de datos - Supabase/PostgreSQL
-- Ejecutar en: Supabase > SQL Editor > New Query
-- ================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- para búsqueda full-text

-- ================================================================
-- TABLA: departamentos
-- ================================================================
CREATE TABLE IF NOT EXISTS departamentos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO departamentos (nombre) VALUES
  ('Presidencia Municipal'),
  ('Secretaría Municipal'),
  ('Tesorería / Finanzas'),
  ('Obras Públicas'),
  ('Servicios Públicos'),
  ('Contraloría Interna'),
  ('Administración'),
  ('Dirección Jurídica'),
  ('Desarrollo Social'),
  ('Seguridad Pública')
ON CONFLICT (nombre) DO NOTHING;

-- ================================================================
-- TABLA: perfiles (extiende auth.users de Supabase)
-- ================================================================
CREATE TABLE IF NOT EXISTS perfiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  cargo           TEXT,
  departamento_id UUID REFERENCES departamentos(id),
  rol             TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('administrador', 'usuario', 'solo_lectura')),
  avatar_url      TEXT,
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: plantillas_reporte
-- ================================================================
CREATE TABLE IF NOT EXISTS plantillas_reporte (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  tipo        TEXT NOT NULL CHECK (tipo IN ('pdf', 'docx', 'excel')),
  contenido   TEXT,            -- JSON/HTML template content
  variables   JSONB,           -- variables disponibles: {nombre, tipo, descripcion}
  activo      BOOLEAN DEFAULT TRUE,
  creado_por  UUID REFERENCES perfiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Plantillas por defecto
INSERT INTO plantillas_reporte (nombre, descripcion, tipo, variables) VALUES
  ('Reporte Mensual de Oficios', 'Resumen completo de oficios del período', 'pdf',
   '{"fecha_inicio":"Fecha inicio período","fecha_fin":"Fecha fin período","departamento":"Departamento filtrado"}'::jsonb),
  ('Oficio de Respuesta Formal', 'Plantilla para respuestas institucionales', 'docx',
   '{"numero_oficio":"Número del oficio","tema":"Tema del oficio","responsable":"Nombre del responsable","cargo":"Cargo"}'::jsonb),
  ('Informe Ejecutivo', 'Para presentaciones a presidencia', 'pdf',
   '{"periodo":"Período del reporte","total_oficios":"Total de oficios","pendientes":"Oficios pendientes"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ================================================================
-- TABLA: oficios (tabla principal)
-- ================================================================
CREATE TABLE IF NOT EXISTS oficios (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_oficio       TEXT NOT NULL UNIQUE,
  tema                TEXT NOT NULL,
  descripcion         TEXT,
  
  -- Estado del flujo
  estado              TEXT NOT NULL DEFAULT 'recibido' CHECK (estado IN (
    'recibido',
    'en_proceso',
    'firmado',
    'requiere_respuesta',
    'sin_respuesta',
    'reiterado',
    'respondido',
    'terminado',
    'archivado'
  )),
  
  prioridad           TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('alta', 'media', 'baja')),
  tipo_documento      TEXT DEFAULT 'oficio' CHECK (tipo_documento IN ('oficio', 'memorandum', 'circular', 'acuerdo', 'peticion')),
  requiere_respuesta  BOOLEAN DEFAULT FALSE,
  
  -- Asignación
  asignado_a          UUID REFERENCES perfiles(id),
  departamento_id     UUID REFERENCES departamentos(id),
  oficio_relacionado  UUID REFERENCES oficios(id),
  
  -- Fechas clave
  fecha_recepcion     DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_despacho      DATE,
  fecha_respuesta     DATE,
  fecha_terminacion   DATE,
  fecha_limite        DATE,
  
  -- Remitente / destinatario externo
  remitente_nombre    TEXT,
  remitente_cargo     TEXT,
  remitente_institucion TEXT,
  destinatario_nombre TEXT,
  
  -- Metadatos
  observaciones       TEXT,
  palabras_clave      TEXT[],
  
  -- Control
  creado_por          UUID REFERENCES perfiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_oficios_numero ON oficios(numero_oficio);
CREATE INDEX IF NOT EXISTS idx_oficios_estado ON oficios(estado);
CREATE INDEX IF NOT EXISTS idx_oficios_prioridad ON oficios(prioridad);
CREATE INDEX IF NOT EXISTS idx_oficios_asignado ON oficios(asignado_a);
CREATE INDEX IF NOT EXISTS idx_oficios_departamento ON oficios(departamento_id);
CREATE INDEX IF NOT EXISTS idx_oficios_fecha_recepcion ON oficios(fecha_recepcion);
CREATE INDEX IF NOT EXISTS idx_oficios_tema_trgm ON oficios USING gin(tema gin_trgm_ops);

-- ================================================================
-- TABLA: movimientos_oficio (historial/bitácora)
-- ================================================================
CREATE TABLE IF NOT EXISTS movimientos_oficio (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oficio_id       UUID NOT NULL REFERENCES oficios(id) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_nuevo    TEXT NOT NULL,
  comentario      TEXT,
  realizado_por   UUID REFERENCES perfiles(id),
  fecha           TIMESTAMPTZ DEFAULT NOW(),
  metadata        JSONB -- datos adicionales del movimiento
);

CREATE INDEX IF NOT EXISTS idx_movimientos_oficio ON movimientos_oficio(oficio_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_oficio(fecha);

-- ================================================================
-- TABLA: archivos_oficio
-- ================================================================
CREATE TABLE IF NOT EXISTS archivos_oficio (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oficio_id       UUID NOT NULL REFERENCES oficios(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  nombre_storage  TEXT NOT NULL, -- nombre en Supabase Storage
  tipo_mime       TEXT,
  tamano_bytes    BIGINT,
  tipo_archivo    TEXT DEFAULT 'documento' CHECK (tipo_archivo IN ('documento', 'evidencia', 'foto', 'reporte', 'otro')),
  url_publica     TEXT,
  subido_por      UUID REFERENCES perfiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archivos_oficio ON archivos_oficio(oficio_id);

-- ================================================================
-- TABLA: instrucciones
-- ================================================================
CREATE TABLE IF NOT EXISTS instrucciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio           TEXT NOT NULL UNIQUE,
  instruccion     TEXT NOT NULL,
  descripcion     TEXT,
  estado          TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente', 'en_proceso', 'completada', 'cancelada'
  )),
  prioridad       TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('alta', 'media', 'baja')),
  asignado_a      UUID REFERENCES perfiles(id),
  departamento_id UUID REFERENCES departamentos(id),
  fecha_limite    DATE,
  comentarios     TEXT,
  convertido_a_oficio UUID REFERENCES oficios(id),
  creado_por      UUID REFERENCES perfiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instrucciones_estado ON instrucciones(estado);
CREATE INDEX IF NOT EXISTS idx_instrucciones_asignado ON instrucciones(asignado_a);

-- ================================================================
-- TABLA: archivos_instruccion
-- ================================================================
CREATE TABLE IF NOT EXISTS archivos_instruccion (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instruccion_id  UUID NOT NULL REFERENCES instrucciones(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  nombre_storage  TEXT NOT NULL,
  tipo_mime       TEXT,
  tamano_bytes    BIGINT,
  url_publica     TEXT,
  subido_por      UUID REFERENCES perfiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: comentarios_oficio
-- ================================================================
CREATE TABLE IF NOT EXISTS comentarios_oficio (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oficio_id   UUID NOT NULL REFERENCES oficios(id) ON DELETE CASCADE,
  comentario  TEXT NOT NULL,
  es_interno  BOOLEAN DEFAULT TRUE,
  autor_id    UUID REFERENCES perfiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_oficio ON comentarios_oficio(oficio_id);

-- ================================================================
-- TABLA: notificaciones
-- ================================================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  mensaje     TEXT NOT NULL,
  tipo        TEXT DEFAULT 'info' CHECK (tipo IN ('info', 'alerta', 'urgente', 'exito')),
  leida       BOOLEAN DEFAULT FALSE,
  oficio_id   UUID REFERENCES oficios(id),
  instruccion_id UUID REFERENCES instrucciones(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);

-- ================================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ================================================================
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_oficios_updated_at
  BEFORE UPDATE ON oficios
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE OR REPLACE TRIGGER trigger_instrucciones_updated_at
  BEFORE UPDATE ON instrucciones
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE OR REPLACE TRIGGER trigger_perfiles_updated_at
  BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ================================================================
-- FUNCIÓN: crear perfil automáticamente al registrarse
-- ================================================================
CREATE OR REPLACE FUNCTION crear_perfil_nuevo_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfiles (id, nombre_completo, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'usuario')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION crear_perfil_nuevo_usuario();

-- ================================================================
-- FUNCIÓN: registrar movimiento al cambiar estado de oficio
-- ================================================================
CREATE OR REPLACE FUNCTION registrar_movimiento_oficio()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO movimientos_oficio (oficio_id, estado_anterior, estado_nuevo, realizado_por)
    VALUES (NEW.id, OLD.estado, NEW.estado, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_oficio_estado_changed
  AFTER UPDATE ON oficios
  FOR EACH ROW EXECUTE FUNCTION registrar_movimiento_oficio();

-- ================================================================
-- FUNCIÓN: generar número de oficio automático
-- ================================================================
CREATE OR REPLACE FUNCTION generar_numero_oficio(anio INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER)
RETURNS TEXT AS $$
DECLARE
  siguiente INTEGER;
  numero TEXT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_oficio, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO siguiente
  FROM oficios
  WHERE numero_oficio LIKE 'OF-' || anio || '-%';
  
  numero := 'OF-' || anio || '-' || LPAD(siguiente::TEXT, 3, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNCIÓN: generar folio de instrucción automático
-- ================================================================
CREATE OR REPLACE FUNCTION generar_folio_instruccion(anio INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER)
RETURNS TEXT AS $$
DECLARE
  siguiente INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(folio, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO siguiente
  FROM instrucciones
  WHERE folio LIKE 'INS-' || anio || '-%';
  
  RETURN 'INS-' || anio || '-' || LPAD(siguiente::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- VISTA: oficios_con_detalle (para consultas rápidas)
-- ================================================================
CREATE OR REPLACE VIEW oficios_con_detalle AS
SELECT
  o.*,
  p.nombre_completo AS asignado_nombre,
  p.cargo AS asignado_cargo,
  d.nombre AS departamento_nombre,
  DATE_PART('day', NOW() - o.fecha_recepcion::TIMESTAMPTZ) AS dias_transcurridos,
  (SELECT COUNT(*) FROM archivos_oficio WHERE oficio_id = o.id) AS total_archivos,
  (SELECT COUNT(*) FROM comentarios_oficio WHERE oficio_id = o.id) AS total_comentarios,
  (SELECT MAX(fecha) FROM movimientos_oficio WHERE oficio_id = o.id) AS ultimo_movimiento
FROM oficios o
LEFT JOIN perfiles p ON o.asignado_a = p.id
LEFT JOIN departamentos d ON o.departamento_id = d.id;

-- ================================================================
-- VISTA: estadisticas_dashboard
-- ================================================================
CREATE OR REPLACE VIEW estadisticas_dashboard AS
SELECT
  COUNT(*) FILTER (WHERE estado IN ('recibido','en_proceso','firmado','reiterado')) AS pendientes,
  COUNT(*) FILTER (WHERE estado IN ('terminado','respondido')) AS concluidos,
  COUNT(*) FILTER (WHERE estado = 'archivado') AS archivados,
  COUNT(*) FILTER (WHERE prioridad = 'alta' AND estado NOT IN ('terminado','archivado')) AS urgentes,
  COUNT(*) FILTER (WHERE requiere_respuesta = TRUE AND estado = 'sin_respuesta') AS sin_respuesta,
  ROUND(AVG(
    CASE WHEN fecha_terminacion IS NOT NULL
      THEN DATE_PART('day', fecha_terminacion::TIMESTAMPTZ - fecha_recepcion::TIMESTAMPTZ)
    END
  )::NUMERIC, 1) AS promedio_dias_resolucion,
  COUNT(*) AS total
FROM oficios;

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE oficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_oficio ENABLE ROW LEVEL SECURITY;
ALTER TABLE archivos_oficio ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrucciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_oficio ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_reporte ENABLE ROW LEVEL SECURITY;

-- Perfiles: usuario puede ver y editar el propio; admin ve todos
CREATE POLICY "perfiles_select" ON perfiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "perfiles_update_own" ON perfiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR EXISTS(SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador'));

-- Oficios: usuarios autenticados ven todos; solo autenticados insertan/editan
CREATE POLICY "oficios_select" ON oficios FOR SELECT TO authenticated USING (true);
CREATE POLICY "oficios_insert" ON oficios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "oficios_update" ON oficios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "oficios_delete" ON oficios FOR DELETE TO authenticated
  USING (EXISTS(SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador'));

-- Movimientos: solo lectura para autenticados
CREATE POLICY "movimientos_select" ON movimientos_oficio FOR SELECT TO authenticated USING (true);
CREATE POLICY "movimientos_insert" ON movimientos_oficio FOR INSERT TO authenticated WITH CHECK (true);

-- Archivos: autenticados
CREATE POLICY "archivos_select" ON archivos_oficio FOR SELECT TO authenticated USING (true);
CREATE POLICY "archivos_insert" ON archivos_oficio FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "archivos_delete" ON archivos_oficio FOR DELETE TO authenticated
  USING (subido_por = auth.uid() OR EXISTS(SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador'));

-- Instrucciones
CREATE POLICY "instrucciones_select" ON instrucciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "instrucciones_insert" ON instrucciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "instrucciones_update" ON instrucciones FOR UPDATE TO authenticated USING (true);

-- Comentarios
CREATE POLICY "comentarios_select" ON comentarios_oficio FOR SELECT TO authenticated USING (true);
CREATE POLICY "comentarios_insert" ON comentarios_oficio FOR INSERT TO authenticated WITH CHECK (true);

-- Notificaciones: usuario solo ve las propias
CREATE POLICY "notificaciones_own" ON notificaciones FOR ALL TO authenticated
  USING (usuario_id = auth.uid());

-- Plantillas
CREATE POLICY "plantillas_select" ON plantillas_reporte FOR SELECT TO authenticated USING (true);
CREATE POLICY "plantillas_manage" ON plantillas_reporte FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador'));

-- ================================================================
-- STORAGE BUCKET para archivos
-- ================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('oficios-archivos', 'oficios-archivos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'oficios-archivos');
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'oficios-archivos');
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'oficios-archivos' AND owner = auth.uid());

-- ================================================================
-- DATOS DE EJEMPLO (Opcional - comentar en producción)
-- ================================================================
-- Nota: Para insertar datos de prueba, primero crea un usuario en
-- Supabase Auth y usa su UUID en los campos creado_por/asignado_a
