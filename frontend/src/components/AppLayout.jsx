import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDrawer } from '../context/DrawerContext'
import {
  Database, TrendingUp, Star, User, Home,
  Plus, Upload, LogIn, Settings, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AppLayout({ children }) {
  const { user } = useAuth()
  const { openUpload } = useDrawer()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => {
    if (path === '/datasets') return location.pathname === '/datasets'
    return location.pathname.startsWith(path)
  }

  const handlePublish = () => {
    if (!user) { toast.error('Connectez-vous pour publier.'); navigate('/login'); return }
    openUpload()
  }

  return (
    <div className="gl-root">
      {/* ── Sidebar gauche ── */}
      <aside className="gl-sidebar">
        <button className="gl-create-btn" onClick={handlePublish}>
          <Plus size={16} /> Nouveau dataset
        </button>

        <nav className="gl-nav">
          <Link to="/" className={`gl-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <Home size={17} /> Accueil
          </Link>
          <Link to="/datasets" className={`gl-nav-item ${isActive('/datasets') ? 'active' : ''}`}>
            <TrendingUp size={17} /> Explorer
          </Link>
          {user && (
            <Link to="/dashboard" className={`gl-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
              <Star size={17} /> Mon espace
            </Link>
          )}
        </nav>

        {user && (
          <>
            <div className="gl-nav-divider" />
            <div className="gl-nav-section-label">Mon compte</div>
            <nav className="gl-nav">
              <Link to="/dashboard" className={`gl-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                <User size={17} /> {user.username}
              </Link>
              <Link to="/profile/edit" className={`gl-nav-item ${isActive('/profile/edit') ? 'active' : ''}`}>
                <Settings size={17} /> Modifier le profil
              </Link>
              <button className="gl-nav-item gl-publish-nav" onClick={handlePublish}>
                <Upload size={17} /> Publier un dataset
              </button>
            </nav>
          </>
        )}

        {!user && (
          <>
            <div className="gl-nav-divider" />
            <nav className="gl-nav">
              <Link to="/login" className="gl-nav-item">
                <LogIn size={17} /> Connexion
              </Link>
              <Link to="/register" className="gl-nav-cta">
                S'inscrire gratuitement <ChevronRight size={14} />
              </Link>
            </nav>
          </>
        )}

        {user && (
          <div className="gl-sidebar-user">
            <div className="gl-user-avatar">{user.username[0].toUpperCase()}</div>
            <div className="gl-user-info">
              <span className="gl-user-name">{user.username}</span>
              <span className="gl-user-role">{user.role === 'researcher' ? 'Chercheur' : 'Étudiant'}</span>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="gl-content">
        {children}
      </div>
    </div>
  )
}