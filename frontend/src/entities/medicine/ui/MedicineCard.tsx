import { Link } from 'react-router-dom'
import { Box, Card, CardActionArea, CardContent, Chip, Skeleton, Stack, Typography } from '@mui/material'
import PlaceIcon from '@mui/icons-material/PlaceOutlined'
import { formatDate } from '../../../shared/lib/index.ts'
import { routes } from '../../../shared/config/routes.ts'
import { FORM_LABELS, type Medicine } from '../model/types.ts'
import { DonationChip } from './DonationChip.tsx'
import { ExpiryChip } from './ExpiryChip.tsx'

export function MedicineCard({ medicine }: { medicine: Medicine }) {
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3, borderColor: 'primary.light' },
        '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
      }}
    >
      <CardActionArea component={Link} to={routes.medicine(medicine.id)} sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" component="h2">
            {medicine.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {medicine.substance || '—'}
          </Typography>
          <Typography variant="body2">
            {FORM_LABELS[medicine.form]}
            {medicine.quantity && ` · ${medicine.quantity}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Годен до {formatDate(medicine.expiresAt)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <PlaceIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {medicine.location}
            </Typography>
          </Box>
          <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
            <ExpiryChip expiresAt={medicine.expiresAt} />
            {medicine.opened && <Chip size="small" label="Вскрыто" />}
            {medicine.donation && <DonationChip donation={medicine.donation} />}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export function MedicineCardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton variant="text" width="55%" sx={{ fontSize: '1.25rem' }} />
        <Skeleton variant="text" width="75%" />
        <Skeleton variant="text" width="45%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="50%" sx={{ mt: 1 }} />
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Skeleton variant="rounded" width={110} height={24} />
          <Skeleton variant="rounded" width={70} height={24} />
        </Stack>
      </CardContent>
    </Card>
  )
}
