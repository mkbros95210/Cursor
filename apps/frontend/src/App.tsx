import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useSocketStore } from './store/socketStore'

// Layout components
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MatchesPage from './pages/MatchesPage'
import MatchDetailPage from './pages/MatchDetailPage'
import BettingPage from './pages/BettingPage'
import ProfilePage from './pages/ProfilePage'
import WalletPage from './pages/WalletPage'
import BetHistoryPage from './pages/BetHistoryPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const { initializeAuth, user } = useAuthStore()
  const { connect, disconnect } = useSocketStore()

  useEffect(() => {
    // Initialize authentication on app start
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    // Connect to WebSocket when user is authenticated
    if (user) {
      connect()
    } else {
      disconnect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [user, connect, disconnect])

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="matches" element={<MatchesPage />} />
          <Route path="matches/:id" element={<MatchDetailPage />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="betting" element={<BettingPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="bets" element={<BetHistoryPage />} />
          </Route>
        </Route>

        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App