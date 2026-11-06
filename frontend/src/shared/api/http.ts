// HTTP-клиент API.
//
// Access-токен (JWT, ~15 минут) хранится только в памяти вкладки: его не прочитать из localStorage
// при XSS, и он пропадает при закрытии вкладки. Refresh-токен лежит в httpOnly-cookie, которую
// JavaScript не видит вовсе: браузер сам отправляет её на /api/auth/refresh.
//
// Если защищённый запрос получил 401, клиент один раз обновляет access-токен и повторяет запрос.
// Одновременные запросы ждут одно и то же обновление, чтобы не обменивать refresh-токен дважды.

import { ApiError, NETWORK_ERROR_MESSAGE, type FieldError } from './errors.ts'

const API_BASE = '/api'

export interface AuthUserDto {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
  created_at: string
}

export interface TokenResponseDto {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  user: AuthUserDto
}

let accessToken: string | null = null
let refreshInFlight: Promise<TokenResponseDto> | null = null
const sessionExpiredListeners = new Set<() => void>()
const tokenListeners = new Set<(data: TokenResponseDto) => void>()

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function hasAccessToken(): boolean {
  return accessToken !== null
}

/** Подписка на окончание сессии: refresh-токен отклонён, пользователь должен войти снова */
export function onSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

/** Подписка на получение новых токенов (вместе с ними приходят актуальные данные пользователя) */
export function onTokensRefreshed(listener: (data: TokenResponseDto) => void): () => void {
  tokenListeners.add(listener)
  return () => tokenListeners.delete(listener)
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Добавить access-токен и обновлять его при 401 (по умолчанию — да) */
  auth?: boolean
}

async function parseError(response: Response): Promise<ApiError> {
  let detail = `Ошибка сервера (${response.status})`
  let code: string | null = null
  let fieldErrors: FieldError[] = []
  try {
    const data = await response.json()
    if (typeof data?.detail === 'string') detail = data.detail
    if (typeof data?.code === 'string') code = data.code
    if (Array.isArray(data?.errors)) fieldErrors = data.errors
  } catch {
    // тело не JSON — оставляем общее сообщение
  }
  return new ApiError(detail, response.status, code, fieldErrors)
}

async function send(path: string, { method = 'GET', body, auth = true }: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`
  try {
    return await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // cookie с refresh-токеном нужна только эндпоинтам /api/auth
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0, 'network_error')
  }
}

async function readBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function doRefresh(): Promise<TokenResponseDto> {
  let response = await send('/auth/refresh', { method: 'POST', auth: false })
  if (response.status === 401) {
    const error = await parseError(response)
    // Другая вкладка только что обменяла этот же токен: новый уже в cookie, пробуем ещё раз
    if (error.code !== 'refresh_token_rotated') throw error
    await new Promise((resolve) => setTimeout(resolve, 300))
    response = await send('/auth/refresh', { method: 'POST', auth: false })
  }
  if (!response.ok) throw await parseError(response)
  const data = await readBody<TokenResponseDto>(response)
  accessToken = data.access_token
  tokenListeners.forEach((listener) => listener(data))
  return data
}

/** Обновить access-токен по refresh-токену из cookie. Одновременные вызовы разделяют один запрос. */
export function refreshTokens(): Promise<TokenResponseDto> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

/** Запрос к API. Ошибки — `ApiError` с сообщением с сервера. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth ?? true
  let response = await send(path, options)

  if (response.status === 401 && auth) {
    try {
      await refreshTokens()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        accessToken = null
        sessionExpiredListeners.forEach((listener) => listener())
        throw new ApiError('Сессия истекла. Войдите снова', 401, 'session_expired')
      }
      throw error
    }
    response = await send(path, options)
  }

  if (!response.ok) throw await parseError(response)
  return readBody<T>(response)
}
