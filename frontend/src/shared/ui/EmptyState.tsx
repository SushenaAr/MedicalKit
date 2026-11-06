import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'
import InboxIcon from '@mui/icons-material/Inbox'
import { Appear } from './Appear.tsx'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  /** Компактный вариант для блоков внутри карточек */
  dense?: boolean
}

export function EmptyState({ title, description, icon, action, dense = false }: EmptyStateProps) {
  return (
    <Appear>
      <Box
        sx={{
          textAlign: 'center',
          py: dense ? 3 : 6,
          px: 2,
          color: 'text.secondary',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ fontSize: dense ? 36 : 48, lineHeight: 1, mb: 1, '& svg': { fontSize: 'inherit' } }}>
          {icon ?? <InboxIcon />}
        </Box>
        <Typography variant={dense ? 'subtitle1' : 'h6'} component="p" color="text.primary">
          {title}
        </Typography>
        {description && <Typography sx={{ mt: 0.5, maxWidth: 480, mx: 'auto' }}>{description}</Typography>}
        {action && <Box sx={{ mt: 2 }}>{action}</Box>}
      </Box>
    </Appear>
  )
}
