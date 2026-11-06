import { useState } from 'react'
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { useSession } from '../../../entities/session/index.ts'
import { useNotify } from '../../../shared/ui/index.ts'

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('') || '?'
  )
}

/** Меню пользователя в шапке: кто вошёл и кнопка выхода */
export function UserMenu() {
  const { user, logout } = useSession()
  const notify = useNotify()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [pending, setPending] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    setPending(true)
    await logout()
    setAnchor(null)
    notify({ message: 'Вы вышли из аккаунта', severity: 'info' })
  }

  return (
    <>
      <Tooltip title={user.email}>
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="Меню пользователя"
          aria-haspopup="menu"
          sx={{ p: 0.5 }}
        >
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', fontSize: 15 }}>
            {initials(user.name)}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 240, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography sx={{ fontWeight: 600 }}>{user.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          {user.role === 'admin' && <Chip size="small" label="Администратор" sx={{ mt: 1 }} />}
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout} disabled={pending}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Выйти
        </MenuItem>
      </Menu>
    </>
  )
}
