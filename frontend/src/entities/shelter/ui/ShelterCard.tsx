import type { ReactNode } from 'react'
import {
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Typography,
} from '@mui/material'
import PlaceIcon from '@mui/icons-material/PlaceOutlined'
import CheckIcon from '@mui/icons-material/CheckCircleOutline'
import type { Shelter } from '../model/types.ts'
import { ShelterKindChip } from './ShelterKindChip.tsx'

interface ShelterCardProps {
  shelter: Shelter
  /** Дополнительная информация внизу карточки, например связанные лекарства */
  footer?: ReactNode
}

export function ShelterCard({ shelter, footer }: ShelterCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ mb: 1 }}>
          <ShelterKindChip kind={shelter.kind} />
        </Box>
        <Typography variant="h6" component="h2">
          {shelter.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
          <PlaceIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {shelter.address}
          </Typography>
        </Box>

        <Typography variant="subtitle2">Принимают:</Typography>
        <List dense disablePadding>
          {shelter.accepts.map((item) => (
            <ListItem key={item} disableGutters>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Остаток срока годности — от {shelter.minMonthsLeft} мес.
        </Typography>
        {footer && <Box sx={{ mt: 1 }}>{footer}</Box>}
      </CardContent>
    </Card>
  )
}

export function ShelterCardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton variant="rounded" width={120} height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" sx={{ fontSize: '1.25rem' }} />
        <Skeleton variant="text" width="60%" sx={{ mb: 2 }} />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="75%" />
      </CardContent>
    </Card>
  )
}
