import { useState, type FormEvent } from 'react'
import { Alert, Button, Collapse, Stack, TextField } from '@mui/material'
import { useSession, type User } from '../../../entities/session/index.ts'
import { errorMessage } from '../../../shared/api/index.ts'
import { PasswordField } from '../../../shared/ui/index.ts'
import { validateLogin, type Errors, type LoginValues } from '../model/validation.ts'

interface LoginFormProps {
  onSuccess: (user: User) => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useSession()
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' })
  const [touched, setTouched] = useState<Partial<Record<keyof LoginValues, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const errors: Errors<LoginValues> = validateLogin(values)
  const shown = (field: keyof LoginValues) => (submitted || touched[field] ? errors[field] : undefined)

  const change = (field: keyof LoginValues) => (event: { target: { value: string } }) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
    setServerError(null)
  }
  // Ошибку поля показываем после ухода с него, но только если в нём что-то введено:
  // «обязательное поле» — после попытки отправки. Иначе подсказка под пустым полем появлялась бы
  // в момент клика по ссылке или кнопке ниже, сдвигала вёрстку, и клик проходил мимо.
  const blur = (field: keyof LoginValues) => () => {
    if (values[field]) setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) return
    setPending(true)
    try {
      onSuccess(await login({ email: values.email.trim(), password: values.password }))
    } catch (error) {
      setServerError(errorMessage(error))
      setPending(false)
    }
  }

  return (
    <Stack component="form" noValidate spacing={2} onSubmit={handleSubmit}>
      <Collapse in={Boolean(serverError)} unmountOnExit>
        <Alert severity="error">{serverError}</Alert>
      </Collapse>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        autoFocus
        fullWidth
        value={values.email}
        onChange={change('email')}
        onBlur={blur('email')}
        error={Boolean(shown('email'))}
        helperText={shown('email')}
      />
      <PasswordField
        label="Пароль"
        autoComplete="current-password"
        fullWidth
        value={values.password}
        onChange={change('password')}
        onBlur={blur('password')}
        error={Boolean(shown('password'))}
        helperText={shown('password')}
      />
      <Button type="submit" variant="contained" size="large" loading={pending}>
        Войти
      </Button>
    </Stack>
  )
}
