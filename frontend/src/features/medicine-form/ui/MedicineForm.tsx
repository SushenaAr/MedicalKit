import { useMemo, useRef, useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  FormControlLabel,
  FormHelperText,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import {
  FORM_LABELS,
  type MedicineForm as Form,
  type MedicineInput,
} from '../../../entities/medicine/index.ts'
import { ConfirmDialog } from '../../../shared/ui/index.ts'
import {
  EMPTY_VALUES,
  expiryWarning,
  FIELD_ORDER,
  isSameValues,
  LIMITS,
  toInput,
  validate,
  type FieldName,
  type MedicineFormValues,
} from '../model/validation.ts'

export interface MedicineFormProps {
  initialValues?: MedicineFormValues
  submitLabel: string
  /** Сохранение; возвращает `true` при успехе */
  onSubmit: (input: MedicineInput) => Promise<boolean>
  onCancel: () => void
  inDonationList?: boolean
}

const FORM_OPTIONS = Object.entries(FORM_LABELS) as [Form, string][]

/**
 * Форма лекарства с клиентской валидацией.
 * Ошибка поля показывается после того, как пользователь покинул поле или попытался сохранить,
 * и исчезает сразу после исправления. Используется и для добавления, и для редактирования.
 */
export function MedicineForm({
  initialValues = EMPTY_VALUES,
  submitLabel,
  onSubmit,
  onCancel,
  inDonationList = false,
}: MedicineFormProps) {
  const [values, setValues] = useState<MedicineFormValues>(initialValues)
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({})

  const errors = useMemo(() => validate(values, { inDonationList }), [values, inDonationList])
  const warning = expiryWarning(values)
  const dirty = !isSameValues(values, initialValues)
  const errorCount = Object.keys(errors).length

  const visibleError = (field: FieldName) => (submitAttempted || touched[field] ? errors[field] : undefined)

  const setField = <K extends FieldName>(field: K, value: MedicineFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const touch = (field: FieldName) => () => setTouched((prev) => ({ ...prev, [field]: true }))

  const textFieldProps = (field: Exclude<FieldName, 'opened' | 'form'>) => ({
    value: values[field],
    onChange: (event: { target: { value: string } }) => setField(field, event.target.value),
    onBlur: touch(field),
    error: Boolean(visibleError(field)),
    inputRef: (node: HTMLElement | null) => {
      fieldRefs.current[field] = node
    },
    fullWidth: true,
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitAttempted(true)
    if (errorCount > 0) {
      const first = FIELD_ORDER.find((field) => errors[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }
    setSaving(true)
    const ok = await onSubmit(toInput(values))
    // При успехе страница уходит с формы; при ошибке пользователь может повторить
    if (!ok) setSaving(false)
  }

  const handleCancel = () => (dirty ? setConfirmCancel(true) : onCancel())

  return (
    <Card>
      <CardContent component="form" noValidate onSubmit={handleSubmit} sx={{ p: { xs: 2, md: 3 } }}>
        <Collapse in={submitAttempted && errorCount > 0} unmountOnExit>
          <Alert severity="error" sx={{ mb: 2 }}>
            Проверьте форму: {errorCount === 1 ? 'одно поле заполнено' : 'несколько полей заполнены'} неверно.
          </Alert>
        </Collapse>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Название"
              required
              autoFocus
              {...textFieldProps('name')}
              helperText={visibleError('name') ?? 'Как написано на упаковке'}
              slotProps={{ htmlInput: { maxLength: LIMITS.name + 20 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Действующее вещество и дозировка"
              placeholder="Например, ибупрофен 200 мг"
              {...textFieldProps('substance')}
              helperText={visibleError('substance')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Форма выпуска"
              fullWidth
              value={values.form}
              onChange={(e) => setField('form', e.target.value as Form)}
              inputRef={(node: HTMLElement | null) => {
                fieldRefs.current.form = node
              }}
            >
              {FORM_OPTIONS.map(([value, label]) => (
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
              {...textFieldProps('quantity')}
              helperText={visibleError('quantity')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Годен до"
              type="date"
              required
              {...textFieldProps('expiresAt')}
              helperText={visibleError('expiresAt')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Collapse in={!visibleError('expiresAt') && Boolean(warning)}>
              <FormHelperText sx={{ color: 'warning.dark', mx: 1.75 }}>{warning}</FormHelperText>
            </Collapse>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Где хранится"
              required
              placeholder="Например, кухня, верхний ящик"
              {...textFieldProps('location')}
              helperText={visibleError('location')}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Заметки"
              multiline
              minRows={2}
              {...textFieldProps('notes')}
              helperText={
                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <span>{visibleError('notes')}</span>
                  <span>
                    {values.notes.trim().length}/{LIMITS.notes}
                  </span>
                </Box>
              }
            />
          </Grid>
          <Grid size={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={values.opened}
                  onChange={(e) => {
                    setField('opened', e.target.checked)
                    touch('opened')()
                  }}
                  inputRef={(node: HTMLElement | null) => {
                    fieldRefs.current.opened = node
                  }}
                />
              }
              label="Упаковка вскрыта"
            />
            <Collapse in={Boolean(visibleError('opened'))}>
              <FormHelperText error>{errors.opened}</FormHelperText>
            </Collapse>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" loading={saving}>
            {submitLabel}
          </Button>
          <Button onClick={handleCancel} disabled={saving}>
            Отмена
          </Button>
        </Stack>
      </CardContent>

      <ConfirmDialog
        open={confirmCancel}
        title="Отменить изменения?"
        description="Введённые данные не сохранятся."
        confirmLabel="Не сохранять"
        danger
        onConfirm={onCancel}
        onClose={() => setConfirmCancel(false)}
      />
    </Card>
  )
}
