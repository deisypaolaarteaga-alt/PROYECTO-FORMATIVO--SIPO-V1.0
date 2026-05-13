-- ============================================================
-- SIPO — Catálogo Base de Actividades de Referencia
-- Colombia 2025 — Precios de mercado aproximados
-- ============================================================
-- Tablas de referencia pública (sin user_id — lectura libre).
-- Inserción de datos solo via service_role (scripts/seed-catalogo.ts).
-- ============================================================

-- ─── Tabla: catalogo_capitulos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalogo_capitulos (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo          TEXT        NOT NULL,
  nombre          TEXT        NOT NULL,
  tipo_obra       TEXT        NOT NULL,   -- residencial | comercial | infraestructura | industrial | institucional
  numero          INT         NOT NULL,
  descripcion     TEXT,
  created_at      TIMESTAMP   DEFAULT NOW(),

  UNIQUE (codigo, tipo_obra)
);

CREATE INDEX IF NOT EXISTS idx_catalogo_capitulos_tipo ON catalogo_capitulos(tipo_obra);

ALTER TABLE catalogo_capitulos ENABLE ROW LEVEL SECURITY;

-- Lectura pública, escritura solo server-side (service_role omite RLS)
DROP POLICY IF EXISTS "catalogo_capitulos_select_all" ON catalogo_capitulos;
CREATE POLICY "catalogo_capitulos_select_all" ON catalogo_capitulos
  FOR SELECT USING (true);

-- ─── Tabla: catalogo_actividades ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalogo_actividades (
  id                          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  catalogo_capitulo_id        UUID        NOT NULL REFERENCES catalogo_capitulos(id) ON DELETE CASCADE,
  tipo_obra                   TEXT        NOT NULL,
  codigo                      TEXT        NOT NULL,
  nombre                      TEXT        NOT NULL,
  unidad                      TEXT        NOT NULL,
  precio_referencia_nacional  NUMERIC(14,2) NOT NULL,
  rango_min                   NUMERIC(14,2) NOT NULL,
  rango_max                   NUMERIC(14,2) NOT NULL,
  descripcion                 TEXT,
  created_at                  TIMESTAMP   DEFAULT NOW(),

  UNIQUE (codigo, tipo_obra),
  CONSTRAINT chk_rango CHECK (rango_min <= precio_referencia_nacional AND precio_referencia_nacional <= rango_max)
);

CREATE INDEX IF NOT EXISTS idx_catalogo_act_capitulo ON catalogo_actividades(catalogo_capitulo_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_act_tipo     ON catalogo_actividades(tipo_obra);

ALTER TABLE catalogo_actividades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalogo_actividades_select_all" ON catalogo_actividades;
CREATE POLICY "catalogo_actividades_select_all" ON catalogo_actividades
  FOR SELECT USING (true);
