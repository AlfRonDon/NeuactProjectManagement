'use client'
import { Box, type SxProps, type Theme } from '@mui/material'
import { useEffect, useRef, useCallback } from 'react'

interface ScrollContainerProps {
  children: React.ReactNode
  sx?: SxProps<Theme>
  horizontal?: boolean // Allow horizontal scroll (for DataTable)
}

export function ScrollContainer({ children, sx, horizontal = false }: ScrollContainerProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Dev mode: warn on nested ScrollContainers (Rule 14)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !ref.current) return
    const parent = ref.current.parentElement?.closest('[data-scroll-owner="true"]')
    if (parent) {
      console.warn(
        '[ScrollContainer] Nested scroll detected. A ScrollContainer is inside another ScrollContainer. This violates Rule 14 (single scroll surface per column).',
        { child: ref.current, parent }
      )
    }
  }, [])

  // Auto-scroll focused elements into view (Rule 17)
  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement
    if (target && ref.current?.contains(target)) {
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [])

  return (
    <Box
      ref={ref}
      data-scroll-owner="true"
      onFocusCapture={handleFocusCapture}
      className="scroll-container"
      sx={[
        {
          overflowY: 'auto',
          overflowX: horizontal ? 'auto' : 'hidden',
          minHeight: 0,
          flex: 1,
          scrollPadding: '8px',
          scrollBehavior: 'smooth',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  )
}
