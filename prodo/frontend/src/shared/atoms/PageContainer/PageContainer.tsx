import { Box } from '@mui/material'
import { styled } from '@mui/material/styles'
import { fadeInUp } from '@/styles/styles'

/** Padded page with max-width constraint (reports, connections, jobs, etc.) */
export const PaddedPageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: 1400,
  margin: '0 auto',
  width: '100%',
  minHeight: 0,
  backgroundColor: theme.palette.background.default,
  animation: `${fadeInUp} 0.5s ease-out`,
  overflow: 'auto',
}))

/** Full-height flex page (dashboards, documents, agents, etc.) */
export const FullHeightPageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  // Viewport token: 56px accounts for the app bar height in this layout
  height: 'calc(100vh - 56px)',
  backgroundColor: theme.palette.background.default,
}))
