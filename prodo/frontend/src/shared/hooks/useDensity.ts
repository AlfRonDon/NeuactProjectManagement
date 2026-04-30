'use client'
import { useMediaQuery } from '@mui/material'

export type DensityMode = 'comfortable' | 'compact' | 'dense'

export function useDensity(): DensityMode {
  const isCompact = useMediaQuery('(max-width: 1199px)')
  const isDense = useMediaQuery('(max-width: 899px)')

  if (isDense) return 'dense'
  if (isCompact) return 'compact'
  return 'comfortable'
}
