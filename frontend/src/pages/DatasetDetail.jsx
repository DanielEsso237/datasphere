import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDataset, downloadDataset, previewDataset, rateDataset, getComments, addComment, deleteComment, deleteDataset } from '../services/api'
import StarRating from '../components/StarRating'
import Spinner from '../components/Spinner'
import { Download, Trash2, User, Calendar, Tag, BarChart2, MessageSquare, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const DOMAIN_LABELS = {
  health:'Santé', agriculture:'Agriculture', education:'Éducation',
  environment:'Environnement', economy:'Économie', technology:'Technologie',
  social:'Sc. Sociales', physics:'Physique', biology:'Biologie', other:'Autre'
}

export default function DatasetDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dataset, setDataset] = useState(null)
  const [preview, setPreview] = useState(null)
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [myRating, setMyRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('info')

  useEffect(() => {
    Promise.all([
      getDataset(id),
      previewDataset(id).catch(() => null),
      getComments(id),
    ]).then(([ds, pv, cm]) => {
      setDataset(ds.data)
      setPreview(pv?.data || null)
      setComments(cm.data.results || cm.data)
    }).finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    if (!user) return toast.error('Connectez-vous pour télécharger.')
    try {
      const res = await downloadDataset(id)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = dataset.title
      a.click()
      URL.revokeObjectURL(url)
      setDataset(prev => ({ ...prev, download_count: prev.download_count + 1 }))
      toast.success('Téléchargement démarré !')
    } catch {
      toast.error('Erreur lors du téléchargement.')
    }
  }

  const handleRate = async (score) => {
    if (!user) return toast.error('Connectez-vous pour noter.')
    setMyRating(score)
    try {
      await rateDataset(id, score)
      const { data } = await getDataset(id)
      setDataset(data)
      toast.success('Note enregistrée !')
    } catch { toast.error('Erreur.') }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    try {
      const { data } = await addComment(id, comment)
      setComments(prev => [data, ...prev])
      setComment('')
    } catch { toast.error('Erreur lors du commentaire.') }
  }

  const handleDeleteComment = async (cid) => {
    try {
      await deleteComment(cid)
      setComments(prev => prev.filter(c => c.id !== cid))
    } catch { toast.error('Erreur.') }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce dataset ?')) return
    try {
      await deleteDataset(id)
      toast.success('Dataset supprimé.')
      navigate('/dashboard')
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  if (loading) return <Spinner />
  if (!dataset) return <div className="page-container"><p>Dataset introuvable.</p></div>

  const isOwner = user?.id === dataset.uploaded_by?.id
  const date = new Date(dataset.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })

  return (
    <div className="page-container detail-page">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-meta-top">
          <span className="card-domain">{DOMAIN_LABELS[dataset.domain]}</span>
          <span className="card-filetype" style={{background:'#22c55e'}}>{dataset.file_type?.toUpperCase()}</span>
        </div>
        <h1>{dataset.title}</h1>
        <div className="detail-info-row">
          <span><User size={15}/> <Link to={`/profile/${dataset.uploaded_by?.username}`}>{dataset.uploaded_by?.username}</Link></span>
          <span><Calendar size={15}/> {date}</span>
          <span>{dataset.file_size_display}</span>
          <span><Download size={15}/> {dataset.download_count} téléchargements</span>
        </div>
        <div className="detail-rating-row">
          <StarRating value={Math.round(dataset.avg_rating)} readonly />
          <span>{dataset.avg_rating} / 5 ({dataset.ratings_count} note{dataset.ratings_count !== 1 ? 's' : ''})</span>
        </div>
        <div className="detail-actions">
          <button onClick={handleDownload} className="btn-primary">
            <Download size={18}/> Télécharger
          </button>
          {isOwner && (
            <button onClick={handleDelete} className="btn-danger">
              <Trash2 size={18}/> Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[['info','📋 Informations'], ['preview','📊 Aperçu'], ['comments','💬 Commentaires']].map(([t, label]) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {label} {t === 'comments' && `(${comments.length})`}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tab === 'info' && (
          <div className="info-tab">
            <h3>Description</h3>
            <p>{dataset.description}</p>
            {dataset.tags && (
              <div className="tags-wrap">
                <Tag size={15}/>
                {dataset.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            )}
            {user && !isOwner && (
              <div className="rate-section">
                <h3>⭐ Votre note</h3>
                <StarRating value={myRating} onChange={handleRate}/>
                <p className="rate-hint">{myRating ? `Vous avez noté ${myRating}/5` : 'Cliquez pour noter'}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'preview' && (
          <div className="preview-tab">
            {preview?.columns ? (
              <>
                <p className="preview-info"><BarChart2 size={15}/> {preview.columns.length} colonnes · {preview.rows?.length} lignes affichées</p>
                <div className="table-wrap">
                  <table className="preview-table">
                    <thead><tr>{preview.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>{preview.rows?.map((row, i) => (
                      <tr key={i}>{preview.columns.map(c => <td key={c}>{String(row[c] ?? '')}</td>)}</tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <span>📄</span>
                <p>Aperçu non disponible pour ce format.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'comments' && (
          <div className="comments-tab">
            {user && (
              <form onSubmit={handleComment} className="comment-form">
                <textarea placeholder="Partagez votre avis sur ce dataset…" value={comment}
                  onChange={e => setComment(e.target.value)} rows={3}/>
                <button type="submit" className="btn-primary" disabled={!comment.trim()}>
                  <Send size={16}/> Envoyer
                </button>
              </form>
            )}
            {comments.length === 0 ? (
              <div className="empty-state"><span>💬</span><p>Soyez le premier à commenter !</p></div>
            ) : (
              <div className="comments-list">
                {comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-header">
                      <strong>{c.user?.username}</strong>
                      <span>{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                      {user?.id === c.user?.id && (
                        <button onClick={() => handleDeleteComment(c.id)} className="btn-icon-danger"><Trash2 size={13}/></button>
                      )}
                    </div>
                    <p>{c.content}</p>
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
