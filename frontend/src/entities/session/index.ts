// Публичный API сущности «Сессия»: текущий пользователь, вход, регистрация и выход
export type { Credentials, Registration, SessionStatus, User, UserRole } from './model/types.ts'
export { SessionProvider } from './model/SessionProvider.tsx'
export { useSession } from './model/useSession.ts'
