import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { onSessionExpired, onTokensRefreshed, setAccessToken } from '../../../shared/api/index.ts'
import { useNotify } from '../../../shared/ui/index.ts'
import { sessionApi, userFromDto } from '../api/sessionApi.ts'
import { SessionContext, type SessionStore } from './context.ts'
import type { SessionStatus, User } from './types.ts'

// Вкладки одного браузера сообщают друг другу о входе и выходе
const CHANNEL_NAME = 'medicalkit-session'
type SessionMessage = { type: 'login' } | { type: 'logout' }

function openChannel(): BroadcastChannel | null {
  return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME)
}

/**
 * Состояние входа пользователя.
 * При запуске пытается восстановить сессию по refresh-cookie; пока идёт проверка — статус `checking`.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const notify = useNotify()
  const [status, setStatus] = useState<SessionStatus>('checking')
  const [user, setUser] = useState<User | null>(null)
  const channel = useRef<BroadcastChannel | null>(null)

  const signIn = useCallback((next: User) => {
    setUser(next)
    setStatus('authenticated')
  }, [])

  const signOut = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setStatus('anonymous')
  }, [])

  const restore = useCallback(() => {
    let cancelled = false
    sessionApi.restore().then(
      (restored) => !cancelled && signIn(restored),
      () => !cancelled && signOut(),
    )
    return () => {
      cancelled = true
    }
  }, [signIn, signOut])

  // Восстановление сессии после перезагрузки страницы
  useEffect(() => restore(), [restore])

  // Refresh-токен отклонён во время работы (истёк, отозван выходом на другом устройстве и т. п.)
  useEffect(
    () =>
      onSessionExpired(() => {
        signOut()
        notify({ message: 'Сессия истекла. Войдите снова', severity: 'warning' })
      }),
    [signOut, notify],
  )

  // Вместе с новыми токенами приходят актуальные данные пользователя
  useEffect(() => onTokensRefreshed((data) => setUser(userFromDto(data.user))), [])

  const statusRef = useRef(status)
  statusRef.current = status

  useEffect(() => {
    channel.current = openChannel()
    if (!channel.current) return
    channel.current.onmessage = (event: MessageEvent<SessionMessage>) => {
      if (event.data.type === 'logout') signOut()
      if (event.data.type === 'login' && statusRef.current === 'anonymous') restore()
    }
    return () => {
      channel.current?.close()
      channel.current = null
    }
  }, [signOut, restore])

  const store = useMemo<SessionStore>(
    () => ({
      status,
      user,
      login: async (credentials) => {
        const next = await sessionApi.login(credentials)
        signIn(next)
        channel.current?.postMessage({ type: 'login' } satisfies SessionMessage)
        return next
      },
      register: async (data) => {
        const next = await sessionApi.register(data)
        signIn(next)
        channel.current?.postMessage({ type: 'login' } satisfies SessionMessage)
        return next
      },
      logout: async () => {
        try {
          await sessionApi.logout()
        } catch {
          // Сервер недоступен — всё равно выходим на клиенте; refresh-токен истечёт сам
        }
        signOut()
        channel.current?.postMessage({ type: 'logout' } satisfies SessionMessage)
      },
    }),
    [status, user, signIn, signOut],
  )

  return <SessionContext.Provider value={store}>{children}</SessionContext.Provider>
}
