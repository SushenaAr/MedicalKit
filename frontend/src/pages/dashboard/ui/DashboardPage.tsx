import { Link } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Typography,
} from '@mui/material'
import MedicationIcon from '@mui/icons-material/MedicationOutlined'
import HourglassIcon from '@mui/icons-material/HourglassBottom'
import ErrorIcon from '@mui/icons-material/ErrorOutline'
import DonateIcon from '@mui/icons-material/VolunteerActivismOutlined'
import CheckIcon from '@mui/icons-material/TaskAlt'
import {
  byExpiry,
  ExpiryChip,
  isDonationSuggested,
  isPlanned,
  statusOf,
  useMedicines,
} from '../../../entities/medicine/index.ts'
import { routes } from '../../../shared/config/routes.ts'
import {
  Appear,
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
  type StatCardProps,
} from '../../../shared/ui/index.ts'

function ListSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rounded" height={52} sx={{ mb: 1 }} />
      ))}
    </>
  )
}

export function DashboardPage() {
  const { medicines, status, error, reload } = useMedicines()
  const loading = status === 'loading'

  const expired = medicines.filter((m) => statusOf(m) === 'expired')
  const soon = medicines.filter((m) => statusOf(m) === 'soon')
  const planned = medicines.filter(isPlanned)
  const suggested = medicines.filter(isDonationSuggested)
  const attention = [...expired, ...soon].sort(byExpiry)

  const stats: StatCardProps[] = [
    {
      label: 'Всего в аптечке',
      value: medicines.length,
      icon: <MedicationIcon />,
      color: 'primary',
      to: routes.medicines(),
    },
    {
      label: 'Истекают в течение месяца',
      value: soon.length,
      icon: <HourglassIcon />,
      color: 'warning',
      to: `${routes.medicines()}?status=soon`,
    },
    {
      label: 'Просрочено',
      value: expired.length,
      icon: <ErrorIcon />,
      color: 'error',
      to: `${routes.medicines()}?status=expired`,
    },
    {
      label: 'В списке «отдать до срока»',
      value: planned.length,
      icon: <DonateIcon />,
      color: 'secondary',
      to: routes.donate(),
    },
  ]

  const addButton = (
    <Button variant="contained" component={Link} to={routes.newMedicine()}>
      Добавить лекарство
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Главная"
        subtitle="Сводка по домашней аптечке: что заканчивается и что можно отдать, пока срок не вышел"
        action={addButton}
      />

      {status === 'error' && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : status === 'success' && medicines.length === 0 ? (
        <EmptyState
          icon={<MedicationIcon />}
          title="Аптечка пока пуста"
          description="Добавьте первое лекарство — приложение начнёт следить за сроком годности и подскажет, что можно отдать в приют."
          action={addButton}
        />
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {stats.map((card, index) => (
              <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Appear index={index}>
                  <StatCard {...card} loading={loading} />
                </Appear>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Требуют внимания
                  </Typography>
                  {loading ? (
                    <ListSkeleton />
                  ) : attention.length === 0 ? (
                    <EmptyState dense icon={<CheckIcon color="success" />} title="Все лекарства в порядке" />
                  ) : (
                    <List disablePadding>
                      {attention.map((m, index) => (
                        <Appear key={m.id} index={index}>
                          <ListItemButton
                            component={Link}
                            to={routes.medicine(m.id)}
                            sx={{ borderRadius: 2, gap: 2, flexWrap: 'wrap' }}
                          >
                            <ListItemText primary={m.name} secondary={m.location} />
                            <ExpiryChip expiresAt={m.expiresAt} />
                          </ListItemButton>
                        </Appear>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Можно отдать в приют
                  </Typography>
                  {loading ? (
                    <>
                      <Skeleton variant="text" />
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="rounded" width={160} height={36} sx={{ mt: 2 }} />
                    </>
                  ) : suggested.length === 0 ? (
                    <Typography color="text.secondary">
                      Сейчас нет нераспечатанных лекарств, которые скоро истекут.
                    </Typography>
                  ) : (
                    <Appear>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        {suggested.map((m) => m.name).join(', ')} — упаковки не вскрыты, а срок годности
                        истекает в ближайшие полгода.
                      </Typography>
                      <Button variant="outlined" component={Link} to={routes.donate()}>
                        Перейти к списку
                      </Button>
                    </Appear>
                  )}
                  {!loading && expired.length > 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Просроченные лекарства нельзя передавать — сдайте их в пункт приёма на утилизацию.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </>
  )
}
