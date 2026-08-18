'use client'

import { useEffect, useState } from 'react'

const GITHUB_REPO = 'madrac-web/Madrac-Subs-Releases'
const FALLBACK_WINDOWS =
  'https://github.com/madrac-web/Madrac-Subs-Releases/releases/download/v2.04Windows/MADRAC-SUBSv2.4.exe'
const FALLBACK_LINUX =
  'https://github.com/madrac-web/Madrac-Subs-Releases/releases/download/v2.04Linux/MADRAC-SUBSv2.04.AppImage'
const FALLBACK_DUBBING_WINDOWS =
  'https://github.com/madrac-web/Madrac-Subs-Releases/releases/download/madrac-dubbingV1.0Windows/madrac-dubbing.exe'

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
  dubbing: string
}

function matchUrl(current: string, fallback: string, url: string) {
  return current === fallback ? url : current
}

export function useLatestRelease() {
  const [urls, setUrls] = useState<ReleaseUrls>({
    windows: FALLBACK_WINDOWS,
    linux: FALLBACK_LINUX,
    dubbing: FALLBACK_DUBBING_WINDOWS,
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
        let dubbingUrl = FALLBACK_DUBBING_WINDOWS

        for (const release of releases) {
          for (const asset of release.assets) {
            const name = asset.name.toLowerCase()
            if (name.endsWith('.exe')) {
              if (name.includes('dubbing')) {
                dubbingUrl = matchUrl(dubbingUrl, FALLBACK_DUBBING_WINDOWS, asset.browser_download_url)
              } else {
                windowsUrl = matchUrl(windowsUrl, FALLBACK_WINDOWS, asset.browser_download_url)
              }
            }
            if (name.endsWith('.appimage')) {
              linuxUrl = matchUrl(linuxUrl, FALLBACK_LINUX, asset.browser_download_url)
            }
          }
          if (
            windowsUrl !== FALLBACK_WINDOWS &&
            linuxUrl !== FALLBACK_LINUX &&
            dubbingUrl !== FALLBACK_DUBBING_WINDOWS
          )
            break
        }

        if (!cancelled) {
          setUrls({ windows: windowsUrl, linux: linuxUrl, dubbing: dubbingUrl })
        }
      } catch {
        if (!cancelled) {
          setUrls({ windows: FALLBACK_WINDOWS, linux: FALLBACK_LINUX, dubbing: FALLBACK_DUBBING_WINDOWS })
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
