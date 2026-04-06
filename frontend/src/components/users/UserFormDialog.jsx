import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid,
} from '@mui/material'

const PROFILES = ['Admin', 'Teacher', 'Student']

const empty = { email: '', first_nm: '', last_nm: '', phone: '', profile: 'Student' }

export default function UserFormDialog({ open, user, onClose, onSave }) {
  const [form, setForm] = useState(empty)

  useEffect(() => {
    setForm(user ? { ...user } : empty)
  }, [user, open])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{user ? 'Edit User' : 'Add User'}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField label="First Name" fullWidth value={form.first_nm || ''} onChange={set('first_nm')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Last Name" fullWidth value={form.last_nm || ''} onChange={set('last_nm')} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Email" type="email" fullWidth required value={form.email || ''} onChange={set('email')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Phone" fullWidth value={form.phone || ''} onChange={set('phone')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Role" select fullWidth required value={form.profile || 'Student'} onChange={set('profile')}>
              {PROFILES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(form)} disabled={!form.email || !form.profile}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
