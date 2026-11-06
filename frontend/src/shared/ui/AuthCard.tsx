import type { ReactNode } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import { Appear } from './Appear.tsx'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** Карточка по центру экрана для страниц входа и регистрации */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 4,
        bgcolor: 'background.default',
      }}
    >
      <Appear sx={{ width: '100%', maxWidth: 420, height: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
          <LocalPharmacyIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" component="p" color="primary" sx={{ fontWeight: 600 }}>
            Домашняя аптечка
          </Typography>
        </Box>
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" component="h1" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {subtitle}
              </Typography>
            )}
            {children}
          </CardContent>
        </Card>
        {footer && <Box sx={{ textAlign: 'center', mt: 2 }}>{footer}</Box>}
      </Appear>
    </Box>
  )
}
