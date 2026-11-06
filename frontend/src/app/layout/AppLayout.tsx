import { useState, type ReactNode } from 'react'
import { Link, Outlet, matchPath, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined'
import MedicationIcon from '@mui/icons-material/MedicationOutlined'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import DonateIcon from '@mui/icons-material/VolunteerActivismOutlined'
import ShelterIcon from '@mui/icons-material/HomeWorkOutlined'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import { routes } from '../../shared/config/routes.ts'
import { UserMenu } from '../../features/auth/index.ts'
import { Appear } from '../../shared/ui/index.ts'

const DRAWER_WIDTH = 248

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { to: routes.dashboard(), label: 'Главная', icon: <DashboardIcon /> },
  { to: routes.medicines(), label: 'Моя аптечка', icon: <MedicationIcon /> },
  { to: routes.newMedicine(), label: 'Добавить лекарство', icon: <AddIcon /> },
  { to: routes.donate(), label: 'Отдать до срока', icon: <DonateIcon /> },
  { to: routes.shelters(), label: 'Приюты', icon: <ShelterIcon /> },
]

function isActive(item: NavItem, pathname: string): boolean {
  // Карточка лекарства и её редактирование (/medicines/:id…) подсвечивают раздел «Моя аптечка»
  if (item.to === routes.medicines()) {
    return pathname.startsWith(routes.medicines()) && pathname !== routes.newMedicine()
  }
  return matchPath({ path: item.to, end: true }, pathname) !== null
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  const navigation = (
    <Box>
      <Toolbar />
      <List sx={{ px: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.to}
            component={Link}
            to={item.to}
            selected={isActive(item, pathname)}
            onClick={() => setMobileOpen(false)}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ mx: 2 }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', p: 2 }}>
        Учебный проект. Не является медицинской рекомендацией.
      </Typography>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Открыть меню"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <LocalPharmacyIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component={Link}
            to={routes.dashboard()}
            noWrap
            sx={{ color: 'inherit', textDecoration: 'none' }}
          >
            Домашняя аптечка
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <UserMenu />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {navigation}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {navigation}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, py: { xs: 2, md: 4 } }}>
        <Toolbar />
        <Container maxWidth="lg">
          {/* Плавный переход между страницами: при смене адреса содержимое появляется заново */}
          <Appear key={pathname}>
            <Outlet />
          </Appear>
        </Container>
      </Box>
    </Box>
  )
}
