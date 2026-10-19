import { Link } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import AddIcon from '@mui/icons-material/Add'
import ExpiryChip from '../components/ExpiryChip.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { useMedicines } from '../store/useMedicines.ts'
import type { Medicine } from '../types.ts'
import { byExpiry, DONATE_MIN_DAYS, isDonationSuggested, shelterAccepts } from '../utils/expiry.ts'

function DonationRow({ medicine }: { medicine: Medicine }) {
  const { shelters, setDonationShelter, markHanded, cancelDonation } = useMedicines()
  const donation = medicine.donation!
  const handed = donation.status === 'handed'
  const shelter = shelters.find((s) => s.id === donation.shelterId)

  return (
    <Card>
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            component={Link}
            to={`/medicines/${medicine.id}`}
            sx={{ fontWeight: 600, color: 'inherit' }}
          >
            {medicine.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {medicine.substance} · {medicine.quantity}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <ExpiryChip expiresAt={medicine.expiresAt} />
            {handed && <Chip size="small" color="success" icon={<CheckIcon />} label="Передано" />}
          </Stack>
        </Box>

        {handed ? (
          <Typography color="text.secondary" sx={{ flex: 1 }}>
            {shelter?.name ?? 'Приют не указан'}
          </Typography>
        ) : (
          <>
            <TextField
              select
              size="small"
              label="Приют"
              value={donation.shelterId ?? ''}
              onChange={(e) => setDonationShelter(medicine.id, e.target.value || null)}
              sx={{ flex: 1, minWidth: 220 }}
            >
              {shelters.map((s) => (
                <MenuItem key={s.id} value={s.id} disabled={!shelterAccepts(s, medicine)}>
                  {s.name}
                  {!shelterAccepts(s, medicine) && ` (нужен срок от ${s.minMonthsLeft} мес.)`}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                disabled={!donation.shelterId}
                onClick={() => markHanded(medicine.id)}
              >
                Передано
              </Button>
              <Button color="inherit" onClick={() => cancelDonation(medicine.id)}>
                Убрать
              </Button>
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function DonatePage() {
  const { medicines, planDonation } = useMedicines()

  const inList = medicines.filter((m) => m.donation).sort(byExpiry)
  const planned = inList.filter((m) => m.donation?.status === 'planned')
  const handed = inList.filter((m) => m.donation?.status === 'handed')
  const suggested = medicines.filter(isDonationSuggested).sort(byExpiry)

  return (
    <>
      <PageHeader
        title="Отдать до срока"
        subtitle="Нераспечатанные лекарства, которые вам не понадобятся, лучше передать в приют, пока они годны"
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Приюты принимают только лекарства в целой упаковке и с остатком срока годности не меньше{' '}
        {DONATE_MIN_DAYS} дней. У каждого приюта свои требования — смотрите раздел{' '}
        <Link to="/shelters">«Приюты»</Link>.
      </Alert>

      <Typography variant="h6" component="h2" gutterBottom>
        Рекомендуем отдать
      </Typography>
      {suggested.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Подходящих лекарств нет.
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {suggested.map((m) => (
            <Card key={m.id}>
              <CardContent
                sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}
              >
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography sx={{ fontWeight: 600 }}>{m.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {m.substance} · {m.quantity}
                  </Typography>
                </Box>
                <ExpiryChip expiresAt={m.expiresAt} />
                <Button startIcon={<AddIcon />} onClick={() => planDonation(m.id)}>
                  В список
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Typography variant="h6" component="h2" gutterBottom>
        Список на передачу ({planned.length})
      </Typography>
      {planned.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Список пуст. Добавьте лекарства из рекомендаций или из карточки лекарства.
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {planned.map((m) => (
            <DonationRow key={m.id} medicine={m} />
          ))}
        </Stack>
      )}

      {handed.length > 0 && (
        <>
          <Typography variant="h6" component="h2" gutterBottom>
            Уже передано ({handed.length})
          </Typography>
          <Stack spacing={1.5}>
            {handed.map((m) => (
              <DonationRow key={m.id} medicine={m} />
            ))}
          </Stack>
        </>
      )}
    </>
  )
}
