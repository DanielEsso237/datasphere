import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDrawer } from '../context/DrawerContext'
import { getMyDatasets, deleteDataset } from '../services/api'
import Spinner from '../components/Spinner'
import {
  Upload, Database, Download, Star, Building,
  Edit3, Trash2, Plus, TrendingUp, MessageSquare,
  Calendar, FileText, ChevronRight, Award, ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

const DOMAIN_LABELS = {
  health: 'Santé', agriculture: 'Agriculture', education: 'Éducation',
  environment: 'Environnement', economy: 'Économie', technology: 'Technologie',
  social: 'Sc. Sociales', physics: 'Physique', biology: 'Biologie', other: 'Autre',
}
const FILE_COLORS = {
  csv: '#22c55e', json: '#f59e0b', xlsx: '#3b82f6', txt: '#8b5cf6', other: '#6b7280'
}

const DOMAIN_COVERS = {
  health: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=70',
  agriculture: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=70',
  education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=70',
  environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=70',
  economy: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=70',
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=70',
  social: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=70',
  physics: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=70',
  biology: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=70',
  other: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=70',
}

const STATUS_LABELS = {
  pending: { label: 'En attente', color: '#f59e0b' },
  approved: { label: 'Approuvé', color: '#22c55e' },
  rejected: { label: 'Refusé', color: '#ef4444' },
}

function DashDatasetCard({ dataset, onDelete, navigate }) {
  const cover = dataset.cover_image_url || DOMAIN_COVERS[dataset.domain] || DOMAIN_COVERS.other
  const fileColor = FILE_COLORS[dataset.file_type] || '#6b7280'
  const date = new Date(dataset.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="db-card" onClick={() => navigate(`/datasets/${dataset.id}`)}>
      {/* Cover */}
      <div className="db-card-cover">
        <img src={cover} alt="" onError={e => { e.target.style.display = 'none' }} />
        <div className="db-card-cover-overlay" />
        <span className="db-card-type" style={{ background: fileColor }}>
          {dataset.file_type?.toUpperCase()}
        </span>
        {dataset.status !== 'approved' && (
          <span className="db-card-status" style={{ background: STATUS_LABELS[dataset.status]?.color }}>
            {STATUS_LABELS[dataset.status]?.label}
          </span>
       )}
        {dataset.status === 'rejected' && dataset.rejection_reason && (
          <p className="db-card-reject-reason">{dataset.rejection_reason}</p>
       )}
      </div>

      {/* Body */}
      <div className="db-card-body">
        <span className="db-card-domain">{DOMAIN_LABELS[dataset.domain] || dataset.domain}</span>
        <h3 className="db-card-title">{dataset.title}</h3>
        <p className="db-card-desc">
          {dataset.description?.slice(0, 80)}{dataset.description?.length > 80 ? '…' : ''}
        </p>

        <div className="db-card-stats">
          <span><Download size={12} /> {dataset.download_count}</span>
          <span><Star size={12} /> {dataset.avg_rating}/5</span>
          <span><Calendar size={12} /> {date}</span>
        </div>

        <div className="db-card-footer" onClick={e => e.stopPropagation()}>
          <button
            className="db-card-del"
            onClick={() => onDelete(dataset.id, dataset.title)}
          >
            <Trash2 size={13} /> Supprimer
          </button>
          <button
            className="db-card-view"
            onClick={() => navigate(`/datasets/${dataset.id}`)}
          >
            Voir <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { openUpload } = useDrawer()
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('datasets')

  const fetchDatasets = useCallback(() => {
    setLoading(true)
    getMyDatasets()
      .then(({ data }) => setDatasets(data.results || data))
      .catch(() => toast.error('Erreur lors du chargement.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchDatasets() }, [fetchDatasets])

  const totalDownloads = datasets.reduce((s, d) => s + (d.download_count || 0), 0)
  const avgRating = datasets.length
    ? (datasets.reduce((s, d) => s + (d.avg_rating || 0), 0) / datasets.length).toFixed(1)
    : '—'
  const totalComments = datasets.reduce((s, d) => s + (d.comments_count || 0), 0)

  const handleDelete = async (datasetId, title) => {
    if (!window.confirm(`Supprimer "${title}" ?`)) return
    try {
      await deleteDataset(datasetId)
      setDatasets(prev => prev.filter(d => d.id !== datasetId))
      toast.success('Dataset supprimé.')
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  const roleLabel = user?.role === 'researcher' ? 'Chercheur' : 'Étudiant'

  const TABS = [
    { id: 'datasets', label: 'Mes datasets', count: datasets.length },
    { id: 'activity', label: 'Activité', count: null },
  ]

  return (
    <div className="db-root">

      {/* ── Profile hero banner ── */}
      <div className="db-banner">
        <div className="db-banner-bg" />
        <div className="db-banner-content">
          <div className="db-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div className="db-profile-info">
            <div className="db-profile-name-row">
              <h1 className="db-profile-name">{user?.username}</h1>
              <span className="db-role-badge">{roleLabel}</span>
              {/* Badge distinct pour bien différencier le rôle métier (Étudiant/Chercheur)
                  du statut administrateur (is_staff), qui sont deux notions séparées. */}
              {user?.is_staff && (
                <span className="db-role-badge" style={{
                  background: 'rgba(239,68,68,0.12)',
                  borderColor: 'rgba(239,68,68,0.35)',
                  color: 'var(--red)'
                }}>
                  <ShieldCheck size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                  Administrateur
                </span>
              )}
            </div>
            {user?.institution && (
              <p className="db-profile-detail"><Building size={13} /> {user.institution}</p>
            )}
            {user?.bio && <p className="db-profile-bio">{user.bio}</p>}
            <p className="db-profile-email">{user?.email}</p>
          </div>
          <div className="db-banner-actions">
            {user?.is_staff && (
              <Link to="/admin" className="db-edit-btn">
                <ShieldCheck size={14} /> Espace admin
              </Link>
            )}
            <Link to="/profile/edit" className="db-edit-btn">
              <Edit3 size={14} /> Modifier le profil
            </Link>
            <button className="db-publish-btn" onClick={openUpload}>
              <Plus size={14} /> Nouveau dataset
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="db-stats-strip">
        <div className="db-stat-item">
          <Database size={20} />
          <div>
            <strong>{datasets.length}</strong>
            <span>Datasets publiés</span>
          </div>
        </div>
        <div className="db-stat-sep" />
        <div className="db-stat-item">
          <Download size={20} />
          <div>
            <strong>{totalDownloads}</strong>
            <span>Téléchargements</span>
          </div>
        </div>
        <div className="db-stat-sep" />
        <div className="db-stat-item">
          <Star size={20} />
          <div>
            <strong>{avgRating}</strong>
            <span>Note moyenne</span>
          </div>
        </div>
        <div className="db-stat-sep" />
        <div className="db-stat-item">
          <MessageSquare size={20} />
          <div>
            <strong>{totalComments}</strong>
            <span>Commentaires reçus</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="db-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`db-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.count !== null && <span className="db-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="db-tab-body">

        {activeTab === 'datasets' && (
          <>
            <div className="db-section-header">
              <h2 className="db-section-title">
                <FileText size={18} /> Mes datasets publiés
              </h2>
              <button className="db-publish-btn" onClick={openUpload}>
                <Plus size={14} /> Nouveau dataset
              </button>
            </div>

            {loading ? <Spinner /> : datasets.length === 0 ? (
              <div className="db-empty">
                <Database size={48} />
                <h3>Aucun dataset publié</h3>
                <p>Partagez vos données avec la communauté scientifique africaine.</p>
                <button className="db-publish-btn large" onClick={openUpload}>
                  <Plus size={16} /> Publier mon premier dataset
                </button>
              </div>
            ) : (
              <div className="db-grid">
                {datasets.map(d => (
                  <DashDatasetCard
                    key={d.id}
                    dataset={d}
                    onDelete={handleDelete}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'activity' && (
          <div className="db-activity">
            <div className="db-section-header">
              <h2 className="db-section-title">
                <TrendingUp size={18} /> Activité récente
              </h2>
            </div>
            {datasets.length === 0 ? (
              <div className="db-empty">
                <TrendingUp size={48} />
                <h3>Aucune activité pour le moment</h3>
                <p>Publiez votre premier dataset pour commencer.</p>
              </div>
            ) : (
              <div className="db-activity-list">
                {datasets.slice(0, 10).map(d => (
                  <div
                    key={d.id}
                    className="db-activity-item"
                    onClick={() => navigate(`/datasets/${d.id}`)}
                  >
                    <div className="db-act-icon">
                      <Upload size={15} />
                    </div>
                    <div className="db-act-body">
                      <p className="db-act-title">
                        Vous avez publié <strong>{d.title}</strong>
                      </p>
                      <p className="db-act-meta">
                        {new Date(d.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                        · {d.download_count} téléchargement{d.download_count !== 1 ? 's' : ''}
                        · Note {d.avg_rating}/5
                      </p>
                    </div>
                    <span
                      className="db-act-badge"
                      style={{ background: FILE_COLORS[d.file_type] || '#6b7280' }}
                    >
                      {d.file_type?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}