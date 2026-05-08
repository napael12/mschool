import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Link,
} from '@mui/material'
import { forgotPassword } from '../api/authApi'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setSubmitted(true)
    } catch (err) {
      const msg = err.response?.data?.error
      setError(msg || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
            Forgot Password
          </Typography>

          {submitted ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                If that email is registered you will receive a reset link shortly. Check your inbox.
              </Alert>
              <Link component={RouterLink} to="/sign-in" variant="body2">
                Back to Sign In
              </Link>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Enter your email address and we'll send you a link to reset your password.
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ mb: 3 }}
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Link'}
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
