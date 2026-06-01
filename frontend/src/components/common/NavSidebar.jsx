import { Box, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Chip } from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import CreditScoreIcon from '@mui/icons-material/CreditScore'
import BarChartIcon from '@mui/icons-material/BarChart'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: null },
  { label: 'Lessons', icon: <CalendarMonthIcon />, path: '/lessons', roles: null },
  { label: 'Library', icon: <MenuBookIcon />, path: '/library', roles: null },
  { label: 'Credits', icon: <CreditScoreIcon />, path: '/credits', roles: null },
  { label: 'Users', icon: <PeopleIcon />, path: '/users', roles: ['Admin'] },
  { label: 'Visits', icon: <BarChartIcon />, path: '/visits', roles: ['Admin'] },
]

export default function NavSidebar() {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const visible = NAV_ITEMS.filter((item) => !item.roles || hasRole(...item.roles))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 3 }}>
        <Typography variant="h6" color="primary" sx={{ letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="span" fontWeight={700} sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
          }}>MU</Box>
          <Box component="span" fontWeight={300}>SCHOOL</Box>
        </Typography>
      </Toolbar>

      {user && (
        <Box sx={{ px: 3, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user.first_nm} {user.last_nm}
          </Typography>
          <Chip
            label={user.profile}
            size="small"
            color="primary"
            variant="soft"
            sx={{ mt: 0.5, fontSize: 11 }}
          />
        </Box>
      )}

      <List sx={{ px: 1, flexGrow: 1 }}>
        {visible.map((item) => {
          const active = location.pathname === item.path
          let label = item.label
          if (item.path === '/credits') {
            label = hasRole('Admin') ? 'Student/Credits' : hasRole('Teacher') ? 'Students' : 'Credits'
          }
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                  '&:hover': { bgcolor: '#dce8ff' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 400 }} />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )
}
