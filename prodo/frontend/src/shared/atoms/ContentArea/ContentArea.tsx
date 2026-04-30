'use client'
import { Box, type SxProps, type Theme } from '@mui/material'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

interface ContentAreaProps {
  children: React.ReactNode
  sx?: SxProps<Theme>
}

export function ContentArea({ children, sx }: ContentAreaProps) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Reset child scroll positions on route change (Rule 20 — route change handling)
  useEffect(() => {
    if (!ref.current) return
    const scrollables = ref.current.querySelectorAll('[data-scroll-owner="true"]')
    scrollables.forEach((el) => { el.scrollTop = 0 })
  }, [pathname])

  return (
    <Box
      ref={ref}
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          minWidth: 0,
          minHeight: 0,
          height: '100%',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  )
}
