import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { Link, Typography } from '@mui/material'
import { RegisterForm } from '../../../features/auth/index.ts'
import { routes } from '../../../shared/config/routes.ts'
import { AuthCard, useNotify } from '../../../shared/ui/index.ts'

interface RegisterPageProps {
  redirectTo: string
}

export function RegisterPage({ redirectTo }: RegisterPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const notify = useNotify()

  return (
    <AuthCard
      title="Регистрация"
      subtitle="Аптечка будет доступна только вам"
      footer={
        <Typography variant="body2">
          Уже есть аккаунт?{' '}
          <Link component={RouterLink} to={routes.login()} state={location.state}>
            Войти
          </Link>
        </Typography>
      }
    >
      <RegisterForm
        onSuccess={(user) => {
          notify({ message: `Добро пожаловать, ${user.name}!`, severity: 'success' })
          navigate(redirectTo, { replace: true })
        }}
      />
    </AuthCard>
  )
}
