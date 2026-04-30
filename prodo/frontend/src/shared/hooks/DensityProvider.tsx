'use client'
import { useEffect } from 'react'
import { useDensity } from './useDensity'

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const density = useDensity()

  useEffect(() => {
    document.body.setAttribute('data-density', density)
    return () => {
      document.body.removeAttribute('data-density')
    }
  }, [density])

  return <>{children}</>
}
