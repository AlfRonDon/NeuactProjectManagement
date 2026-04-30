import { useCallback, useEffect, useRef } from 'react'

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

interface ParsedShortcut {
  modifiers: {
    meta: boolean
    ctrl: boolean
    alt: boolean
    shift: boolean
  }
  key: string
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  ignoreInputs?: boolean
  preventDefault?: boolean
}

type ShortcutMap = Record<string, (event: KeyboardEvent) => void>

function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut.toLowerCase().split('+')
  const modifiers = {
    meta: false,
    ctrl: false,
    alt: false,
    shift: false,
  }
  let key = ''

  parts.forEach((part) => {
    switch (part) {
      case 'cmd':
      case 'meta':
        modifiers.meta = true
        break
      case 'ctrl':
      case 'control':
        modifiers.ctrl = true
        break
      case 'alt':
      case 'option':
        modifiers.alt = true
        break
      case 'shift':
        modifiers.shift = true
        break
      default:
        key = part
    }
  })

  return { modifiers, key }
}

function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
  const { modifiers, key } = parsed

  if (modifiers.meta && !event.metaKey) return false
  if (modifiers.ctrl && !event.ctrlKey) return false
  if (modifiers.alt && !event.altKey) return false
  if (modifiers.shift && !event.shiftKey) return false

  const eventKey = event.key.toLowerCase()
  if (eventKey !== key) return false

  return true
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, options: UseKeyboardShortcutsOptions = {}): void {
  const {
    enabled = true,
    ignoreInputs = true,
    preventDefault = true,
  } = options

  const shortcutsRef = useRef<ShortcutMap>(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      if (ignoreInputs) {
        const target = event.target as HTMLElement
        const tagName = target.tagName.toLowerCase()
        const isInput = tagName === 'input' || tagName === 'textarea' || target.isContentEditable

        if (isInput && event.key !== 'Escape') return
      }

      for (const [shortcut, handler] of Object.entries(shortcutsRef.current)) {
        const parsed = parseShortcut(shortcut)

        if (matchesShortcut(event, parsed)) {
          if (preventDefault) {
            event.preventDefault()
          }
          try {
            handler(event)
          } catch (err) {
            console.error(`[useKeyboardShortcuts] handler for "${shortcut}" threw:`, err)
          }
          return
        }
      }
    },
    [enabled, ignoreInputs, preventDefault]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function getShortcutDisplay(shortcut: string): string[] {
  const parts = shortcut.toLowerCase().split('+')

  return parts.map((part) => {
    switch (part) {
      case 'cmd':
      case 'meta':
        return isMac ? 'Cmd' : 'Ctrl'
      case 'ctrl':
      case 'control':
        return 'Ctrl'
      case 'alt':
      case 'option':
        return isMac ? 'Option' : 'Alt'
      case 'shift':
        return 'Shift'
      case 'enter':
        return 'Enter'
      case 'escape':
      case 'esc':
        return 'Esc'
      case 'backspace':
        return 'Backspace'
      case 'delete':
        return 'Del'
      case 'space':
        return 'Space'
      default:
        return part.toUpperCase()
    }
  })
}

export const SHORTCUTS = {
  COMMAND_PALETTE: 'cmd+k',
  ASSISTANT: 'cmd+/',
  TOGGLE_SIDEBAR: 'cmd+b',
  NEW_TASK: 'cmd+n',
  SAVE: 'cmd+s',
  CLOSE: 'escape',
  SUBMIT: 'cmd+enter',
  SEARCH: 'cmd+f',
  REFRESH: 'cmd+r',
} as const
