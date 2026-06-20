-- ============================================================
-- MADRAC-SUBS: Seguridad — RLS Policies y Storage
-- Ejecuta esto en el SQL Editor del Supabase Dashboard
-- ============================================================

-- 1. subtitle_downloads: solo usuarios autenticados pueden insertar
DROP POLICY IF EXISTS "Anyone can insert downloads" ON subtitle_downloads;
CREATE POLICY "Authenticated users can insert downloads"
  ON subtitle_downloads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. subtitle_downloads: solo el dueño o admin pueden leer
DROP POLICY IF EXISTS "Anyone can read downloads" ON subtitle_downloads;
CREATE POLICY "Users can read own downloads"
  ON subtitle_downloads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Storage: cambiar bucket subtitle-files a privado
-- (Después de ejecutar esto, los archivos solo serán accesibles via signed URLs)
UPDATE storage.buckets
SET public = false
WHERE id = 'subtitle-files';

-- 4. Storage: permitir a usuarios autenticados leer (via signed URLs o su propia sesión)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Authenticated users can read subtitle files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'subtitle-files');

-- 5. Storage: usuarios autenticados pueden subir
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload subtitle files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'subtitle-files');
