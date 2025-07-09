import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'
import { SocketEvent } from '@sports-betting/shared'
import { useAuthStore } from './authStore'
import toast from 'react-hot-toast'

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  connectedUsers: number
  notifications: any[]
}

interface SocketActions {
  connect: () => void
  disconnect: () => void
  subscribeToMatch: (matchId: string) => void
  unsubscribeFromMatch: (matchId: string) => void
  emitBetPlacement: (betData: any) => void
  addNotification: (notification: any) => void
  removeNotification: (notificationId: string) => void
  clearNotifications: () => void
}

export const useSocketStore = create<SocketState & SocketActions>((set, get) => ({
  // State
  socket: null,
  isConnected: false,
  connectedUsers: 0,
  notifications: [],

  // Actions
  connect: () => {
    const { token } = useAuthStore.getState()
    if (!token) return

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token,
      },
    })

    socket.on('connect', () => {
      console.log('Connected to server')
      set({ isConnected: true })
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server')
      set({ isConnected: false })
    })

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      set({ isConnected: false })
    })

    // Handle odds updates
    socket.on('odds:update', (event: SocketEvent) => {
      console.log('Odds updated:', event.data)
      // You can update a matches store here or trigger a refetch
      toast.success('Odds updated for this match!')
    })

    // Handle match results
    socket.on('match:result', (event: SocketEvent) => {
      console.log('Match result:', event.data)
      toast.success('Match result is now available!')
    })

    // Handle notifications
    socket.on('notification', (event: SocketEvent) => {
      const notification = {
        id: Date.now().toString(),
        ...event.data,
        timestamp: event.timestamp,
      }
      
      get().addNotification(notification)
      
      // Show toast for important notifications
      if (notification.type === 'bet_result' || notification.type === 'payment') {
        toast.success(notification.message)
      }
    })

    // Handle user count updates
    socket.on('user:count', (count: number) => {
      set({ connectedUsers: count })
    })

    set({ socket })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null, isConnected: false })
    }
  },

  subscribeToMatch: (matchId: string) => {
    const { socket } = get()
    if (socket && socket.connected) {
      socket.emit('odds:subscribe', matchId)
    }
  },

  unsubscribeFromMatch: (matchId: string) => {
    const { socket } = get()
    if (socket && socket.connected) {
      socket.emit('odds:unsubscribe', matchId)
    }
  },

  emitBetPlacement: (betData: any) => {
    const { socket } = get()
    if (socket && socket.connected) {
      socket.emit('bet:place', betData)
    }
  },

  addNotification: (notification: any) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50 notifications
    }))
  },

  removeNotification: (notificationId: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
    }))
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },
})