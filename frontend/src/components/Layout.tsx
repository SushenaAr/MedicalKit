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

const DRAWER_WIDTH = 248

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Главная', icon: <DashboardIcon /> },
  { to: '/medicines', label: 'Моя аптечка', icon: <MedicationIcon /> },
  { to: '/medicines/new', label: 'Добавить лекарство', icon: <AddIcon /> },
  { to: '/donate', label: 'Отдать до срока', icon: <DonateIcon /> },
  { to: '/shelters', label: 'Приюты', icon: <ShelterIcon /> },
]

function isActive(item: NavItem, pathname: string): boolean {
  // Карточка лекарства /medicines/:id подсвечивает раздел «Моя аптечка»
  if (item.to === '/medicines') {
    return pathname === '/medicines' || (pathname.startsWith('/medicines/') && pathname !== '/medicines/new')
  }
  return matchPath({ path: item.to, end: true }, pathname) !== null
}

export default function Layout() {
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
        Демонстрационные данные. Не является медицинской рекомендацией.
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
            to="/"
            noWrap
            sx={{ color: 'inherit', textDecoration: 'none' }}
          >
            Домашняя аптечка
          </Typography>
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
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
