import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { DrawerProvider } from './context/DrawerContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import GlobalUploadDrawer from './components/GlobalUploadDrawer'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import DatasetList from './pages/DatasetList'
import DatasetDetail from './pages/DatasetDetail'
import Dashboard from './pages/Dashboard'
import EditProfile from './pages/EditProfile'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <DrawerProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Navbar />
          <GlobalUploadDrawer />
          <main>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/datasets" element={<DatasetList />} />
              <Route path="/datasets/:id" element={<DatasetDetail />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </DrawerProvider>
    </AuthProvider>
  )
}