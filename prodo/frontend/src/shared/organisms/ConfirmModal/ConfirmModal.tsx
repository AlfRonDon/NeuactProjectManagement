'use client'

import { neutral } from '@/app/theme'
import { bounce, shake } from '@/styles/styles'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

const SuccessIcon = CheckCircleOutlineIcon
const ErrorIcon = ErrorOutlineIcon
const QuestionIcon = HelpOutlineIcon
const InfoIcon = InfoOutlinedIcon
const WarningIcon = WarningAmberIcon
import {
  Box,
  Stack,
  Typography,
  alpha,
  keyframes,
  useTheme,
  type Theme,
} from '@mui/material'
import { useEffect, useRef } from 'react'
import { Modal } from '@/shared/organisms/ModalShell'

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
`

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

type Severity = 'warning' | 'error' | 'info' | 'success' | 'question'

interface SeverityConfig {
  icon: typeof WarningIcon
  color: string
  bgColor: string
}

const getSeverityConfig = (theme: Theme, severity: Severity): SeverityConfig => {
  const neutralColor = theme.palette.text.secondary
  const neutralBg = theme.palette.mode === 'dark' ? alpha(theme.palette.text.primary, 0.08) : neutral[100]
  const configs: Record<Severity, SeverityConfig> = {
    warning: {
      icon: WarningIcon,
      color: neutralColor,
      bgColor: neutralBg,
    },
    error: {
      icon: ErrorIcon,
      color: neutralColor,
      bgColor: neutralBg,
    },
    info: {
      icon: InfoIcon,
      color: neutralColor,
      bgColor: neutralBg,
    },
    success: {
      icon: SuccessIcon,
      color: neutralColor,
      bgColor: neutralBg,
    },
    question: {
      icon: QuestionIcon,
      color: neutralColor,
      bgColor: neutralBg,
    },
  }
  return configs[severity] || configs.warning
}

const PREF_KEY = 'neuact_pm_preferences'

const getDeletePreference = (): { confirmDelete: boolean } => {
  if (typeof window === 'undefined') return { confirmDelete: true }
  try {
    const raw = window.localStorage.getItem(PREF_KEY)
    if (!raw) return { confirmDelete: true }
    const parsed = JSON.parse(raw)
    return { confirmDelete: parsed?.confirmDelete ?? true }
  } catch {
    return { confirmDelete: true }
  }
}

export interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm?: () => void
  title?: string
  message?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  severity?: Severity
  loading?: boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  severity = 'warning',
  loading = false,
}: ConfirmModalProps) {
  const theme = useTheme()
  const config = getSeverityConfig(theme, severity)
  const Icon = config.icon
  const confirmColor = severity === 'error' ? 'error' : 'primary'
  const autoConfirmRef = useRef(false)
  const isDeleteAction = `${title} ${confirmLabel}`.toLowerCase().includes('delete')

  useEffect(() => {
    if (!open) {
      autoConfirmRef.current = false
      return
    }
    if (!isDeleteAction || autoConfirmRef.current) return
    const prefs = getDeletePreference()
    if (prefs.confirmDelete === false) {
      autoConfirmRef.current = true
      onConfirm?.()
      onClose?.()
    }
  }, [open, isDeleteAction, onConfirm, onClose])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="xs"
      onConfirm={onConfirm}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      confirmColor={confirmColor}
      loading={loading}
      dividers={false}
    >
      <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', py: 2 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '20px',
            backgroundColor: config.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            animation: severity === 'error' ? `${shake} 0.5s ease-in-out` : `${bounce} 0.5s ease-in-out`,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: -8,
              borderRadius: '28px',
              background: config.bgColor,
              opacity: 0.3,
              animation: `${pulse} 2s infinite ease-in-out`,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: -1,
              borderRadius: '21px',
              padding: 1,
              background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.2)}, transparent)`,
              WebkitMask: `linear-gradient(${theme.palette.common.white} 0 0) content-box, linear-gradient(${theme.palette.common.white} 0 0)`,
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            },
          }}
        >
          <Icon sx={{ fontSize: 32, color: config.color, position: 'relative', zIndex: 1 }} />
        </Box>
        <Typography
          sx={{
            fontSize: '0.875rem',
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
            maxWidth: 320,
            animation: `${fadeInUp} 0.4s ease-out 0.1s both`,
          }}
        >
          {message}
        </Typography>
      </Stack>
    </Modal>
  )
}
