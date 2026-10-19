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
  Typography,
} from '@mui/material'
import MedicationIcon from '@mui/icons-material/MedicationOutlined'
import HourglassIcon from '@mui/icons-material/HourglassBottom'
import ErrorIcon from '@mui/icons-material/ErrorOutline'
import DonateIcon from '@mui/icons-material/VolunteerActivismOutlined'
import ExpiryChip from '../components/ExpiryChip.tsx'
import PageHeader from '../components/PageHeader.tsx'
import StatCard from '../components/StatCard.tsx'
import { useMedicines } from '../store/useMedicines.ts'
import { byExpiry, isDonationSuggested, statusOf } from '../utils/expiry.ts'

export default function DashboardPage() {
  const { medicines } = useMedicines()

  const expired = medicines.filter((m) => statusOf(m) === 'expired')
  const soon = medicines.filter((m) => statusOf(m) === 'soon')
  const planned = medicines.filter((m) => m.donation?.status === 'planned')
  const suggested = medicines.filter(isDonationSuggested)
  const attention = [...expired, ...soon].sort(byExpiry)

  return (
    <>
      <PageHeader
        title="Главная"
        subtitle="Сводка по домашней аптечке: что заканчивается и что можно отдать, пока срок не вышел"
        action={
          <Button variant="contained" component={Link} to="/medicines/new">
            Добавить лекарство
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Всего в аптечке" value={medicines.length} icon={<MedicationIcon />} color="primary" to="/medicines" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Истекают в течение месяца" value={soon.length} icon={<HourglassIcon />} color="warning" to="/medicines?status=soon" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Просрочено" value={expired.length} icon={<ErrorIcon />} color="error" to="/medicines?status=expired" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="В списке «отдать до срока»" value={planned.length} icon={<DonateIcon />} color="secondary" to="/donate" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Требуют внимания
              </Typography>
              {attention.length === 0 ? (
                <Typography color="text.secondary">Все лекарства в порядке.</Typography>
              ) : (
                <List disablePadding>
                  {attention.map((m) => (
                    <ListItemButton
                      key={m.id}
                      component={Link}
                      to={`/medicines/${m.id}`}
                      sx={{ borderRadius: 2, gap: 2, flexWrap: 'wrap' }}
                    >
                      <ListItemText primary={m.name} secondary={m.location} />
                      <ExpiryChip expiresAt={m.expiresAt} />
                    </ListItemButton>
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
              {suggested.length === 0 ? (
                <Typography color="text.secondary">
                  Сейчас нет нераспечатанных лекарств, которые скоро истекут.
                </Typography>
              ) : (
                <>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {suggested.map((m) => m.name).join(', ')} — упаковки не вскрыты, а срок годности
                    истекает в ближайшие полгода.
                  </Typography>
                  <Button variant="outlined" component={Link} to="/donate">
                    Перейти к списку
                  </Button>
                </>
              )}
              {expired.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Просроченные лекарства нельзя передавать — сдайте их в пункт приёма на утилизацию.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}
