import { InfoTooltip } from '@/shared/molecules/InfoTooltip'
import {
  Box,
  Stack,
  type StackProps,
  Typography,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'

interface SectionHeaderProps extends Omit<StackProps, 'title'> {
  title: ReactNode
  subtitle?: ReactNode
  eyebrow?: ReactNode
  action?: ReactNode
  align?: 'flex-start' | 'center' | 'flex-end'
  sx?: SxProps<Theme>
  helpContent?: ReactNode
  helpPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'
  helpTooltipProps?: Record<string, unknown>
}

export const SectionHeader = ({
  title,
  subtitle = null,
  eyebrow = null,
  action = null,
  align = 'flex-start',
  sx = [],
  helpContent = null,
  helpPlacement = 'top',
  helpTooltipProps = {},
  ...props
}: SectionHeaderProps) => {
  const sxArray = Array.isArray(sx) ? sx : [sx]
  const hasHelp = !!helpContent

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={[
        {
          alignItems: { xs: 'flex-start', sm: align },
          justifyContent: 'space-between',
          minWidth: 0,
          width: '100%',
          gap: 1,
        },
        ...sxArray,
      ]}
      {...props}
    >
      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        {eyebrow && (
          <Typography
            variant="overline"
            sx={{
              color: 'text.secondary',
              letterSpacing: '0.1em',
              fontWeight: (theme: Theme) => theme.typography.fontWeightMedium,
            }}
          >
            {eyebrow}
          </Typography>
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            flexWrap: 'nowrap',
            minWidth: 0,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ wordBreak: 'break-word' }}>
            {title}
          </Typography>
          {hasHelp ? (
            <InfoTooltip
              content={helpContent}
              placement={helpPlacement}
              ariaLabel={`More information about ${title}`}
              {...helpTooltipProps}
            />
          ) : null}
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
      {action ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {action}
        </Box>
      ) : null}
    </Stack>
  )
}
