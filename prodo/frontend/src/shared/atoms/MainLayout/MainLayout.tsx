'use client'
import { Box, type SxProps, type Theme } from '@mui/material'

type LayoutVariant =
  | 'default'
  | 'with-panel'
  | 'collapsed'
  | 'collapsed-with-panel'
  | 'no-sidebar'

interface MainLayoutProps {
  children: React.ReactNode
  variant?: LayoutVariant
  sx?: SxProps<Theme>
}

const variantClassMap: Record<LayoutVariant, string> = {
  'default': 'main-layout',
  'with-panel': 'main-layout main-layout--with-panel',
  'collapsed': 'main-layout main-layout--collapsed',
  'collapsed-with-panel': 'main-layout main-layout--collapsed--with-panel',
  'no-sidebar': 'main-layout main-layout--no-sidebar',
}

export function MainLayout({ children, variant = 'default', sx }: MainLayoutProps) {
  return (
    <Box
      className={variantClassMap[variant]}
      sx={[
        {
          flex: 1,
          overflow: 'hidden',
          minWidth: 0,
          minHeight: 0,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  )
}
