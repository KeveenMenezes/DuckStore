import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
  CognitoRefreshToken,
} from 'amazon-cognito-identity-js'

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
})

export interface AuthTokens {
  idToken: string
  accessToken: string
  refreshToken: string
  expiresAt: number
}

/** Sign in and return tokens. */
export function signIn(username: string, password: string): Promise<AuthTokens> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: username, Pool: userPool })
    const authDetails = new AuthenticationDetails({ Username: username, Password: password })

    user.authenticateUser(authDetails, {
      onSuccess(session) {
        resolve(tokensFromSession(session))
      },
      onFailure(err) {
        reject(err as Error)
      },
    })
  })
}

/** Refresh an existing session using the stored refresh token. */
export function refreshSession(username: string, refreshTokenValue: string): Promise<AuthTokens> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: username, Pool: userPool })
    const refreshToken = new CognitoRefreshToken({ RefreshToken: refreshTokenValue })

    user.refreshSession(refreshToken, (err, session: CognitoUserSession) => {
      if (err) {
        reject(err as Error)
      } else {
        resolve(tokensFromSession(session))
      }
    })
  })
}

/** Sign out the currently authenticated user (local sign-out). */
export function signOut(): void {
  const user = userPool.getCurrentUser()
  if (user) {
    user.signOut()
  }
}

/** Return the current session from local storage, or null if not signed in. */
export function getCurrentSession(): Promise<AuthTokens | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser()
    if (!user) {
      resolve(null)
      return
    }
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        resolve(null)
      } else {
        resolve(tokensFromSession(session))
      }
    })
  })
}

function tokensFromSession(session: CognitoUserSession): AuthTokens {
  return {
    idToken: session.getIdToken().getJwtToken(),
    accessToken: session.getAccessToken().getJwtToken(),
    refreshToken: session.getRefreshToken().getToken(),
    expiresAt: session.getIdToken().getExpiration() * 1000,
  }
}
