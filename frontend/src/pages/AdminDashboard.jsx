import { useState, useEffect, useCallback } from 'react'
import { getAdminStats, getPendingDatasets, reviewDataset } from '../services/api'
import Spinner from '../components/Spinner'
import {
  Users, Database, Clock, CheckCircle, XCircle, Download,
  ShieldCheck, FileText, Calendar, PieChart as PieChartIcon,
  BarChart3, TrendingUp as TrendingUpIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const DOMAIN_LABELS = {
  health: 'Santé', agriculture: 'Agriculture', education: 'Éducation',
  environment: 'Environnement', economy: 'Économie', technology: 'Technologie',
  social: 'Sc. Sociales', physics: 'Physique', biology: 'Biologie', other: 'Autre',
}

const STATUS_COLORS = { pending: '#f59e0b', approved: '#22c55e', rejected: '#ef4444' }
const DOMAIN_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1']

const CHART_TOOLTIP_STYLE = {
  background: '#161b25',
  border: '1px solid #252b38',
  borderRadius: 8,
  color: '#e8edf5',
  fontSize: 13,
}
const AXIS_TICK = { fill: '#7a869a', fontSize: 12 }

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

  const domainChartData = (stats.by_domain || []).map(d => ({
    domain: DOMAIN_LABELS[d.domain] || d.domain,
    count: d.count,
  }))

  const statusChartData = (stats.status_breakdown || []).filter(s => s.count > 0)
  const hasStatusData = statusChartData.length > 0

  const trendData = stats.monthly_trend || []

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

      {/* ── Graphiques ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Répartition par statut */}
        <div className="adm-card">
          <h2><PieChartIcon size={16} /> Répartition des publications</h2>
          {!hasStatusData ? (
            <p className="adm-empty-text">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {statusChartData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend
                  formatter={(value) => <span style={{ color: '#c8d0e0', fontSize: 13 }}>{value}</span>}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Datasets par domaine */}
        <div className="adm-card">
          <h2><BarChart3 size={16} /> Datasets par domaine</h2>
          {domainChartData.length === 0 ? (
            <p className="adm-empty-text">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={domainChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252b38" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={{ stroke: '#252b38' }} tickLine={false} />
                <YAxis type="category" dataKey="domain" width={90} tick={AXIS_TICK} axisLine={{ stroke: '#252b38' }} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {domainChartData.map((_, i) => (
                    <Cell key={i} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Évolution sur 6 mois */}
      <div className="adm-card" style={{ marginBottom: 24 }}>
        <h2><TrendingUpIcon size={16} /> Évolution sur 6 mois</h2>
        {trendData.length === 0 ? (
          <p className="adm-empty-text">Aucune donnée.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ left: -10, right: 20, top: 10 }}>
              <defs>
                <linearGradient id="colorDatasets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252b38" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={{ stroke: '#252b38' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={{ stroke: '#252b38' }} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend
                formatter={(value) => <span style={{ color: '#c8d0e0', fontSize: 13 }}>{value}</span>}
                iconType="circle"
              />
              <Area type="monotone" dataKey="datasets" name="Nouveaux datasets" stroke="#3b82f6" fill="url(#colorDatasets)" strokeWidth={2} />
              <Area type="monotone" dataKey="users" name="Nouveaux utilisateurs" stroke="#8b5cf6" fill="url(#colorUsers)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Derniers inscrits */}
      <div className="adm-card" style={{ marginBottom: 24 }}>
        <h2><Users size={16} /> Derniers inscrits</h2>
        {stats.recent_users.length === 0 ? (
          <p className="adm-empty-text">Aucune donnée.</p>
        ) : (
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
        )}
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