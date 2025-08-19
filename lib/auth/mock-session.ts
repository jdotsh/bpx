/**
 * Mock Session Management for Testing
 * No email verification needed - instant access
 */

export interface MockUser {
  id: string
  email: string
  name?: string
  created_at: string
}

export interface MockSession {
  user: MockUser
  access_token: string
  expires_at: number
}

class MockAuth {
  private SESSION_KEY = 'mock_session'

  // Create a session
  createSession(user: MockUser): MockSession {
    const session: MockSession = {
      user,
      access_token: `mock-token-${Date.now()}`,
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session))
    }
    
    return session
  }

  // Get current session
  getSession(): MockSession | null {
    if (typeof window === 'undefined') return null
    
    const stored = localStorage.getItem(this.SESSION_KEY)
    if (!stored) return null
    
    try {
      const session = JSON.parse(stored) as MockSession
      
      // Check if expired
      if (session.expires_at < Date.now()) {
        this.clearSession()
        return null
      }
      
      return session
    } catch {
      return null
    }
  }

  // Get current user
  getUser(): MockUser | null {
    const session = this.getSession()
    return session?.user || null
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.getSession() !== null
  }

  // Clear session (logout)
  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSION_KEY)
    }
  }

  // Mock signup - creates account and logs in immediately
  async signUp(email: string, password: string, name?: string): Promise<MockSession> {
    const user: MockUser = {
      id: `user-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      created_at: new Date().toISOString()
    }
    
    return this.createSession(user)
  }

  // Mock signin
  async signIn(email: string, password: string): Promise<MockSession> {
    const user: MockUser = {
      id: `user-${Date.now()}`,
      email,
      name: email.split('@')[0],
      created_at: new Date().toISOString()
    }
    
    return this.createSession(user)
  }

  // Mock signout
  async signOut(): Promise<void> {
    this.clearSession()
  }
}

// Export singleton instance
export const mockAuth = new MockAuth()

// Hook for React components
export function useMockAuth() {
  return {
    user: mockAuth.getUser(),
    session: mockAuth.getSession(),
    isAuthenticated: mockAuth.isAuthenticated(),
    signUp: mockAuth.signUp.bind(mockAuth),
    signIn: mockAuth.signIn.bind(mockAuth),
    signOut: mockAuth.signOut.bind(mockAuth)
  }
}