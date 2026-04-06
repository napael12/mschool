import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Drawer, Toolbar } from '@mui/material'
import TopBar from '../components/common/TopBar'
import NavSidebar from '../components/common/NavSidebar'

const DRAWER_WIDTH = 270

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopBar drawerWidth={DRAWER_WIDTH} onMenuClick={() => setMobileOpen(true)} />

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        <NavSidebar />
      </Drawer>

      {/* Permanent sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'flex' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            bgcolor: 'background.paper',
            boxShadow: '0 7px 30px 0 rgba(90,114,123,0.11)',
          },
        }}
        open
      >
        <NavSidebar />
      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, ml: { md: `${DRAWER_WIDTH}px` }, p: 3 }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
