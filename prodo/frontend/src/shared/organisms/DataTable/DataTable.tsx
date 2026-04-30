'use client'

import { Box, type SxProps, type Theme } from '@mui/material'
import { ScrollContainer } from '@/shared/atoms/ScrollContainer'

interface DataTableProps {
  columns?: any[]
  data?: any[]
  loading?: boolean
  title?: string
  subtitle?: string
  sx?: SxProps<Theme>
  children?: React.ReactNode
}

export function DataTable({ columns = [], data = [], loading = false, title, subtitle, sx, children }: DataTableProps) {
  return (
    <Box sx={[
      { display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, width: '100%', height: '100%' },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}>
      {/* Toolbar -- fixed height */}
      {(title || subtitle) && (
        <Box sx={{ flexShrink: 0, px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          {title && <Box sx={{ fontWeight: 600, fontSize: '1rem' }}>{title}</Box>}
          {subtitle && <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{subtitle}</Box>}
        </Box>
      )}
      {/* Table body -- scrollable, single scroll surface for both axes */}
      <ScrollContainer horizontal>
        {children || (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            DataTable stub — full implementation pending
          </Box>
        )}
      </ScrollContainer>
      {/* Pagination -- fixed height (placeholder) */}
      <Box sx={{ flexShrink: 0, height: 52, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', px: 2 }}>
        {/* Pagination controls will go here */}
      </Box>
    </Box>
  )
}
