import Paper from '@mui/material/Paper'
import type { PaperProps } from '@mui/material/Paper'
import type { SxProps, Theme } from '@mui/material/styles'
import { forwardRef } from 'react'

type SurfaceProps = Omit<PaperProps, 'className'>

const baseSx: SxProps<Theme> = {
  p: { xs: 3, md: 3.5 },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: 2, md: 2.5 },
  backgroundColor: 'background.paper',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { children, sx = [], variant = 'outlined', elevation = 0, ...props },
  ref,
) {
  const sxArray = Array.isArray(sx) ? sx : [sx]
  return (
    <Paper
      ref={ref}
      variant={variant}
      elevation={elevation}
      {...props}
      sx={[
        baseSx,
        ...sxArray,
      ]}
    >
      {children}
    </Paper>
  )
})
