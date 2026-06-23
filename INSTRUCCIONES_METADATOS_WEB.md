# Instrucciones Web — MADRAC-SUBS: Metadatos y Normalización

Este archivo documenta los cambios necesarios en el **web app** (`D:\madrac-subs-web`)
para soportar los nuevos metadatos que el desktop app ahora envía a Supabase.

Los cambios en el desktop app están documentados en `PROMPT_NORMALIZACION.md`.

---

## Contexto

El desktop app ahora envía estos campos adicionales en cada `subtitles` row:

```
season, episode, year, title_clean, resolution, video_codec, audio_codec,
container, fps, bitrate, width, height, release_group, source_type, 
parse_confidence, imdb_id, tmdb_id, anidb_id
```

Y crea la tabla `video_fingerprints` para detección de duplicados.

---

## Cambios necesarios en el web app

### 1. TypeScript types — `components/CommunityLibrary.tsx`

Actualizar la interfaz `DesktopSubtitle` para incluir los nuevos campos:

```typescript
type DesktopSubtitle = {
  id: string
  original_video_name: string
  language: string
  filename: string
  download_count: number
  duration_sec: number | null
  version: number
  avg_confidence: number | null
  user_id: string | null
  created_at: string
  // NUEVOS
  season: number | null
  episode: number | null
  year: number | null
  title_clean: string | null
  resolution: string | null
  video_codec: string | null
  audio_codec: string | null
  container: string | null
  fps: number | null
  bitrate: number | null
  width: number | null
  height: number | null
  release_group: string | null
  source_type: string | null
  parse_confidence: number | null
  imdb_id: string | null
  tmdb_id: number | null
}
```

### 2. SELECT query — `CommunityLibrary.tsx` (línea ~59)

Agregar los nuevos campos a la query de Supabase:

```typescript
supabase
  .from('subtitles')
  .select('id, original_video_name, language, filename, download_count, duration_sec, version, avg_confidence, user_id, created_at, season, episode, year, title_clean, resolution, video_codec, audio_codec, container, fps, bitrate, width, height, release_group, source_type, parse_confidence, imdb_id, tmdb_id', { count: 'exact' })
```

### 3. UI — mostrar metadatos en cada tarjeta

En el `li` de cada subtítulo (línea ~167), agregar:

```tsx
{/* Metadatos del video */}
<div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5 flex-wrap">
  {sub.resolution && <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{sub.resolution}</span>}
  {sub.video_codec && <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{sub.video_codec.toUpperCase()}</span>}
  {sub.source_type && <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{sub.source_type}</span>}
  {sub.season != null && sub.episode != null && (
    <span className="text-zinc-500">S{sub.season}E{sub.episode}</span>
  )}
  {sub.width && sub.height && (
    <span className="text-zinc-500">{sub.width}×{sub.height}</span>
  )}
  {sub.fps && <span className="text-zinc-500">{sub.fps.toFixed(2)} fps</span>}
</div>
```

### 4. Búsqueda — `app/page.tsx` (SearchInput, línea ~62)

La búsqueda interna debe incluir `title_clean` además de `original_video_name`:

```typescript
const query = `%${value}%`
supabase
  .from('subtitles')
  .select('...')
  .or(`original_video_name.ilike.${query},title_clean.ilike.${query}`)
  .eq('status', 'published')
  .order('download_count', { ascending: false })
  .limit(5)
```

### 5. (Opcional) Filtros por temporada/episodio

Agregar pestañas de filtro o un input para filtrar por S/E:

```typescript
// En CommunityLibrary, agregar estado:
const [filterSeason, setFilterSeason] = useState<number | null>(null)
const [filterEpisode, setFilterEpisode] = useState<number | null>(null)

// En la query:
let query = supabase.from('subtitles').select('...').eq('status', 'published')
if (filterSeason !== null) query = query.eq('season', filterSeason)
if (filterEpisode !== null) query = query.eq('episode', filterEpisode)
```
