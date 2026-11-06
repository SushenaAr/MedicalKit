export interface FieldError {
  field: string
  message: string
}

/** Ошибка ответа API с сообщением, которое можно показать пользователю */
export class ApiError extends Error {
  readonly status: number
  /** Машиночитаемый код ошибки из ответа (например, `token_expired`) */
  readonly code: string | null
  /** Ошибки отдельных полей из ответа 422 */
  readonly fieldErrors: FieldError[]

  constructor(message: string, status: number, code: string | null = null, fieldErrors: FieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export const NETWORK_ERROR_MESSAGE =
  'Не удалось связаться с сервером. Проверьте, что backend запущен, и попробуйте ещё раз.'

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const [first] = error.fieldErrors
    return first ? `${error.message}: ${first.message}` : error.message
  }
  return NETWORK_ERROR_MESSAGE
}
