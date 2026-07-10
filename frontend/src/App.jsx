import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { DrawerProvider } from './context/DrawerContext'
import Navbar from './components/Navbar'
import AppLayout from './components/AppLayout'
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
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/AdminDashboard'

// Pages qui utilisent le layout global avec sidebar
function WithLayout({ children }) {
  return <AppLayout>{children}</AppLayout>
}

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
              {/* Landing & auth : pas de sidebar */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Pages avec sidebar gauche */}
              <Route path="/datasets" element={
                <WithLayout><DatasetList /></WithLayout>
              } />
              <Route path="/datasets/:id" element={
                <WithLayout><DatasetDetail /></WithLayout>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <WithLayout><Dashboard /></WithLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile/edit" element={
                <ProtectedRoute>
                  <WithLayout><EditProfile /></WithLayout>
                </ProtectedRoute>
              } />

              {/* Admin */}
              <Route path="/admin" element={
                <AdminRoute>
                  <WithLayout><AdminDashboard /></WithLayout>
                </AdminRoute>
              } />

              {/* Catch-all : toujours en dernier */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </DrawerProvider>
    </AuthProvider>
  )
}