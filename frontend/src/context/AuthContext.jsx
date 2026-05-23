import { createContext, useContext, useState, useEffect } from 'react'
import { TOKEN_KEY, REMEMBER_KEY, getToken, removeToken } from '../api/axiosInstance'
import { login as apiLogin, getMe } from '../api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => removeToken())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password, rememberMe = false) => {
    const data = await apiLogin(email, password, rememberMe)
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(REMEMBER_KEY, '1')
    } else {
      sessionStorage.setItem(TOKEN_KEY, data.access_token)
    }
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    removeToken()
    setUser(null)
  }

  const hasRole = (...roles) => user && roles.includes(user.profile)

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
