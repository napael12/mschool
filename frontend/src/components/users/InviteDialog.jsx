import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem,
} from '@mui/material'

export default function InviteDialog({ open, onClose, onInvite }) {
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState('Student')

  const handleInvite = () => {
    onInvite({ email, profile })
    setEmail('')
    setProfile('Student')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Invite User</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Role"
          select
          fullWidth
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
        >
          <MenuItem value="Teacher">Teacher</MenuItem>
          <MenuItem value="Student">Student</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleInvite} disabled={!email}>
          Send Invite
        </Button>
      </DialogActions>
    </Dialog>
  )
}
