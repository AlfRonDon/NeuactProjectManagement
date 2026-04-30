'use client'

import { EmotionRegistry } from '@/lib/EmotionRegistry'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { DensityProvider } from '@/shared/hooks/DensityProvider'
import { ToastProvider } from '@/shared/organisms/ToastProvider'
import { ErrorBoundary } from '@/shared/organisms/ErrorBoundary'
import { AuthWrapper } from './AuthWrapper'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <ThemeProvider>
        <DensityProvider>
          <ToastProvider>
            <ErrorBoundary>
              <AuthWrapper>{children}</AuthWrapper>
            </ErrorBoundary>
          </ToastProvider>
        </DensityProvider>
      </ThemeProvider>
    </EmotionRegistry>
  )
}
