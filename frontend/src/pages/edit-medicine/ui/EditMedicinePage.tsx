import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, CardContent, Grid, Skeleton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { useMedicine } from '../../../entities/medicine/index.ts'
import { EditMedicineForm } from '../../../features/medicine-form/index.ts'
import { routes } from '../../../shared/config/routes.ts'
import { Appear, EmptyState, ErrorState, PageHeader } from '../../../shared/ui/index.ts'

function FormSkeleton() {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={2}>
          {Array.from({ length: 6 }, (_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }}>
              <Skeleton variant="rounded" height={56} />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export function EditMedicinePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { medicine, status, error, reload } = useMedicine(id)

  const backToCard = () => navigate(id ? routes.medicine(id) : routes.medicines())

  let content
  if (status === 'loading') {
    content = <FormSkeleton />
  } else if (status === 'error' && error) {
    content = <ErrorState message={error} onRetry={reload} />
  } else if (!medicine) {
    content = (
      <EmptyState
        icon={<SearchOffIcon />}
        title="Лекарство не найдено"
        action={
          <Button component={Link} to={routes.medicines()} startIcon={<ArrowBackIcon />}>
            К аптечке
          </Button>
        }
      />
    )
  } else {
    content = (
      <Appear>
        <EditMedicineForm medicine={medicine} onSaved={backToCard} onCancel={backToCard} />
      </Appear>
    )
  }

  return (
    <>
      <PageHeader title="Изменить лекарство" subtitle={medicine?.name} />
      {content}
    </>
  )
}
