'use client'

import { useEffect, useState } from 'react'

const GITHUB_REPO = 'madrac-web/Madrac-Subs-Releases'
const FALLBACK_WINDOWS =
  'https://github.com/madrac-web/Madrac-Subs-Releases/releases/download/v2.04Windows/MADRAC-SUBSv2.4.exe'
const FALLBACK_LINUX =
  'https://github.com/madrac-web/Madrac-Subs-Releases/releases/download/v2.04Linux/MADRAC-SUBSv2.04.AppImage'

type ReleaseAsset = {
  name: string
  browser_download_url: string
}

type Release = {
  tag_name: string
  assets: ReleaseAsset[]
}

type ReleaseUrls = {
  windows: string
  linux: string
}

export function useLatestRelease() {
  const [urls, setUrls] = useState<ReleaseUrls>({
    windows: FALLBACK_WINDOWS,
    linux: FALLBACK_LINUX,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchLatest() {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=10`,
          { headers: { Accept: 'application/vnd.github+json' } }
        )
        if (!res.ok) throw new Error('GitHub API error')
        const releases: Release[] = await res.json()

        let windowsUrl = FALLBACK_WINDOWS
        let linuxUrl = FALLBACK_LINUX
        const nameLower = (s: string) => s.toLowerCase()

        for (const release of releases) {
          for (const asset of release.assets) {
            const name = nameLower(asset.name)
            if (windowsUrl === FALLBACK_WINDOWS && name.endsWith('.exe')) {
              windowsUrl = asset.browser_download_url
            }
            if (linuxUrl === FALLBACK_LINUX && (name.endsWith('.appimage') || name.endsWith('.zip'))) {
              linuxUrl = asset.browser_download_url
            }
          }
        }

        if (!cancelled) {
          setUrls({ windows: windowsUrl, linux: linuxUrl })
        }
      } catch {
        if (!cancelled) {
          setUrls({ windows: FALLBACK_WINDOWS, linux: FALLBACK_LINUX })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLatest()
    return () => { cancelled = true }
  }, [])

  return { urls, loading }
}
