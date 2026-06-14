import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import Report from './pages/Report'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
        <Route path="/report" element={<PrivateRoute><Report /></PrivateRoute>} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}