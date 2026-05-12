import { Link } from 'react-router-dom'
import { Download, Star, MessageSquare, Tag, User, Calendar } from 'lucide-react'

const DOMAIN_LABELS = {
  health:'Santé', agriculture:'Agriculture', education:'Éducation',
  environment:'Environnement', economy:'Économie', technology:'Technologie',
  social:'Sc. Sociales', physics:'Physique', biology:'Biologie', other:'Autre'
}

const FILE_COLORS = { csv:'#22c55e', json:'#f59e0b', xlsx:'#3b82f6', txt:'#8b5cf6', other:'#6b7280' }

export default function DatasetCard({ dataset }) {
  const { id, title, description, domain, file_type, file_size_display,
          uploaded_by, download_count, avg_rating, ratings_count, comments_count, created_at } = dataset

  const date = new Date(created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })

  return (
    <Link to={`/datasets/${id}`} className="dataset-card">
      <div className="card-header">
        <span className="card-domain">{DOMAIN_LABELS[domain] || domain}</span>
        <span className="card-filetype" style={{ background: FILE_COLORS[file_type] || '#6b7280' }}>
          {file_type?.toUpperCase()}
        </span>
      </div>

      <h3 className="card-title">{title}</h3>
      <p className="card-desc">{description?.slice(0, 100)}{description?.length > 100 ? '…' : ''}</p>

      <div className="card-meta">
        <span><User size={13}/> {uploaded_by?.username}</span>
        <span><Calendar size={13}/> {date}</span>
        <span>{file_size_display}</span>
      </div>

      <div className="card-stats">
        <span><Download size={13}/> {download_count}</span>
        <span><Star size={13}/> {avg_rating} ({ratings_count})</span>
        <span><MessageSquare size={13}/> {comments_count}</span>
      </div>
    </Link>
  )
}
