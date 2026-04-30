'use client'
import { Box, type SxProps, type Theme } from '@mui/material'

interface AppLayoutProps {
  children: React.ReactNode
  sx?: SxProps<Theme>
}

export function AppLayout({ children, sx }: AppLayoutProps) {
  return (
    <Box
      className="app-container"
      sx={[
        {
          height: '100vh',
          // 100dvh applied via CSS class .app-container in globals.css
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  )
}
