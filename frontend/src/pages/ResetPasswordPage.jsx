import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton, Link,
  List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { resetPassword } from '../api/authApi'

const RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character (!@#$%^&*…)', test: (p) => /[!@#$%^&*(),.?":{}|<>\[\]\-_=+~`/\\]/.test(p) },
]

function PasswordStrengthChecklist({ password }) {
  if (!password) return null
  return (
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
  )
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const allRulesMet = useMemo(() => RULES.every(({ test }) => test(password)), [password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!allRulesMet) {
      setError('Please meet all password requirements.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      const msg = err.response?.data?.error
      setError(msg || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Card sx={{ width: '100%', maxWidth: 420, mx: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }}>Invalid or missing reset token.</Alert>
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              Request a new reset link
            </Link>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Reset Password
          </Typography>

          {done ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your password has been updated. You can now sign in with your new password.
              </Alert>
              <Button variant="contained" fullWidth onClick={() => navigate('/sign-in')}>
                Go to Sign In
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Choose a strong new password for your account.
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  label="New Password"
                  type={showPw ? 'text' : 'password'}
                  fullWidth
                  required
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

                <PasswordStrengthChecklist password={password} />

                <TextField
                  label="Confirm Password"
                  type={showConfirm ? 'text' : 'password'}
                  fullWidth
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  sx={{ mb: 3, mt: 1 }}
                  error={confirm.length > 0 && confirm !== password}
                  helperText={confirm.length > 0 && confirm !== password ? 'Passwords do not match' : ''}
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

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading || !allRulesMet || password !== confirm}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Set New Password'}
                </Button>
              </Box>

              <Box mt={2} textAlign="center">
                <Link component={RouterLink} to="/sign-in" variant="body2">
                  Back to Sign In
                </Link>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
