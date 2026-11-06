import {
  refreshTokens,
  request,
  setAccessToken,
  type AuthUserDto,
  type TokenResponseDto,
} from '../../../shared/api/index.ts'
import type { Credentials, Registration, User } from '../model/types.ts'

export function userFromDto(dto: AuthUserDto): User {
  return { id: String(dto.id), email: dto.email, name: dto.name, role: dto.role }
}

function startSession(data: TokenResponseDto): User {
  setAccessToken(data.access_token)
  return userFromDto(data.user)
}

export const sessionApi = {
  login: async (credentials: Credentials): Promise<User> =>
    startSession(
      await request<TokenResponseDto>('/auth/login', { method: 'POST', body: credentials, auth: false }),
    ),

  register: async (data: Registration): Promise<User> =>
    startSession(
      await request<TokenResponseDto>('/auth/register', { method: 'POST', body: data, auth: false }),
    ),

  /** Восстановить сессию после перезагрузки страницы по refresh-токену из httpOnly-cookie */
  restore: async (): Promise<User> => startSession(await refreshTokens()),

  /** Отозвать refresh-токены сессии на сервере и забыть access-токен */
  logout: async (): Promise<void> => {
    try {
      await request<void>('/auth/logout', { method: 'POST', auth: false })
    } finally {
      // Даже если сервер недоступен, на клиенте пользователь выходит
      setAccessToken(null)
    }
  },
}
