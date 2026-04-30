import { neutral } from '@/app/theme'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Box,
  IconButton,
  Tooltip,
  type TooltipProps,
  Typography,
  alpha,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

interface InfoTooltipProps extends Omit<TooltipProps, 'title' | 'children' | 'content'> {
  content: ReactNode
  children?: ReactElement | null
  placement?: TooltipProps['placement']
  maxWidth?: number
  enterDelay?: number
  enterTouchDelay?: number
  leaveTouchDelay?: number
  ariaLabel?: string
  iconColor?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  iconProps?: Record<string, unknown> & { sx?: SxProps<Theme> }
  tooltipSx?: SxProps<Theme>
  disableInteractive?: boolean
}

export const InfoTooltip = ({
  content,
  children = null,
  placement = 'bottom-start',
  maxWidth = 480,
  enterDelay = 200,
  enterTouchDelay = 0,
  leaveTouchDelay = 4000,
  ariaLabel = 'Show additional information',
  iconColor = 'info',
  iconProps = {},
  tooltipSx = [],
  disableInteractive = false,
  ...tooltipProps
}: InfoTooltipProps) => {
  if (content == null) {
    return null
  }

  const resolvedContent =
    typeof content === 'string' ? (
      <Typography variant="body2" component="div">
        {content}
      </Typography>
    ) : (
      content
    )

  const { sx: iconSx, ...iconRest } = iconProps
  const iconSxArray = Array.isArray(iconSx) ? iconSx.filter(Boolean) : iconSx ? [iconSx] : []

  const baseTrigger = isValidElement(children)
    ? cloneElement(children, {
        'aria-label': (children.props as Record<string, unknown>)['aria-label'] ?? ariaLabel,
        tabIndex: (children.props as Record<string, unknown>).tabIndex ?? 0,
      } as Record<string, unknown>)
    : (
      <IconButton
        size="small"
        color={iconColor}
        aria-label={ariaLabel}
        sx={[
          {
            fontSize: 18,
            width: 28,
            height: 28,
            p: 0.25,
            borderRadius: '50%',
          },
          ...iconSxArray,
        ]}
        {...iconRest}
      >
        <InfoOutlinedIcon fontSize="inherit" />
      </IconButton>
    )

  const tooltipStyles = Array.isArray(tooltipSx) ? tooltipSx : [tooltipSx]

  return (
    <Tooltip
      arrow
      placement={placement}
      enterDelay={enterDelay}
      enterTouchDelay={enterTouchDelay}
      leaveTouchDelay={leaveTouchDelay}
      disableInteractive={disableInteractive}
      slotProps={{
        tooltip: {
          sx: [
            (theme: Theme) => ({
              maxWidth,
              typography: 'body2',
              lineHeight: 1.6,
              px: 2,
              py: 1.5,
              color: theme.palette.mode === 'dark' ? neutral[50] : neutral[900],
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(neutral[900], 0.9)
                : alpha(theme.palette.background.paper, 0.98),
              boxShadow: theme.shadows[6],
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.text.secondary, 0.35)}`,
            }),
            ...tooltipStyles,
          ],
        },
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: { offset: [0, 12] },
            },
            {
              name: 'preventOverflow',
              options: { padding: 16 },
            },
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['top-start', 'top', 'right', 'left'],
              },
            },
          ],
        },
      }}
      title={<Box sx={{ maxWidth }}>{resolvedContent}</Box>}
      {...tooltipProps}
    >
      {baseTrigger}
    </Tooltip>
  )
}
