import { useState, type FormEvent } from 'react'
import { Alert, Button, Collapse, Stack, TextField } from '@mui/material'
import { useSession, type User } from '../../../entities/session/index.ts'
import { errorMessage } from '../../../shared/api/index.ts'
import { PasswordField } from '../../../shared/ui/index.ts'
import {
  PASSWORD_MIN_LENGTH,
  serverFieldErrors,
  validateRegister,
  type Errors,
  type RegisterValues,
} from '../model/validation.ts'

interface RegisterFormProps {
  onSuccess: (user: User) => void
}

const FIELDS: (keyof RegisterValues)[] = ['name', 'email', 'password', 'confirm']

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register } = useSession()
  const [values, setValues] = useState<RegisterValues>({ name: '', email: '', password: '', confirm: '' })
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterValues, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [serverErrors, setServerErrors] = useState<Errors<RegisterValues>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const errors = validateRegister(values)
  const shown = (field: keyof RegisterValues) =>
    serverErrors[field] ?? (submitted || touched[field] ? errors[field] : undefined)

  const change = (field: keyof RegisterValues) => (event: { target: { value: string } }) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
    setServerErrors((prev) => ({ ...prev, [field]: undefined }))
    setServerError(null)
  }
  // Ошибку поля показываем после ухода с него, но только если в нём что-то введено:
  // «обязательное поле» — после попытки отправки. Иначе подсказка под пустым полем появлялась бы
  // в момент клика по ссылке или кнопке ниже, сдвигала вёрстку, и клик проходил мимо.
  const blur = (field: keyof RegisterValues) => () => {
    if (values[field]) setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) return
    setPending(true)
    try {
      const user = await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      onSuccess(user)
    } catch (error) {
      const byField = serverFieldErrors<RegisterValues>(error, FIELDS)
      setServerErrors(byField)
      // Ошибка, которую нельзя показать у поля (например, сервер недоступен), — над формой
      if (Object.keys(byField).length === 0) setServerError(errorMessage(error))
      setPending(false)
    }
  }

  const passwordHint = `Не короче ${PASSWORD_MIN_LENGTH} символов, хотя бы одна буква и одна цифра`

  return (
    <Stack component="form" noValidate spacing={2} onSubmit={handleSubmit}>
      <Collapse in={Boolean(serverError)} unmountOnExit>
        <Alert severity="error">{serverError}</Alert>
      </Collapse>
      <TextField
        label="Имя"
        autoComplete="name"
        autoFocus
        fullWidth
        value={values.name}
        onChange={change('name')}
        onBlur={blur('name')}
        error={Boolean(shown('name'))}
        helperText={shown('name')}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        fullWidth
        value={values.email}
        onChange={change('email')}
        onBlur={blur('email')}
        error={Boolean(shown('email'))}
        helperText={shown('email')}
      />
      <PasswordField
        label="Пароль"
        autoComplete="new-password"
        fullWidth
        value={values.password}
        onChange={change('password')}
        onBlur={blur('password')}
        error={Boolean(shown('password'))}
        helperText={shown('password') ?? passwordHint}
      />
      <PasswordField
        label="Повторите пароль"
        autoComplete="new-password"
        fullWidth
        value={values.confirm}
        onChange={change('confirm')}
        onBlur={blur('confirm')}
        error={Boolean(shown('confirm'))}
        helperText={shown('confirm')}
      />
      <Button type="submit" variant="contained" size="large" loading={pending}>
        Зарегистрироваться
      </Button>
    </Stack>
  )
}
