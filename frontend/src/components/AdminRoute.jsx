import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert } from 'lucide-react'
import Spinner from './Spinner'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />

  if (!user.is_staff) {
    // Avant : redirect silencieux vers /dashboard, ce qui donnait l'impression
    // que "la page admin affiche la page utilisateur". On affiche maintenant
    // un message clair pour que le problème (compte non-staff) soit visible.
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <ShieldAlert size={48} style={{ color: 'var(--red)', marginBottom: 16 }} />
        <h2 style={{ color: 'var(--heading)', marginBottom: 8 }}>
          Accès réservé aux administrateurs
        </h2>
        <p style={{ color: 'var(--text2)', marginBottom: 24, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Le compte « {user.username} » n'a pas le statut administrateur (is_staff).
          Ce statut est différent du rôle « Étudiant / Chercheur » : il doit être activé
          par un administrateur via l'interface Django (<code>/admin/</code>, section Utilisateurs,
          case « Statut équipe »), ou en créant un super-utilisateur avec
          <code> python manage.py createsuperuser</code>. Reconnectez-vous ensuite pour que
          le changement soit pris en compte.
        </p>
        <Link to="/dashboard" className="btn-primary">Retour à mon espace</Link>
      </div>
    )
  }

  return children
}