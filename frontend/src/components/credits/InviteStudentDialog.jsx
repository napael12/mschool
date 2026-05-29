import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert, Grid,
} from '@mui/material'
import { inviteUser } from '../../api/usersApi'

export default function InviteStudentDialog({ open, onClose, onInvited }) {
  const [form, setForm] = useState({ email: '', first_nm: '', last_nm: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setForm({ email: '', first_nm: '', last_nm: '' }); setError('') }
  }, [open])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.email.trim()) { setError('Email is required.'); return }
    setSaving(true)
    try {
      const res = await inviteUser({ email: form.email.trim().toLowerCase(), first_nm: form.first_nm, last_nm: form.last_nm, profile: 'Student' })
      onInvited(res.message)
    } catch (err) {
      setError(err.response?.data?.error || 'Error sending invite.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Invite Student</DialogTitle>
      <DialogContent sx={{ pt: 3, overflow: 'visible' }}>
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
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Sending...' : 'Send Invite'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
