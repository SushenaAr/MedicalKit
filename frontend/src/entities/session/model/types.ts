export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

/** checking — при запуске проверяем, есть ли действующая сессия (refresh-cookie) */
export type SessionStatus = 'checking' | 'authenticated' | 'anonymous'

export interface Credentials {
  email: string
  password: string
}

export interface Registration extends Credentials {
  name: string
}
