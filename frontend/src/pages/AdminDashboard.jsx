import { useState, useEffect, useCallback } from 'react'
import { getAdminStats, getPendingDatasets, reviewDataset } from '../services/api'
import Spinner from '../components/Spinner'
import {
  Users, Database, Clock, CheckCircle, XCircle, Download,
  ShieldCheck, FileText, Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'

const DOMAIN_LABELS = {
  health: 'Santé', agriculture: 'Agriculture', education: 'Éducation',
  environment: 'Environnement', economy: 'Économie', technology: 'Technologie',
  social: 'Sc. Sociales', physics: 'Physique', biology: 'Biologie', other: 'Autre',
}

function RejectModal({ dataset, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <h3>Refuser « {dataset.title} »</h3>
        <p className="adm-modal-hint">Expliquez pourquoi ce dataset est refusé. L'auteur recevra ce message.</p>
        <textarea
          rows={4}
          placeholder="Ex : format de fichier non conforme, description insuffisante…"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="adm-modal-actions">
          <button className="btn-outline" onClick={onClose}>Annuler</button>
          <button
            className="btn-danger"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([getAdminStats(), getPendingDatasets()])
      .then(([s, p]) => {
        setStats(s.data)
        setPending(p.data.results || p.data)
      })
      .catch(() => toast.error("Erreur lors du chargement de l'espace admin."))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id) => {
    setBusyId(id)
    try {
      await reviewDataset(id, 'approve')
      toast.success('Dataset approuvé.')
      setPending(prev => prev.filter(d => d.id !== id))
      setStats(prev => prev && { ...prev, pending: prev.pending - 1, approved: prev.approved + 1 })
    } catch {
      toast.error('Erreur lors de la validation.')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (reason) => {
    const id = rejectTarget.id
    setBusyId(id)
    try {
      await reviewDataset(id, 'reject', reason)
      toast.success('Dataset refusé.')
      setPending(prev => prev.filter(d => d.id !== id))
      setStats(prev => prev && { ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 })
    } catch {
      toast.error('Erreur lors du refus.')
    } finally {
      setBusyId(null)
      setRejectTarget(null)
    }
  }

  if (loading) return <Spinner />
  if (!stats) return null

  const STAT_CARDS = [
    { icon: <Users size={20} />, label: 'Utilisateurs', value: stats.total_users },
    { icon: <Database size={20} />, label: 'Datasets totaux', value: stats.total_datasets },
    { icon: <Clock size={20} />, label: 'En attente', value: stats.pending, accent: 'yellow' },
    { icon: <CheckCircle size={20} />, label: 'Approuvés', value: stats.approved, accent: 'green' },
    { icon: <XCircle size={20} />, label: 'Refusés', value: stats.rejected, accent: 'red' },
    { icon: <Download size={20} />, label: 'Téléchargements', value: stats.total_downloads },
  ]

  return (
    <div className="page-container adm-root">
      <div className="adm-header">
        <h1><ShieldCheck size={26} /> Administration</h1>
        <p>Vue d'ensemble de la plateforme et modération des publications.</p>
      </div>

      {/* Stats */}
      <div className="adm-stats-grid">
        {STAT_CARDS.map((c, i) => (
          <div key={i} className={`adm-stat-card ${c.accent ? `accent-${c.accent}` : ''}`}>
            {c.icon}
            <div>
              <strong>{c.value}</strong>
              <span>{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="adm-columns">
        {/* Datasets by domain */}
        <div className="adm-card">
          <h2><FileText size={16} /> Datasets par domaine</h2>
          {stats.by_domain.length === 0 ? <p className="adm-empty-text">Aucune donnée.</p> : (
            <div className="adm-domain-bars">
              {stats.by_domain.map(d => {
                const max = Math.max(...stats.by_domain.map(x => x.count))
                return (
                  <div className="adm-domain-row" key={d.domain}>
                    <span className="adm-domain-label">{DOMAIN_LABELS[d.domain] || d.domain}</span>
                    <div className="adm-domain-bar-track">
                      <div className="adm-domain-bar-fill" style={{ width: `${(d.count / max) * 100}%` }} />
                    </div>
                    <span className="adm-domain-count">{d.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent users */}
        <div className="adm-card">
          <h2><Users size={16} /> Derniers inscrits</h2>
          <div className="adm-mini-list">
            {stats.recent_users.map(u => (
              <div className="adm-mini-item" key={u.id}>
                <span className="adm-mini-title">{u.username}</span>
                <span className="adm-mini-meta">
                  {u.role === 'researcher' ? 'Chercheur' : 'Étudiant'} ·{' '}
                  {new Date(u.date_joined).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending review */}
      <div className="adm-card adm-pending-card">
        <h2><Clock size={16} /> Publications en attente ({pending.length})</h2>

        {pending.length === 0 ? (
          <div className="adm-empty">
            <CheckCircle size={36} />
            <p>Aucune publication en attente. Tout est à jour !</p>
          </div>
        ) : (
          <div className="adm-pending-list">
            {pending.map(d => (
              <div className="adm-pending-row" key={d.id}>
                <div className="adm-pending-info">
                  <span className="adm-pending-title">{d.title}</span>
                  <span className="adm-pending-meta">
                    <span>{d.uploaded_by?.username}</span>
                    <span>· {DOMAIN_LABELS[d.domain] || d.domain}</span>
                    <span>· {d.file_type?.toUpperCase()}</span>
                    <span><Calendar size={11} /> {new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
                  </span>
                  <p className="adm-pending-desc">
                    {d.description?.slice(0, 160)}{d.description?.length > 160 ? '…' : ''}
                  </p>
                </div>
                <div className="adm-pending-actions">
                  <a href={`/datasets/${d.id}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                    Voir
                  </a>
                  <button
                    className="btn-primary btn-sm"
                    disabled={busyId === d.id}
                    onClick={() => handleApprove(d.id)}
                  >
                    <CheckCircle size={14} /> Approuver
                  </button>
                  <button
                    className="btn-danger btn-sm"
                    disabled={busyId === d.id}
                    onClick={() => setRejectTarget(d)}
                  >
                    <XCircle size={14} /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectTarget && (
        <RejectModal
          dataset={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}
    </div>
  )
}