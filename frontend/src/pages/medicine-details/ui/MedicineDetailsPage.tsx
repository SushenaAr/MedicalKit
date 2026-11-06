import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Fade,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/EditOutlined'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import {
  donateBlockReason,
  ExpiryChip,
  FORM_LABELS,
  statusOf,
  useMedicine,
  type Medicine,
} from '../../../entities/medicine/index.ts'
import { useShelters } from '../../../entities/shelter/index.ts'
import { DeleteMedicineButton } from '../../../features/delete-medicine/index.ts'
import { PlanDonationButton } from '../../../features/manage-donation/index.ts'
import { ToggleOpenedSwitch } from '../../../features/toggle-opened/index.ts'
import { routes } from '../../../shared/config/routes.ts'
import { formatDate } from '../../../shared/lib/index.ts'
import { Appear, EmptyState, ErrorState } from '../../../shared/ui/index.ts'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography>{value || '—'}</Typography>
    </Grid>
  )
}

/** Блок «Отдать до срока»: содержимое плавно сменяется при изменении состояния лекарства */
function DonationSection({ medicine }: { medicine: Medicine }) {
  const { shelters } = useShelters()
  const shelter = shelters.find((s) => s.id === medicine.donation?.shelterId)
  const reason = donateBlockReason(medicine)

  let stateKey: string
  let content
  if (medicine.donation) {
    const handed = medicine.donation.status === 'handed'
    stateKey = `donation-${medicine.donation.status}-${medicine.donation.shelterId}`
    content = (
      <Alert severity={handed ? 'success' : 'info'}>
        {handed
          ? `Передано${shelter ? `: ${shelter.name}` : ''}.`
          : `В списке на передачу${shelter ? ` — ${shelter.name}` : ', приют пока не выбран'}.`}{' '}
        <Link to={routes.donate()}>Открыть список</Link>
      </Alert>
    )
  } else if (reason) {
    stateKey = `blocked-${reason}`
    content = <Alert severity={statusOf(medicine) === 'expired' ? 'error' : 'warning'}>{reason}</Alert>
  } else {
    stateKey = 'can-donate'
    content = (
      <Typography color="text.secondary">
        Упаковка целая и срок позволяет — лекарство можно передать в приют.
      </Typography>
    )
  }

  return (
    <Fade key={stateKey} in timeout={350}>
      <Box>{content}</Box>
    </Fade>
  )
}

function DetailsSkeleton() {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width="40%" sx={{ fontSize: '2rem' }} />
        <Skeleton variant="text" width="30%" sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          {[0, 1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }}>
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="60%" />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={48} sx={{ mt: 3 }} />
      </CardContent>
    </Card>
  )
}

export function MedicineDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { medicine, status, error, reload } = useMedicine(id)

  const backButton = (
    <Button component={Link} to={routes.medicines()} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
      К аптечке
    </Button>
  )

  if (status === 'loading') {
    return (
      <>
        {backButton}
        <DetailsSkeleton />
      </>
    )
  }
  if (status === 'error' && error) {
    return (
      <>
        {backButton}
        <ErrorState message={error} onRetry={reload} />
      </>
    )
  }
  if (!medicine) {
    return (
      <>
        {backButton}
        <EmptyState
          icon={<SearchOffIcon />}
          title="Лекарство не найдено"
          description="Возможно, его удалили или ссылка неверна."
        />
      </>
    )
  }

  return (
    <>
      {backButton}
      <Appear>
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                {medicine.name}
              </Typography>
              <ExpiryChip expiresAt={medicine.expiresAt} />
              <Button component={Link} to={routes.editMedicine(medicine.id)} startIcon={<EditIcon />}>
                Изменить
              </Button>
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

            <ToggleOpenedSwitch medicine={medicine} />

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" component="h2" gutterBottom>
              Отдать до срока
            </Typography>
            <DonationSection medicine={medicine} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
              <PlanDonationButton medicine={medicine} />
              <DeleteMedicineButton medicine={medicine} onDeleted={() => navigate(routes.medicines())} />
            </Stack>
          </CardContent>
        </Card>
      </Appear>
    </>
  )
}
