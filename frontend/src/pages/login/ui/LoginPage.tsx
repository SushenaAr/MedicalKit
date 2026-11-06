import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Link, Typography } from '@mui/material'
import { LoginForm } from '../../../features/auth/index.ts'
import { routes } from '../../../shared/config/routes.ts'
import { AuthCard } from '../../../shared/ui/index.ts'

interface LoginPageProps {
  /** Куда перейти после входа */
  redirectTo: string
}

export function LoginPage({ redirectTo }: LoginPageProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <AuthCard
      title="Вход"
      subtitle="Войдите, чтобы увидеть свою аптечку"
      footer={
        <Typography variant="body2">
          Нет аккаунта?{' '}
          <Link component={RouterLink} to={routes.register()} state={location.state}>
            Зарегистрироваться
          </Link>
        </Typography>
      }
    >
      <LoginForm onSuccess={() => navigate(redirectTo, { replace: true })} />
      {import.meta.env.DEV && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Демо-аккаунт: <b>demo@example.com</b> / <b>Demo12345</b>
          <br />
          Создаётся командой <code>python -m app.seed</code>
        </Alert>
      )}
    </AuthCard>
  )
}
