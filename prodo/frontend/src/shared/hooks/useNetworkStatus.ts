import { useCallback, useEffect, useState } from 'react'

interface CheckHealthOptions {
  timeoutMs: number
}

async function checkHealth(options: CheckHealthOptions): Promise<boolean> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs)

  try {
    const response = await fetch('/api/health/', { signal: controller.signal })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeoutId)
  }
}

interface UseNetworkStatusReturn {
  isOnline: boolean
  lastChecked: Date | null
  checkConnectivity: () => Promise<boolean>
  checkServer: () => Promise<boolean>
}

/**
 * Hook to detect network connectivity status
 * Returns online status and a function to manually check connectivity
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : false
    setIsOnline(online)
    setLastChecked(new Date())
    return online
  }, [])

  const checkServer = useCallback(async (): Promise<boolean> => {
    const browserOnline = typeof navigator !== 'undefined' ? navigator.onLine : false
    if (!browserOnline) return false
    try {
      return await checkHealth({ timeoutMs: 5000 })
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setLastChecked(new Date())
    }

    const handleOffline = () => {
      setIsOnline(false)
      setLastChecked(new Date())
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    setLastChecked(new Date())

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    lastChecked,
    checkConnectivity,
    checkServer,
  }
}
