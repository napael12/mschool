import { useState, useMemo } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, InputAdornment, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Alert,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'

const RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character (!@#$%^&*…)', test: (p) => /[!@#$%^&*(),.?":{}|<>\[\]\-_=+~`/\\]/.test(p) },
]

export default function AdminResetPasswordDialog({ open, user, onClose, onSave }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const allRulesMet = useMemo(() => RULES.every(({ test }) => test(password)), [password])
  const passwordsMatch = password === confirm

  const handleClose = () => {
    setPassword('')
    setConfirm('')
    setError('')
    setShowPw(false)
    setShowConfirm(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!allRulesMet || !passwordsMatch) return
    setError('')
    setLoading(true)
    try {
      await onSave(password)
      handleClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  const name = [user?.first_nm, user?.last_nm].filter(Boolean).join(' ') || user?.email

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Set Password — {name}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          label="New Password"
          type={showPw ? 'text' : 'password'}
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 1 }}
          autoFocus
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPw((v) => !v)} edge="end">
                  {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {password.length > 0 && (
          <List dense disablePadding sx={{ mb: 1 }}>
            {RULES.map(({ label, test }) => {
              const ok = test(password)
              return (
                <ListItem key={label} disablePadding sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {ok
                      ? <CheckCircleOutlineIcon fontSize="small" color="success" />
                      : <RadioButtonUncheckedIcon fontSize="small" color="disabled" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{ variant: 'caption', color: ok ? 'success.main' : 'text.secondary' }}
                  />
                </ListItem>
              )
            })}
          </List>
        )}

        <TextField
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          fullWidth
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          sx={{ mt: 1 }}
          error={confirm.length > 0 && !passwordsMatch}
          helperText={confirm.length > 0 && !passwordsMatch ? 'Passwords do not match' : ''}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end">
                  {showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !allRulesMet || !passwordsMatch || !confirm}
        >
          Set Password
        </Button>
      </DialogActions>
    </Dialog>
  )
}
