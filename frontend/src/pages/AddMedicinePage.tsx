import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import PageHeader from '../components/PageHeader.tsx'
import { useMedicines } from '../store/useMedicines.ts'
import { FORM_LABELS, type MedicineForm, type NewMedicine } from '../types.ts'

const EMPTY_FORM: NewMedicine = {
  name: '',
  substance: '',
  form: 'tablets',
  quantity: '',
  expiresAt: '',
  opened: false,
  location: '',
  notes: '',
}

type Errors = Partial<Record<keyof NewMedicine, string>>

function validate(values: NewMedicine): Errors {
  const errors: Errors = {}
  if (!values.name.trim()) errors.name = 'Укажите название'
  if (!values.expiresAt) errors.expiresAt = 'Укажите срок годности'
  if (!values.location.trim()) errors.location = 'Укажите, где хранится лекарство'
  return errors
}

export default function AddMedicinePage() {
  const { addMedicine } = useMedicines()
  const navigate = useNavigate()
  const [values, setValues] = useState<NewMedicine>(EMPTY_FORM)
  const [errors, setErrors] = useState<Errors>({})

  const setField = <K extends keyof NewMedicine>(key: K, value: NewMedicine[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const found = validate(values)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    const created = addMedicine({
      ...values,
      name: values.name.trim(),
      substance: values.substance.trim(),
      location: values.location.trim(),
      notes: values.notes?.trim() || undefined,
    })
    navigate(`/medicines/${created.id}`)
  }

  return (
    <>
      <PageHeader title="Добавить лекарство" subtitle="Внесите данные с упаковки" />

      <Card>
        <CardContent component="form" noValidate onSubmit={handleSubmit} sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Название"
                required
                fullWidth
                value={values.name}
                onChange={(e) => setField('name', e.target.value)}
                error={Boolean(errors.name)}
                helperText={errors.name}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Действующее вещество и дозировка"
                fullWidth
                value={values.substance}
                onChange={(e) => setField('substance', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Форма выпуска"
                fullWidth
                value={values.form}
                onChange={(e) => setField('form', e.target.value as MedicineForm)}
              >
                {Object.entries(FORM_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Количество"
                placeholder="Например, 20 таб."
                fullWidth
                value={values.quantity}
                onChange={(e) => setField('quantity', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Годен до"
                type="date"
                required
                fullWidth
                value={values.expiresAt}
                onChange={(e) => setField('expiresAt', e.target.value)}
                error={Boolean(errors.expiresAt)}
                helperText={errors.expiresAt}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Где хранится"
                required
                fullWidth
                value={values.location}
                onChange={(e) => setField('location', e.target.value)}
                error={Boolean(errors.location)}
                helperText={errors.location}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Заметки"
                fullWidth
                multiline
                minRows={2}
                value={values.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch checked={values.opened} onChange={(e) => setField('opened', e.target.checked)} />
                }
                label="Упаковка вскрыта"
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button type="submit" variant="contained">
              Сохранить
            </Button>
            <Button component={Link} to="/medicines">
              Отмена
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </>
  )
}
