import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyDatasets, deleteDataset } from '../services/api'
import Spinner from '../components/Spinner'
import { Upload, Database, Download, Star, Building, Edit3, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const DOMAIN_LABELS = {
  health: 'Santé', agriculture: 'Agriculture', education: 'Éducation',
  environment: 'Environnement', economy: 'Économie', technology: 'Technologie',
  social: 'Sc. Sociales', physics: 'Physique', biology: 'Biologie', other: 'Autre',
}
const FILE_COLORS = { csv: '#22c55e', json: '#f59e0b', xlsx: '#3b82f6', txt: '#8b5cf6', other: '#6b7280' }

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDatasets = useCallback(() => {
    setLoading(true)
    getMyDatasets()
      .then(({ data }) => setDatasets(data.results || data))
      .catch(() => toast.error('Erreur lors du chargement des datasets.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchDatasets()
  }, [fetchDatasets])

  // Stats calculées en temps réel depuis les données fraîches
  const totalDownloads = datasets.reduce((s, d) => s + (d.download_count || 0), 0)
  const avgRating = datasets.length
    ? (datasets.reduce((s, d) => s + (d.avg_rating || 0), 0) / datasets.length).toFixed(1)
    : '—'

  const roleLabel = user?.role === 'researcher' ? 'Chercheur' : 'Étudiant'

  const handleDelete = async (e, datasetId, title) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Supprimer "${title}" ?`)) return
    try {
      await deleteDataset(datasetId)
      setDatasets(prev => prev.filter(d => d.id !== datasetId))
      toast.success('Dataset supprimé.')
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  return (
    <div className="page-container">
      {/* Profile hero */}
      <div className="dashboard-hero">
        <div className="avatar-circle">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="dashboard-info">
          <div className="dash-name-row">
            <h1>{user?.username}</h1>
            <span className="role-badge">{roleLabel}</span>
          </div>
          {user?.institution && <p><Building size={15} /> {user.institution}</p>}
          {user?.bio && <p className="user-bio">{user.bio}</p>}
          <p className="user-email">{user?.email}</p>
        </div>
        <Link to="/profile/edit" className="btn-outline btn-sm">
          <Edit3 size={15} /> Modifier le profil
        </Link>
      </div>

      {/* Stats — recalculées depuis les données fraîches */}
      <div className="dash-stats">
        <div className="dash-stat">
          <Database size={24} />
          <span className="stat-num">{datasets.length}</span>
          <span>Datasets publiés</span>
        </div>
        <div className="dash-stat">
          <Download size={24} />
          <span className="stat-num">{totalDownloads}</span>
          <span>Téléchargements</span>
        </div>
        <div className="dash-stat">
          <Star size={24} />
          <span className="stat-num">{avgRating}</span>
          <span>Note moyenne</span>
        </div>
      </div>

      {/* My datasets */}
      <div className="section-header">
        <h2>Mes datasets</h2>
        <Link to="/upload" className="btn-primary btn-sm">
          <Upload size={15} /> Nouveau dataset
        </Link>
      </div>

      {loading ? <Spinner /> : datasets.length === 0 ? (
        <div className="empty-state">
          <span>📂</span>
          <h3>Vous n'avez pas encore publié de dataset</h3>
          <p>Partagez vos données avec la communauté scientifique.</p>
          <Link to="/upload" className="btn-primary">Publier mon premier dataset</Link>
        </div>
      ) : (
        <div className="datasets-grid">
          {datasets.map(d => (
            <div
              key={d.id}
              className="dataset-card"
              onClick={() => navigate(`/datasets/${d.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-header">
                <span className="card-domain">{DOMAIN_LABELS[d.domain] || d.domain}</span>
                <span
                  className="card-filetype"
                  style={{ background: FILE_COLORS[d.file_type] || '#6b7280' }}
                >
                  {d.file_type?.toUpperCase()}
                </span>
              </div>

              <h3 className="card-title">{d.title}</h3>
              <p className="card-desc">
                {d.description?.slice(0, 100)}{d.description?.length > 100 ? '…' : ''}
              </p>

              <div className="card-stats" style={{ marginTop: 'auto' }}>
                <span><Download size={13} /> {d.download_count}</span>
                <span><Star size={13} /> {d.avg_rating} ({d.ratings_count})</span>
              </div>

              {/* Actions propres au dashboard */}
              <div
                className="card-actions"
                style={{ marginTop: 12, display: 'flex', gap: 8 }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  className="btn-danger btn-sm"
                  style={{ flex: 1 }}
                  onClick={e => handleDelete(e, d.id, d.title)}
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}