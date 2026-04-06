import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Alert,
} from '@mui/material'
import { updateProfile } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'

export default function ProfileDialog({ open, onClose }) {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ first_nm: '', last_nm: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && open) {
      setForm({
        first_nm: user.first_nm || '',
        last_nm: user.last_nm || '',
        email: user.email || '',
        phone: user.phone || '',
      })
      setError('')
    }
  }, [user, open])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.email.trim()) { setError('Email is required.'); return }
    setSaving(true)
    try {
      const updated = await updateProfile(form)
      setUser(updated)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField label="First Name" fullWidth value={form.first_nm} onChange={set('first_nm')} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Last Name" fullWidth value={form.last_nm} onChange={set('last_nm')} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Email" type="email" fullWidth required value={form.email} onChange={set('email')} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Phone" fullWidth value={form.phone} onChange={set('phone')} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
