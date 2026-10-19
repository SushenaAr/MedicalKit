import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DonateIcon from '@mui/icons-material/VolunteerActivismOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import ExpiryChip from '../components/ExpiryChip.tsx'
import { useMedicines } from '../store/useMedicines.ts'
import { FORM_LABELS } from '../types.ts'
import { canDonate, daysLeft, DONATE_MIN_DAYS, formatDate, statusOf } from '../utils/expiry.ts'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography>{value}</Typography>
    </Grid>
  )
}

export default function MedicineDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { medicines, shelters, setOpened, planDonation, removeMedicine } = useMedicines()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const medicine = medicines.find((m) => m.id === id)

  if (!medicine) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Лекарство не найдено
        </Typography>
        <Button component={Link} to="/medicines" startIcon={<ArrowBackIcon />}>
          К аптечке
        </Button>
      </Box>
    )
  }

  const status = statusOf(medicine)
  const shelter = shelters.find((s) => s.id === medicine.donation?.shelterId)

  let donateHint: string | null = null
  if (status === 'expired') {
    donateHint = 'Срок годности истёк: лекарство нужно сдать на утилизацию, передавать его нельзя.'
  } else if (medicine.opened) {
    donateHint = 'Приюты принимают только лекарства в невскрытой упаковке.'
  } else if (daysLeft(medicine.expiresAt) < DONATE_MIN_DAYS) {
    donateHint = `До конца срока меньше ${DONATE_MIN_DAYS} дней — приюты такие лекарства обычно не берут.`
  }

  const handleDelete = () => {
    removeMedicine(medicine.id)
    navigate('/medicines')
  }

  return (
    <>
      <Button component={Link} to="/medicines" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        К аптечке
      </Button>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" component="h1">
              {medicine.name}
            </Typography>
            <ExpiryChip expiresAt={medicine.expiresAt} />
          </Box>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {medicine.substance}
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Field label="Форма выпуска" value={FORM_LABELS[medicine.form]} />
            <Field label="Количество" value={medicine.quantity} />
            <Field label="Годен до" value={formatDate(medicine.expiresAt)} />
            <Field label="Где хранится" value={medicine.location} />
            {medicine.notes && <Field label="Заметки" value={medicine.notes} />}
          </Grid>

          <FormControlLabel
            control={
              <Switch
                checked={medicine.opened}
                onChange={(e) => setOpened(medicine.id, e.target.checked)}
              />
            }
            label="Упаковка вскрыта"
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" component="h2" gutterBottom>
            Отдать до срока
          </Typography>
          {medicine.donation ? (
            <Alert severity={medicine.donation.status === 'handed' ? 'success' : 'info'}>
              {medicine.donation.status === 'handed'
                ? `Передано${shelter ? `: ${shelter.name}` : ''}.`
                : `В списке на передачу${shelter ? ` — ${shelter.name}` : ', приют пока не выбран'}.`}{' '}
              <Link to="/donate">Открыть список</Link>
            </Alert>
          ) : donateHint ? (
            <Alert severity={status === 'expired' ? 'error' : 'warning'}>{donateHint}</Alert>
          ) : (
            <Typography color="text.secondary">
              Упаковка целая и срок позволяет — лекарство можно передать в приют.
            </Typography>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<DonateIcon />}
              disabled={!canDonate(medicine) || Boolean(medicine.donation)}
              onClick={() => planDonation(medicine.id)}
            >
              Добавить в список «отдать»
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDelete(true)}
            >
              Удалить из аптечки
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Удалить «{medicine.name}»?</DialogTitle>
        <DialogContent>
          <Typography>Лекарство пропадёт из аптечки и из списка на передачу.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Отмена</Button>
          <Button color="error" onClick={handleDelete}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
