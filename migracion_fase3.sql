-- ================================================================
-- MIGRACION FASE 3: Metadatos y Normalizacion de Videos
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ================================================================

-- 1. Agregar columnas de metadatos a subtitles
ALTER TABLE subtitles
  ADD COLUMN IF NOT EXISTS season INTEGER,
  ADD COLUMN IF NOT EXISTS episode INTEGER,
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS title_clean TEXT,
  ADD COLUMN IF NOT EXISTS resolution TEXT,
  ADD COLUMN IF NOT EXISTS video_codec TEXT,
  ADD COLUMN IF NOT EXISTS audio_codec TEXT,
  ADD COLUMN IF NOT EXISTS container TEXT,
  ADD COLUMN IF NOT EXISTS fps REAL,
  ADD COLUMN IF NOT EXISTS bitrate INTEGER,
  ADD COLUMN IF NOT EXISTS width INTEGER,
  ADD COLUMN IF NOT EXISTS height INTEGER,
  ADD COLUMN IF NOT EXISTS release_group TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS imdb_id TEXT,
  ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
  ADD COLUMN IF NOT EXISTS anidb_id INTEGER,
  ADD COLUMN IF NOT EXISTS parse_confidence REAL,
  ADD COLUMN IF NOT EXISTS normalization_version TEXT;

-- 2. Crear tabla video_fingerprints (deduplicación de metadatos por hash)
CREATE TABLE IF NOT EXISTS video_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_hash TEXT NOT NULL UNIQUE,
    file_size BIGINT,
    duration_sec REAL,
    width INTEGER,
    height INTEGER,
    fps REAL,
    video_codec TEXT,
    audio_codec TEXT,
    container TEXT,
    bitrate INTEGER,
    title_clean TEXT,
    season INTEGER,
    episode INTEGER,
    year INTEGER,
    imdb_id TEXT,
    tmdb_id INTEGER,
    anidb_id INTEGER,
    release_group TEXT,
    resolution TEXT,
    source_type TEXT,
    normalization_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE video_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read video fingerprints"
  ON video_fingerprints FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert video fingerprints"
  ON video_fingerprints FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_subtitles_imdb_id ON subtitles(imdb_id);
CREATE INDEX IF NOT EXISTS idx_subtitles_tmdb_id ON subtitles(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_subtitles_season_episode ON subtitles(season, episode);
CREATE INDEX IF NOT EXISTS idx_subtitles_title_clean ON subtitles(title_clean);
CREATE INDEX IF NOT EXISTS idx_video_fingerprints_hash ON video_fingerprints(file_hash);
