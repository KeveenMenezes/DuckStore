import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import CatalogPage from './pages/CatalogPage'
import BasketPage from './pages/BasketPage'
import OrdersPage from './pages/OrdersPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Navbar />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<CatalogPage />} />
            <Route path="/basket" element={<BasketPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
