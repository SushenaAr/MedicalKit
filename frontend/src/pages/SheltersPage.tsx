import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import PlaceIcon from '@mui/icons-material/PlaceOutlined'
import PetsIcon from '@mui/icons-material/Pets'
import PeopleIcon from '@mui/icons-material/PeopleOutline'
import CheckIcon from '@mui/icons-material/CheckCircleOutline'
import PageHeader from '../components/PageHeader.tsx'
import { useMedicines } from '../store/useMedicines.ts'

export default function SheltersPage() {
  const { shelters, medicines } = useMedicines()

  return (
    <>
      <PageHeader
        title="Приюты"
        subtitle="Куда можно передать лекарства и что там принимают"
      />

      <Alert severity="warning" sx={{ mb: 3 }}>
        Список приютов демонстрационный. Перед поездкой уточняйте потребности приюта.
      </Alert>

      <Grid container spacing={2}>
        {shelters.map((shelter) => {
          const assigned = medicines.filter((m) => m.donation?.shelterId === shelter.id)
          return (
            <Grid key={shelter.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Chip
                    size="small"
                    icon={shelter.kind === 'animals' ? <PetsIcon /> : <PeopleIcon />}
                    label={shelter.kind === 'animals' ? 'Для животных' : 'Для людей'}
                    sx={{ mb: 1 }}
                  />
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
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Ваших лекарств для этого приюта: <b>{assigned.length}</b>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </>
  )
}
