import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Box, Card, CardActionArea, CardContent, Skeleton, Typography } from '@mui/material'

export interface StatCardProps {
  label: string
  value: number
  icon: ReactNode
  color: 'primary' | 'warning' | 'error' | 'secondary'
  to: string
  /** Данные ещё загружаются — вместо числа показывается заглушка */
  loading?: boolean
}

export function StatCard({ label, value, icon, color, to, loading = false }: StatCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
        '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
      }}
    >
      <CardActionArea component={Link} to={to} sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              flexShrink: 0,
              color: `${color}.main`,
              bgcolor: (theme) => `${theme.palette[color].main}1a`,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" component="p">
              {loading ? <Skeleton width={40} /> : value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
