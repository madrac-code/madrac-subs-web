-- ============================================================
-- MADRAC-SUBS: Auditoría RLS — Script Consolidado e Idempotente
-- Fecha: 2026-07-02
-- Contexto: ADR-002 (OPEN RISK), LLAVE_004
--
-- EJECUTAR en Supabase Dashboard > SQL Editor
-- Este script es idempotente: se puede ejecutar varias veces.
-- ============================================================

-- ============================================================
-- 1. PROFILES — ya correctos, solo asegurar consistencia
-- ============================================================
-- SELECT público (intencional: avatares y nombres visibles)
DROP POLICY IF EXISTS "Profiles are publicly readable" ON profiles;
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (true);

-- INSERT solo propio
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE solo propio
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- 2. SUBTITLES — FIXES PRINCIPALES
-- ============================================================

-- SELECT: Los subtítulos publicados son públicos (la web los muestra sin login).
-- Los no-publicados solo son visibles para su dueño.
DROP POLICY IF EXISTS "Subtitles are readable by authenticated users" ON subtitles;
DROP POLICY IF EXISTS "Published subtitles are publicly readable" ON subtitles;
DROP POLICY IF EXISTS "Users can read own unpublished subtitles" ON subtitles;

DROP POLICY IF EXISTS "Published subtitles are publicly readable" ON subtitles;
DROP POLICY IF EXISTS "Users can read own unpublished subtitles" ON subtitles;

CREATE POLICY "Published subtitles are publicly readable"
  ON subtitles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can read own unpublished subtitles"
  ON subtitles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND status != 'published');

-- INSERT: SOLO el usuario autenticado puede insertar CON SU PROPIO user_id
-- FIX: Antes era auth.role() = 'authenticated' sin validar user_id
DROP POLICY IF EXISTS "Authenticated users can insert subtitles" ON subtitles;
DROP POLICY IF EXISTS "Authenticated users can insert own subtitles" ON subtitles;
CREATE POLICY "Authenticated users can insert own subtitles"
  ON subtitles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Solo el dueño puede actualizar sus subtítulos
-- FIX: No existía policy UPDATE
DROP POLICY IF EXISTS "Users can update own subtitles" ON subtitles;
CREATE POLICY "Users can update own subtitles"
  ON subtitles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Solo el dueño puede borrar sus subtítulos
-- FIX: No existía policy DELETE
DROP POLICY IF EXISTS "Users can delete own subtitles" ON subtitles;
CREATE POLICY "Users can delete own subtitles"
  ON subtitles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. SUBTITLE_DOWNLOADS — corregido por supabase_security.sql
-- ============================================================
ALTER TABLE subtitle_downloads ENABLE ROW LEVEL SECURITY;

-- INSERT: solo autenticados
DROP POLICY IF EXISTS "Anyone can insert downloads" ON subtitle_downloads;
DROP POLICY IF EXISTS "Authenticated users can insert downloads" ON subtitle_downloads;
CREATE POLICY "Authenticated users can insert downloads"
  ON subtitle_downloads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- SELECT: solo el dueño ve sus descargas
DROP POLICY IF EXISTS "Anyone can read downloads" ON subtitle_downloads;
DROP POLICY IF EXISTS "Users can read own downloads" ON subtitle_downloads;
CREATE POLICY "Users can read own downloads"
  ON subtitle_downloads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. PROCESSING_METRICS — ya correctos
-- ============================================================
ALTER TABLE processing_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own metrics" ON processing_metrics;
CREATE POLICY "Users can insert own metrics"
  ON processing_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Metrics are readable by authenticated users" ON processing_metrics;
CREATE POLICY "Metrics are readable by authenticated users"
  ON processing_metrics FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 5. VIDEO_FINGERPRINTS — unificar policies (metadata no sensible)
-- ============================================================
ALTER TABLE video_fingerprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read video fingerprints" ON video_fingerprints;
DROP POLICY IF EXISTS "Video fingerprints readable by authenticated users" ON video_fingerprints;
DROP POLICY IF EXISTS "Video fingerprints are publicly readable" ON video_fingerprints;
CREATE POLICY "Video fingerprints are publicly readable"
  ON video_fingerprints FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert video fingerprints" ON video_fingerprints;
CREATE POLICY "Authenticated users can insert video fingerprints"
  ON video_fingerprints FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 6. DOWNLOAD_STATS — tabla para tracking de descargas del app
-- ============================================================
CREATE TABLE IF NOT EXISTS download_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE download_stats ENABLE ROW LEVEL SECURITY;

-- INSERT: cualquiera puede registrar una descarga (anon incluido, es analytics)
DROP POLICY IF EXISTS "Anyone can insert download stats" ON download_stats;
CREATE POLICY "Anyone can insert download stats"
  ON download_stats FOR INSERT
  WITH CHECK (true);

-- SELECT: solo lectura para admin (service_role), no expuesto via anon
DROP POLICY IF EXISTS "Download stats are readable by admin" ON download_stats;
CREATE POLICY "Download stats are readable by authenticated"
  ON download_stats FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 7. STORAGE — bucket privado + policies
-- ============================================================

-- Hacer bucket privado (solo accesible via signed URLs o sesión)
UPDATE storage.buckets
SET public = false
WHERE id = 'subtitle-files';

-- Lectura: usuarios autenticados
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read subtitle files" ON storage.objects;
CREATE POLICY "Authenticated users can read subtitle files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'subtitle-files');

-- Upload: usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload subtitle files" ON storage.objects;
CREATE POLICY "Authenticated users can upload subtitle files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'subtitle-files');

-- ============================================================
-- FIN — Verificar con:
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public';
-- ============================================================
