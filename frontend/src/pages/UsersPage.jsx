import { useEffect, useState } from 'react'
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Avatar, Chip, IconButton, Button, TextField, InputAdornment,
  CircularProgress, Snackbar, Alert,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import SearchIcon from '@mui/icons-material/Search'
import { listUsers, createUser, updateUser, deleteUser, inviteUser } from '../api/usersApi'
import ConfirmDialog from '../components/common/ConfirmDialog'
import UserFormDialog from '../components/users/UserFormDialog'
import InviteDialog from '../components/users/InviteDialog'

const ROLE_COLORS = { Admin: 'error', Teacher: 'primary', Student: 'success' }

function initials(u) {
  return [u.first_nm?.[0], u.last_nm?.[0]].filter(Boolean).join('') || '?'
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [snack, setSnack] = useState(null)

  const load = () => listUsers().then(setUsers).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      (u.first_nm || '').toLowerCase().includes(q) ||
      (u.last_nm || '').toLowerCase().includes(q)
    )
  })

  const handleSave = async (data) => {
    try {
      if (editUser) {
        await updateUser(editUser.user_id, data)
        setSnack({ severity: 'success', message: 'User updated.' })
      } else {
        await createUser(data)
        setSnack({ severity: 'success', message: 'User created.' })
      }
      setFormOpen(false)
      setEditUser(null)
      load()
    } catch (err) {
      setSnack({ severity: 'error', message: err.response?.data?.error || 'Error saving user.' })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteUser(deleteTarget.user_id)
      setSnack({ severity: 'success', message: 'User deleted.' })
      setDeleteTarget(null)
      load()
    } catch {
      setSnack({ severity: 'error', message: 'Error deleting user.' })
    }
  }

  const handleInvite = async (data) => {
    try {
      await inviteUser(data)
      setSnack({ severity: 'success', message: `Invite sent to ${data.email}` })
      setInviteOpen(false)
      load()
    } catch (err) {
      setSnack({ severity: 'error', message: err.response?.data?.error || 'Error sending invite.' })
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Users</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={() => setInviteOpen(true)}
          >
            Invite
          </Button>
          <Button
            variant="contained"
            onClick={() => { setEditUser(null); setFormOpen(true) }}
          >
            + Add User
          </Button>
        </Box>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.user_id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 13 }}>
                          {initials(u)}
                        </Avatar>
                        {u.first_nm} {u.last_nm}
                      </Box>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.profile}
                        size="small"
                        color={ROLE_COLORS[u.profile] || 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => { setEditUser(u); setFormOpen(true) }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(u)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <UserFormDialog
        open={formOpen}
        user={editUser}
        onClose={() => { setFormOpen(false); setEditUser(null) }}
        onSave={handleSave}
      />

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete User"
        message={`Delete ${deleteTarget?.first_nm} ${deleteTarget?.last_nm}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack && <Alert severity={snack.severity}>{snack.message}</Alert>}
      </Snackbar>
    </Box>
  )
}
