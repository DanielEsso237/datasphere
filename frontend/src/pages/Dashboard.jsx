import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyDatasets } from '../services/api'
import DatasetCard from '../components/DatasetCard'
import Spinner from '../components/Spinner'
import { Upload, Database, Download, Star, User, Building, Edit3 } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyDatasets().then(({ data }) => {
      setDatasets(data.results || data)
    }).finally(() => setLoading(false))
  }, [])

  const totalDownloads = datasets.reduce((s, d) => s + d.download_count, 0)
  const avgRating = datasets.length
    ? (datasets.reduce((s, d) => s + d.avg_rating, 0) / datasets.length).toFixed(1)
    : 0

  const roleLabel = user?.role === 'researcher' ? '🔬 Chercheur' : '🎓 Étudiant'

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
          {user?.institution && <p><Building size={15}/> {user.institution}</p>}
          {user?.bio && <p className="user-bio">{user.bio}</p>}
          <p className="user-email">{user?.email}</p>
        </div>
        <Link to="/profile/edit" className="btn-outline btn-sm">
          <Edit3 size={15}/> Modifier le profil
        </Link>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        <div className="dash-stat">
          <Database size={24}/>
          <span className="stat-num">{datasets.length}</span>
          <span>Datasets publiés</span>
        </div>
        <div className="dash-stat">
          <Download size={24}/>
          <span className="stat-num">{totalDownloads}</span>
          <span>Téléchargements</span>
        </div>
        <div className="dash-stat">
          <Star size={24}/>
          <span className="stat-num">{avgRating}</span>
          <span>Note moyenne</span>
        </div>
      </div>

      {/* My datasets */}
      <div className="section-header">
        <h2>Mes datasets</h2>
        <Link to="/upload" className="btn-primary btn-sm">
          <Upload size={15}/> Nouveau dataset
        </Link>
      </div>

      {loading ? <Spinner/> : datasets.length === 0 ? (
        <div className="empty-state">
          <span>📂</span>
          <h3>Vous n'avez pas encore publié de dataset</h3>
          <p>Partagez vos données avec la communauté scientifique.</p>
          <Link to="/upload" className="btn-primary">Publier mon premier dataset</Link>
        </div>
      ) : (
        <div className="datasets-grid">
          {datasets.map(d => <DatasetCard key={d.id} dataset={d}/>)}
        </div>
      )}
    </div>
  )
}
