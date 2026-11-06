import { createContext } from 'react'
import type { Credentials, Registration, SessionStatus, User } from './types.ts'

export interface SessionStore {
  status: SessionStatus
  user: User | null
  login: (credentials: Credentials) => Promise<User>
  register: (data: Registration) => Promise<User>
  logout: () => Promise<void>
}

export const SessionContext = createContext<SessionStore | null>(null)
