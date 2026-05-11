import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import DatasetList from './pages/DatasetList'
import DatasetDetail from './pages/DatasetDetail'
import Upload from './pages/Upload'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }}/>
        <Navbar/>
        <main>
          <Routes>
            <Route path="/" element={<Landing/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/register" element={<Register/>}/>
            <Route path="/datasets" element={<DatasetList/>}/>
            <Route path="/datasets/:id" element={<DatasetDetail/>}/>
            <Route path="/upload" element={<ProtectedRoute><Upload/></ProtectedRoute>}/>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
            <Route path="*" element={<NotFound/>}/>
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}