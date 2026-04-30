'use client'

import { neutral } from '@/app/theme'
import {
  Alert,
  Button,
  Snackbar,
  alpha,
  useTheme,
  type AlertColor,
} from '@mui/material'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface UndoAction {
  onUndo: () => void
  undoLabel: string
}

interface ToastState {
  open: boolean
  message: string
  severity: AlertColor
  action: UndoAction | null
  duration?: number
}

export interface ToastContextValue {
  show: (message: string, severity?: AlertColor) => void
  showWithUndo: (message: string, onUndo: () => void, options?: { severity?: AlertColor; undoLabel?: string; duration?: number }) => void
}

const ToastCtx = createContext<ToastContextValue>({ show: () => {}, showWithUndo: () => {} })

// Internal component that uses theme
function ToastContent({ state, onClose, onUndo }: { state: ToastState; onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void; onUndo: () => void }) {
  const theme = useTheme()

  const getSeverityStyles = () => {
    const neutralColor = theme.palette.text.secondary
    const neutralBg = theme.palette.mode === 'dark' ? alpha(theme.palette.text.primary, 0.12) : neutral[100]

    return {
      bgcolor: neutralBg,
      color: neutralColor,
      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
      iconColor: neutralColor,
    }
  }

  const styles = getSeverityStyles()

  return (
    <Alert
      onClose={onClose}
      severity={state.severity}
      role="alert"
      aria-live={state.severity === 'error' ? 'assertive' : 'polite'}
      action={
        state.action ? (
          <Button
            color="inherit"
            size="small"
            onClick={onUndo}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              ml: 1,
            }}
          >
            {state.action.undoLabel}
          </Button>
        ) : undefined
      }
      sx={{
        ...styles,
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}`,
        backdropFilter: 'blur(8px)',
        '& .MuiAlert-icon': {
          color: styles.iconColor,
        },
        '& .MuiAlert-action': {
          '& .MuiIconButton-root': {
            color: styles.color,
            '&:hover': {
              bgcolor: alpha(styles.color, 0.1),
            },
          },
        },
      }}
    >
      {state.message}
    </Alert>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({ open: false, message: '', severity: 'info', action: null })

  const show = useCallback((message: string, severity: AlertColor = 'info') => {
    setState({ open: true, message, severity, action: null })
  }, [])

  const showWithUndo = useCallback((message: string, onUndo: () => void, options: { severity?: AlertColor; undoLabel?: string; duration?: number } = {}) => {
    const { severity = 'info', undoLabel = 'Undo', duration = 5000 } = options
    setState({
      open: true,
      message,
      severity,
      action: { onUndo, undoLabel },
      duration,
    })
  }, [])

  const onClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway' && state.action) return
    setState((s) => ({ ...s, open: false, action: null }))
  }

  const handleUndo = useCallback(() => {
    if (state.action?.onUndo) {
      state.action.onUndo()
    }
    setState((s) => ({ ...s, open: false, action: null }))
  }, [state.action])

  const contextValue = useMemo(() => ({ show, showWithUndo }), [show, showWithUndo])

  return (
    <ToastCtx.Provider value={contextValue}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={state.duration || (state.action ? 5000 : 3000)}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbar-root': {
            bottom: 24,
          },
        }}
      >
        <div>
          <ToastContent state={state} onClose={onClose} onUndo={handleUndo} />
        </div>
      </Snackbar>
    </ToastCtx.Provider>
  )
}

export function useToast(): ToastContextValue { return useContext(ToastCtx) }
