import { Link } from 'react-router-dom'
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material'
import PlaceIcon from '@mui/icons-material/PlaceOutlined'
import { FORM_LABELS, type Medicine } from '../types.ts'
import { formatDate } from '../utils/expiry.ts'
import ExpiryChip from './ExpiryChip.tsx'

export default function MedicineCard({ medicine }: { medicine: Medicine }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea component={Link} to={`/medicines/${medicine.id}`} sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" component="h2">
            {medicine.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {medicine.substance}
          </Typography>
          <Typography variant="body2">
            {FORM_LABELS[medicine.form]} · {medicine.quantity}
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
            {medicine.donation && (
              <Chip
                size="small"
                color="secondary"
                variant="outlined"
                label={medicine.donation.status === 'handed' ? 'Передано в приют' : 'В списке «отдать»'}
              />
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
