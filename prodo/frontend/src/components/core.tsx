// components/core.tsx — BRIDGE
// Re-exports shared components for backward-compatible imports.
// New code should import from '@/shared/' directly.

export { ErrorBoundary } from '@/shared/organisms/ErrorBoundary'
export { ToastProvider, useToast } from '@/shared/organisms/ToastProvider'
export { LoadingState, Skeleton, ContentSkeleton } from '@/shared/molecules/LoadingState'
export { EmptyState } from '@/shared/molecules/EmptyState'
export { PageHeader } from '@/shared/molecules/PageHeader'
export { SectionHeader } from '@/shared/molecules/SectionHeader'
export { InfoTooltip } from '@/shared/molecules/InfoTooltip'
export { Surface } from '@/shared/atoms/Surface'
export { DataTable } from '@/shared/organisms/DataTable'
