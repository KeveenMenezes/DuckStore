import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  signIn,
  signOut,
  refreshSession,
  getCurrentSession,
  type AuthTokens,
} from './cognitoService'

const TOKEN_STORAGE_KEY = 'duckstore_auth'

interface StoredAuth {
  username: string
  tokens: AuthTokens
}

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  username: string | null
  idToken: string | null
  accessToken: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredAuth) : null
  } catch {
    return null
  }
}

function saveAuth(data: StoredAuth): void {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(data))
}

function clearAuth(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [storedAuth, setStoredAuth] = useState<StoredAuth | null>(null)

  // Initialise from Cognito local storage on mount
  useEffect(() => {
    void (async () => {
      try {
        const session = await getCurrentSession()
        if (session) {
          const cached = loadStoredAuth()
          const username = cached?.username ?? ''
          const auth: StoredAuth = { username, tokens: session }
          setStoredAuth(auth)
          saveAuth(auth)
        }
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  // Proactively refresh the token 60 s before expiry
  useEffect(() => {
    if (!storedAuth) return

    const msUntilExpiry = storedAuth.tokens.expiresAt - Date.now()
    const msUntilRefresh = msUntilExpiry - 60_000

    if (msUntilRefresh <= 0) return

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const newTokens = await refreshSession(
            storedAuth.username,
            storedAuth.tokens.refreshToken,
          )
          const updated: StoredAuth = { username: storedAuth.username, tokens: newTokens }
          setStoredAuth(updated)
          saveAuth(updated)
        } catch {
          // Refresh failed — force re-login
          clearAuth()
          setStoredAuth(null)
        }
      })()
    }, msUntilRefresh)

    return () => clearTimeout(timer)
  }, [storedAuth])

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await signIn(username, password)
    const auth: StoredAuth = { username, tokens }
    setStoredAuth(auth)
    saveAuth(auth)
  }, [])

  const logout = useCallback(() => {
    signOut()
    clearAuth()
    setStoredAuth(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: storedAuth !== null,
        isLoading,
        username: storedAuth?.username ?? null,
        idToken: storedAuth?.tokens.idToken ?? null,
        accessToken: storedAuth?.tokens.accessToken ?? null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
