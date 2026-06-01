import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDrawer } from '../context/DrawerContext'
import { Database, Upload, User, LogOut, LogIn, Menu, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { openUpload } = useDrawer()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const handlePublish = () => {
    setOpen(false)
    if (!user) { toast.error('Connectez-vous pour publier.'); navigate('/login'); return }
    openUpload()
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <Database size={22} />
          <span>DataSphere</span>
        </Link>

        <button className="nav-burger" onClick={() => setOpen(!open)}>
          {open ? <X size={22}/> : <Menu size={22}/>}
        </button>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          <Link to="/datasets" onClick={() => setOpen(false)}>Explorer</Link>

          <button onClick={handlePublish}>
            <Upload size={15}/> Publier
          </button>

          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)}>
                <User size={15}/> {user.username}
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={15}/> Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-nav-login" onClick={() => setOpen(false)}>
                <LogIn size={15}/> Connexion
              </Link>
              <Link to="/register" className="btn-nav-register" onClick={() => setOpen(false)}>
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}