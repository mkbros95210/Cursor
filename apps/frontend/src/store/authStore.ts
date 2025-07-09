import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@sports-betting/shared'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  initializeAuth: () => void
  updateUser: (userData: Partial<User>) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          const response = await authService.login(email, password)
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            })
            toast.success('Login successful!')
          } else {
            throw new Error(response.message)
          }
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Login failed')
          throw error
        }
      },

      register: async (userData: any) => {
        try {
          set({ isLoading: true })
          const response = await authService.register(userData)
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            })
            toast.success('Registration successful!')
          } else {
            throw new Error(response.message)
          }
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Registration failed')
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        toast.success('Logged out successfully')
      },

      refreshToken: async () => {
        try {
          const { token } = get()
          if (!token) return

          const response = await authService.refreshToken()
          
          if (response.success && response.data) {
            set({ token: response.data.token })
          } else {
            // Token refresh failed, logout user
            get().logout()
          }
        } catch (error) {
          // Token refresh failed, logout user
          get().logout()
        }
      },

      initializeAuth: () => {
        const { token } = get()
        if (token) {
          // Verify token is still valid
          authService.getCurrentUser()
            .then((response) => {
              if (response.success && response.data) {
                set({
                  user: response.data,
                  isAuthenticated: true,
                })
              } else {
                get().logout()
              }
            })
            .catch(() => {
              get().logout()
            })
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...userData } })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)