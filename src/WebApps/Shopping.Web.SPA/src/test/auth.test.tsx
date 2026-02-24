import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '../auth/AuthContext'
import * as cognitoService from '../auth/cognitoService'

// ── helpers ─────────────────────────────────────────────────────────────────

function makeTokens(expiresInMs = 3_600_000) {
  return {
    idToken: 'id.token.value',
    accessToken: 'access.token.value',
    refreshToken: 'refresh.token.value',
    expiresAt: Date.now() + expiresInMs,
  }
}

// A minimal component that displays auth state for testing
function AuthDisplay() {
  const { isAuthenticated, username, idToken, isLoading } = useAuth()
  if (isLoading) return <p>loading</p>
  return (
    <div>
      <p data-testid="status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</p>
      <p data-testid="username">{username ?? 'none'}</p>
      <p data-testid="idToken">{idToken ?? 'none'}</p>
    </div>
  )
}

function LoginButton() {
  const { login } = useAuth()
  const handleClick = () => {
    login('testuser', 'password').catch(() => {
      // error is intentional in failure tests
    })
  }
  return <button onClick={handleClick}>Login</button>
}

function LogoutButton() {
  const { logout } = useAuth()
  return <button onClick={logout}>Logout</button>
}

// ── mocks ────────────────────────────────────────────────────────────────────

vi.mock('../auth/cognitoService', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  refreshSession: vi.fn(),
  getCurrentSession: vi.fn(),
}))

// ── tests ────────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    // Default: no existing session
    vi.mocked(cognitoService.getCurrentSession).mockResolvedValue(null)
  })

  it('starts unauthenticated when there is no existing session', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthDisplay />
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    expect(screen.getByTestId('username')).toHaveTextContent('none')
  })

  it('restores session from Cognito local storage on mount', async () => {
    const tokens = makeTokens()
    vi.mocked(cognitoService.getCurrentSession).mockResolvedValue(tokens)
    // Seed sessionStorage with a username so it can be restored
    sessionStorage.setItem(
      'duckstore_auth',
      JSON.stringify({ username: 'storeduser', tokens }),
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthDisplay />
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('username')).toHaveTextContent('storeduser')
    expect(screen.getByTestId('idToken')).toHaveTextContent('id.token.value')
  })

  it('sets authenticated state after successful login', async () => {
    const tokens = makeTokens()
    vi.mocked(cognitoService.signIn).mockResolvedValue(tokens)

    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthDisplay />
          <LoginButton />
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('idToken')).toHaveTextContent('id.token.value')
    expect(cognitoService.signIn).toHaveBeenCalledWith('testuser', 'password')
  })

  it('remains unauthenticated when login fails', async () => {
    vi.mocked(cognitoService.signIn).mockRejectedValue(new Error('Incorrect username or password'))

    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthDisplay />
          <LoginButton />
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    // Should remain unauthenticated after failed login
    await waitFor(() => expect(cognitoService.signIn).toHaveBeenCalled())
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
  })

  it('clears authentication state on logout', async () => {
    const tokens = makeTokens()
    vi.mocked(cognitoService.signIn).mockResolvedValue(tokens)

    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthDisplay />
          <LoginButton />
          <LogoutButton />
        </AuthProvider>
      </MemoryRouter>,
    )

    // Log in first
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    // Then log out
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    expect(cognitoService.signOut).toHaveBeenCalled()
  })

  it('persists tokens to sessionStorage on login', async () => {
    const tokens = makeTokens()
    vi.mocked(cognitoService.signIn).mockResolvedValue(tokens)

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => expect(cognitoService.signIn).toHaveBeenCalled())

    const stored = sessionStorage.getItem('duckstore_auth')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!) as { username: string; tokens: typeof tokens }
    expect(parsed.username).toBe('testuser')
    expect(parsed.tokens.idToken).toBe('id.token.value')
  })

  it('clears sessionStorage on logout', async () => {
    const tokens = makeTokens()
    vi.mocked(cognitoService.signIn).mockResolvedValue(tokens)

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginButton />
          <LogoutButton />
        </AuthProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => expect(cognitoService.signIn).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    expect(sessionStorage.getItem('duckstore_auth')).toBeNull()
  })
})

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    vi.mocked(cognitoService.getCurrentSession).mockResolvedValue(null)
  })

  it('redirects unauthenticated users to /login', async () => {
    const { default: ProtectedRoute } = await import('../components/ProtectedRoute')

    render(
      <MemoryRouter initialEntries={['/basket']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<p>Login page</p>} />
            <Route
              path="/basket"
              element={
                <ProtectedRoute>
                  <p>Basket page</p>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument())
    expect(screen.queryByText('Basket page')).not.toBeInTheDocument()
  })

  it('renders protected content for authenticated users', async () => {
    const tokens = makeTokens()
    vi.mocked(cognitoService.getCurrentSession).mockResolvedValue(tokens)
    sessionStorage.setItem(
      'duckstore_auth',
      JSON.stringify({ username: 'testuser', tokens }),
    )

    const { default: ProtectedRoute } = await import('../components/ProtectedRoute')

    render(
      <MemoryRouter initialEntries={['/basket']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<p>Login page</p>} />
            <Route
              path="/basket"
              element={
                <ProtectedRoute>
                  <p>Basket page</p>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Basket page')).toBeInTheDocument())
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })
})
