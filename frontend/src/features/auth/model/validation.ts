import { ApiError } from '../../../shared/api/index.ts'

// Правила совпадают с проверками backend (app/schemas/auth.py), чтобы ошибку было видно до отправки
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const NAME_MAX_LENGTH = 100

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface LoginValues {
  email: string
  password: string
}

export interface RegisterValues extends LoginValues {
  name: string
  confirm: string
}

export type Errors<T> = Partial<Record<keyof T, string>>

export function validateLogin(values: LoginValues): Errors<LoginValues> {
  const errors: Errors<LoginValues> = {}
  if (!values.email.trim()) errors.email = 'Укажите email'
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Некорректный email'
  if (!values.password) errors.password = 'Введите пароль'
  return errors
}

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Не короче ${PASSWORD_MIN_LENGTH} символов`
  if (password.length > PASSWORD_MAX_LENGTH) return `Не длиннее ${PASSWORD_MAX_LENGTH} символов`
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return 'Нужна хотя бы одна буква и одна цифра'
  return null
}

export function validateRegister(values: RegisterValues): Errors<RegisterValues> {
  const errors: Errors<RegisterValues> = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Укажите имя'
  else if (name.length > NAME_MAX_LENGTH) errors.name = `Не длиннее ${NAME_MAX_LENGTH} символов`

  const loginErrors = validateLogin(values)
  if (loginErrors.email) errors.email = loginErrors.email

  const problem = passwordProblem(values.password)
  if (!values.password) errors.password = 'Придумайте пароль'
  else if (problem) errors.password = problem

  if (!values.confirm) errors.confirm = 'Повторите пароль'
  else if (values.confirm !== values.password) errors.confirm = 'Пароли не совпадают'
  return errors
}

/** Ошибки сервера, относящиеся к конкретным полям формы (422 и «email уже занят») */
export function serverFieldErrors<T>(error: unknown, fields: (keyof T)[]): Errors<T> {
  if (!(error instanceof ApiError)) return {}
  const result: Errors<T> = {}
  for (const { field, message } of error.fieldErrors) {
    if (fields.includes(field as keyof T)) result[field as keyof T] = message
  }
  if (error.status === 409 && fields.includes('email' as keyof T)) {
    result['email' as keyof T] = error.message
  }
  return result
}
