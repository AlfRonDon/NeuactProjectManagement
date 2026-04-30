'use client'

import { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'

// prepend: true ensures MUI styles inject BEFORE Tailwind in <head>,
// giving Tailwind utilities higher specificity when they're used.
// This is critical for Tailwind + MUI coexistence.
export function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => {
    const c = createCache({ key: 'mui', prepend: true })
    c.compat = true
    return c
  })

  useServerInsertedHTML(() => {
    const entries = (cache as any).inserted
    if (!entries || Object.keys(entries).length === 0) return null

    const names = Object.keys(entries)
    const styles = names.map((name) => entries[name]).join('')

    // Flush inserted styles so they're not duplicated
    names.forEach((name) => {
      delete entries[name]
    })

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    )
  })

  return <CacheProvider value={cache}>{children}</CacheProvider>
}
