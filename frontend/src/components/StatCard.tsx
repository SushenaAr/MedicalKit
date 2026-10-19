import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material'

interface StatCardProps {
  label: string
  value: number
  icon: ReactNode
  color: 'primary' | 'warning' | 'error' | 'secondary'
  to: string
}

export default function StatCard({ label, value, icon, color, to }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
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
              {value}
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
