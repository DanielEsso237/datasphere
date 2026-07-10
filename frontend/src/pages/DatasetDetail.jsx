import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getDataset, downloadDataset, previewDataset,
  rateDataset, getComments, addComment, deleteComment, deleteDataset, getDatasets
} from '../services/api';
import StarRating from '../components/StarRating';
import Spinner from '../components/Spinner';
import {
  Download, Trash2, User, Calendar, Tag, BarChart2, Send,
  ChevronUp, Code, MessageSquare, Lightbulb, Database,
  FileText, Hash, Clock, Eye, Share2, Bookmark, MoreHorizontal,
  TrendingUp, Star, ExternalLink, Table2, AlignLeft, Link2
} from 'lucide-react';
import toast from 'react-hot-toast';

const DOMAIN_LABELS = {
  health: 'Santé', agriculture: 'Agriculture', education: 'Éducation',
  environment: 'Environnement', economy: 'Économie', technology: 'Technologie',
  social: 'Sc. Sociales', physics: 'Physique', biology: 'Biologie', other: 'Autre',
};

const FILE_COLORS = {
  csv: '#22c55e', json: '#f59e0b', xlsx: '#3b82f6', txt: '#8b5cf6', other: '#6b7280',
};

const DOMAIN_COVERS = {
  health: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
  agriculture: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80',
  education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
  environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
  economy: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  social: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
  physics: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
  biology: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
  other: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
};

// ── Preview Components ──────────────────────────────────────────────

function TablePreview({ preview }) {
  const [viewMode, setViewMode] = useState('detail');

  if (!preview?.columns?.length) return null;

  return (
    <div className="kd-preview-wrap">
      <div className="kd-preview-toolbar">
        <div className="kd-preview-info">
          <span className="kd-stat-chip"><Hash size={13} /> {preview.stats?.total_columns} colonnes</span>
          <span className="kd-stat-chip"><Table2 size={13} /> {preview.stats?.total_rows?.toLocaleString()} lignes</span>
          <span className="kd-stat-chip kd-chip-muted">Aperçu des {preview.stats?.preview_rows} premières lignes</span>
        </div>
        <div className="kd-view-tabs">
          {[['detail', 'Détail'], ['compact', 'Compact'], ['column', 'Colonnes']].map(([v, l]) => (
            <button
              key={v}
              className={`kd-vtab ${viewMode === v ? 'active' : ''}`}
              onClick={() => setViewMode(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'column' ? (
        <div className="kd-col-grid">
          {preview.columns.map((col, i) => {
            const values = preview.rows.map(r => r[col]).filter(v => v != null && v !== '');
            const sample = values.slice(0, 3).join(', ');
            return (
              <div key={i} className="kd-col-card">
                <div className="kd-col-name">{col}</div>
                <div className="kd-col-sample">{sample || '—'}</div>
                <div className="kd-col-count">{values.length} valeurs</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="kd-table-scroll">
          <table className="kd-table">
            <thead>
              <tr>
                <th className="kd-row-num">#</th>
                {(viewMode === 'compact'
                  ? preview.columns.slice(0, 8)
                  : preview.columns
                ).map(col => (
                  <th key={col}>
                    <span className="kd-th-inner">{col}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, i) => (
                <tr key={i}>
                  <td className="kd-row-num">{i + 1}</td>
                  {(viewMode === 'compact'
                    ? preview.columns.slice(0, 8)
                    : preview.columns
                  ).map(col => (
                    <td key={col} title={String(row[col] ?? '')}>
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TextPreview({ preview }) {
  return (
    <div className="kd-preview-wrap">
      <div className="kd-preview-toolbar">
        <div className="kd-preview-info">
          <span className="kd-stat-chip"><AlignLeft size={13} /> {preview.stats?.total_lines?.toLocaleString()} lignes</span>
          <span className="kd-stat-chip"><FileText size={13} /> {(preview.stats?.total_chars / 1024).toFixed(1)} KB</span>
          <span className="kd-stat-chip kd-chip-muted">Aperçu des {preview.stats?.preview_lines} premières lignes</span>
        </div>
      </div>
      <div className="kd-text-preview">
        <pre>
          {preview.lines.map((line, i) => (
            <div key={i} className="kd-text-line">
              <span className="kd-line-num">{i + 1}</span>
              <span className="kd-line-content">{line || '\u00A0'}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function PreviewPanel({ datasetId }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    previewDataset(datasetId)
      .then(res => setPreview(res.data))
      .catch(err => {
        const msg = err.response?.data?.error || 'Erreur lors du chargement de l\'aperçu.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [datasetId]);

  if (loading) return (
    <div className="kd-preview-loading">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <span>Chargement de l'aperçu…</span>
    </div>
  );

  if (error) return (
    <div className="kd-preview-error">
      <FileText size={40} />
      <p>{error}</p>
      <span className="kd-preview-error-hint">Format supporté : CSV, JSON, TXT</span>
    </div>
  );

  if (!preview) return null;

  if (preview.type === 'table') return <TablePreview preview={preview} />;
  if (preview.type === 'text') return <TextPreview preview={preview} />;

  return (
    <div className="kd-preview-error">
      <FileText size={40} />
      <p>Aperçu non disponible pour ce format.</p>
    </div>
  );
}

// ── Related Dataset Mini-Card ────────────────────────────────────────

function RelatedCard({ dataset }) {
  const navigate = useNavigate();
  const cover = dataset.cover_image_url || DOMAIN_COVERS[dataset.domain] || DOMAIN_COVERS.other;

  return (
    <div className="kd-related-card" onClick={() => navigate(`/datasets/${dataset.id}`)}>
      <div className="kd-related-cover">
        <img src={cover} alt="" onError={e => { e.target.style.display = 'none'; }} />
      </div>
      <div className="kd-related-body">
        <span
          className="kd-related-type"
          style={{ background: FILE_COLORS[dataset.file_type] || '#6b7280' }}
        >
          {dataset.file_type?.toUpperCase()}
        </span>
        <h4 className="kd-related-title">{dataset.title}</h4>
        <p className="kd-related-author">{dataset.uploaded_by?.username}</p>
        <div className="kd-related-stats">
          <span><Download size={11} /> {dataset.download_count}</span>
          <span><Star size={11} /> {dataset.avg_rating}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function DatasetDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dataset, setDataset] = useState(null);
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  const [comment, setComment] = useState('');
  const [myRating, setMyRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('datacard');
  const [upvoted, setUpvoted] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDataset(id),
      getComments(id),
    ]).then(([ds, cm]) => {
      setDataset(ds.data);
      setComments(cm.data.results || cm.data);

      return getDatasets({ domain: ds.data.domain, sort: 'popular' });
    }).then(rel => {
      const results = rel.data.results || rel.data;
      setRelated(results.filter(d => String(d.id) !== String(id)).slice(0, 4));
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!user) return toast.error('Connectez-vous pour télécharger.');

    try {
      const res = await downloadDataset(id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset.title}.${dataset.file_type || 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);

      const { data } = await getDataset(id);
      setDataset(data);
      toast.success('Téléchargement démarré !');
    } catch {
      toast.error('Erreur lors du téléchargement.');
    }
  };

  const handleRate = async (score) => {
    if (!user) return toast.error('Connectez-vous pour noter.');
    setMyRating(score);
    try {
      await rateDataset(id, score);
      const { data } = await getDataset(id);
      setDataset(data);
      toast.success('Note enregistrée !');
    } catch {
      toast.error('Erreur.');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const { data } = await addComment(id, comment);
      setComments(prev => [data, ...prev]);
      setComment('');
      toast.success('Commentaire ajouté');
    } catch {
      toast.error('Erreur lors du commentaire.');
    }
  };

  const handleDeleteComment = async (cid) => {
    try {
      await deleteComment(cid);
      setComments(prev => prev.filter(c => c.id !== cid));
    } catch {
      toast.error('Erreur.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce dataset ?')) return;
    try {
      await deleteDataset(id);
      toast.success('Dataset supprimé.');
      navigate('/dashboard');
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  if (loading) return <Spinner />;
  if (!dataset) return <div className="page-container"><p>Dataset introuvable.</p></div>;

  const isOwner = user?.id === dataset.uploaded_by?.id;
  const date = new Date(dataset.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' });
  const fileColor = FILE_COLORS[dataset.file_type] || FILE_COLORS.other;
  const cover = dataset.cover_image_url || DOMAIN_COVERS[dataset.domain] || DOMAIN_COVERS.other;

  const isExternalSource = dataset.source && dataset.source !== dataset.uploaded_by?.username;
  const isSourceLink = /^https?:\/\//i.test(dataset.source || '');

  const TABS = [
    { id: 'datacard', label: 'Data Card', icon: <Database size={15} /> },
    { id: 'preview', label: 'Aperçu', icon: <Table2 size={15} /> },
    { id: 'discussion', label: `Discussion (${comments.length})`, icon: <MessageSquare size={15} /> },
  ];

  return (
    <div className="kd-root">
      {/* Top bar */}
      <div className="kd-topbar">
        <div className="kd-topbar-left">
          <div className="kd-breadcrumb">
            <Link to="/datasets">Datasets</Link>
            <span>/</span>
            <span>{dataset.uploaded_by?.username}</span>
            <span>/</span>
            <span className="kd-bc-current">{dataset.title}</span>
          </div>
        </div>
        <div className="kd-topbar-actions">
          <button
            className={`kd-action-btn ${upvoted ? 'active' : ''}`}
            onClick={() => setUpvoted(!upvoted)}
          >
            <ChevronUp size={15} />
            <span>{dataset.ratings_count + (upvoted ? 1 : 0)}</span>
          </button>
          <button className="kd-action-btn" onClick={handleDownload}>
            <Download size={15} />
            <span>Télécharger</span>
          </button>
          {isOwner && (
            <button className="kd-action-btn kd-action-danger" onClick={handleDelete}>
              <Trash2 size={15} />
              <span>Supprimer</span>
            </button>
          )}
          <button className="kd-action-icon"><Share2 size={16} /></button>
          <button className="kd-action-icon"><Bookmark size={16} /></button>
          <button className="kd-action-icon"><MoreHorizontal size={16} /></button>
        </div>
      </div>

      <div className="kd-layout">
        {/* Main column */}
        <div className="kd-main">
          {/* Hero */}
          <div className="kd-hero">
            <div className="kd-hero-cover">
              <img src={cover} alt={dataset.title} onError={e => { e.target.style.display = 'none'; }} />
              <div className="kd-hero-cover-overlay" />
            </div>
            <div className="kd-hero-body">
              <div className="kd-hero-meta-top">
                <span className="kd-domain-pill">{DOMAIN_LABELS[dataset.domain]}</span>
                <span className="kd-type-badge" style={{ background: fileColor }}>
                  {dataset.file_type?.toUpperCase()}
                </span>
              </div>
              <h1 className="kd-title">{dataset.title}</h1>
              <p className="kd-subtitle">
                {dataset.description?.slice(0, 140)}{dataset.description?.length > 140 ? '…' : ''}
              </p>
              <div className="kd-hero-stats">
                <span>
                  <User size={14} />
                  <Link to={`/profile/${dataset.uploaded_by?.username}`} className="kd-author-link">
                    {dataset.uploaded_by?.username}
                  </Link>
                </span>
                <span><Calendar size={14} /> {date}</span>
                <span><Download size={14} /> {dataset.download_count} téléchargements</span>
                <span><Eye size={14} /> {dataset.file_size_display}</span>
                <div className="kd-rating-inline">
                  <StarRating value={Math.round(dataset.avg_rating)} readonly />
                  <span>{dataset.avg_rating}/5 ({dataset.ratings_count})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="kd-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`kd-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="kd-tab-content">
            {/* DATA CARD */}
            {tab === 'datacard' && (
              <div className="kd-datacard">
                <section className="kd-section">
                  <h2 className="kd-section-title">À propos du dataset</h2>
                  <p className="kd-about-text">{dataset.description}</p>
                </section>

                {isExternalSource && (
                  <section className="kd-section">
                    <h2 className="kd-section-title"><Link2 size={16} /> Source des données</h2>
                    {isSourceLink ? (
                      <a
                        href={dataset.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="kd-author-link"
                        style={{ fontSize: 14, wordBreak: 'break-all' }}
                      >
                        {dataset.source} <ExternalLink size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                      </a>
                    ) : (
                      <p className="kd-about-text">{dataset.source}</p>
                    )}
                  </section>
                )}

                {dataset.tags && (
                  <section className="kd-section">
                    <h2 className="kd-section-title">Tags</h2>
                    <div className="kd-tags">
                      {dataset.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                        <span key={t} className="kd-tag">{t}</span>
                      ))}
                    </div>
                  </section>
                )}

                {user && !isOwner && (
                  <section className="kd-section">
                    <h2 className="kd-section-title">Votre note</h2>
                    <div className="kd-rate-box">
                      <StarRating value={myRating} onChange={handleRate} />
                      <p className="kd-rate-hint">
                        {myRating ? `Vous avez noté ${myRating}/5` : 'Cliquez pour noter ce dataset'}
                      </p>
                    </div>
                  </section>
                )}

                {related.length > 0 && (
                  <section className="kd-section">
                    <h2 className="kd-section-title">
                      <TrendingUp size={16} /> Vous aimerez aussi
                    </h2>
                    <p className="kd-related-sub">Datasets populaires dans la même catégorie</p>
                    <div className="kd-related-grid">
                      {related.map(d => <RelatedCard key={d.id} dataset={d} />)}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* PREVIEW */}
            {tab === 'preview' && (
              <div className="kd-preview-tab">
                <div className="kd-file-header">
                  <FileText size={16} />
                  <span className="kd-file-name">
                    {dataset.title}.{dataset.file_type}
                  </span>
                  <span className="kd-file-size">({dataset.file_size_display})</span>
                  <button className="kd-dl-inline" onClick={handleDownload}>
                    <Download size={13} /> Télécharger
                  </button>
                </div>
                <PreviewPanel datasetId={id} />
              </div>
            )}

            {/* DISCUSSION */}
            {tab === 'discussion' && (
              <div className="kd-discussion">
                {user ? (
                  <div className="kd-comment-form-wrap">
                    <div className="kd-comment-avatar">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="kd-comment-input-area">
                      <textarea
                        className="kd-comment-input"
                        placeholder="Partagez votre avis sur ce dataset…"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={3}
                      />
                      <div className="kd-comment-actions">
                        <button
                          className="kd-comment-submit"
                          onClick={handleComment}
                          disabled={!comment.trim()}
                        >
                          <Send size={14} /> Envoyer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="kd-login-prompt">
                    <Link to="/login" className="btn-primary">Connectez-vous pour commenter</Link>
                  </div>
                )}

                <div className="kd-comments-list">
                  {comments.length === 0 ? (
                    <div className="kd-empty-comments">
                      <MessageSquare size={32} />
                      <p>Aucun commentaire. Soyez le premier !</p>
                    </div>
                  ) : comments.map(c => (
                    <div key={c.id} className="kd-comment">
                      <div className="kd-comment-av">
                        {c.user?.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="kd-comment-body">
                        <div className="kd-comment-head">
                          <strong>{c.user?.username}</strong>
                          <span className="kd-comment-date">
                            {new Date(c.created_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                          </span>
                          {user?.id === c.user?.id && (
                            <button
                              className="kd-comment-del"
                              onClick={() => handleDeleteComment(c.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <p className="kd-comment-text">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="kd-sidebar">
          <div className="kd-sidebar-card">
            <div className="kd-usability">
              <span className="kd-usability-label">Usabilité</span>
              <div className="kd-usability-score">
                {Math.round(((dataset.avg_rating / 5) * 10) * 10) / 10 || '—'}
              </div>
            </div>
          </div>

          <div className="kd-sidebar-card">
            <h3 className="kd-sidebar-title">Informations</h3>
            <div className="kd-meta-list">
              <div className="kd-meta-item">
                <span className="kd-meta-key">Licence</span>
                <span className="kd-meta-val">Open Data</span>
              </div>
              <div className="kd-meta-item">
                <span className="kd-meta-key">Domaine</span>
                <span className="kd-meta-val">{DOMAIN_LABELS[dataset.domain]}</span>
              </div>
              <div className="kd-meta-item">
                <span className="kd-meta-key">Format</span>
                <span className="kd-meta-val" style={{ color: fileColor }}>
                  {dataset.file_type?.toUpperCase()}
                </span>
              </div>
              <div className="kd-meta-item">
                <span className="kd-meta-key">Taille</span>
                <span className="kd-meta-val">{dataset.file_size_display}</span>
              </div>
              <div className="kd-meta-item">
                <span className="kd-meta-key">Publié le</span>
                <span className="kd-meta-val">{date}</span>
              </div>
              <div className="kd-meta-item">
                <span className="kd-meta-key">Auteur</span>
                <span className="kd-meta-val">
                  <Link to={`/profile/${dataset.uploaded_by?.username}`} className="kd-author-link">
                    {dataset.uploaded_by?.username}
                  </Link>
                </span>
              </div>
              {isExternalSource && (
                <div className="kd-meta-item">
                  <span className="kd-meta-key">Source</span>
                  <span className="kd-meta-val">
                    {isSourceLink ? (
                      <a href={dataset.source} target="_blank" rel="noopener noreferrer" className="kd-author-link">
                        Lien externe
                      </a>
                    ) : (
                      dataset.source
                    )}
                  </span>
                </div>
              )}
              {dataset.uploaded_by?.institution && (
                <div className="kd-meta-item">
                  <span className="kd-meta-key">Institution</span>
                  <span className="kd-meta-val">{dataset.uploaded_by.institution}</span>
                </div>
              )}
            </div>
          </div>

          <div className="kd-sidebar-card">
            <h3 className="kd-sidebar-title">Résumé</h3>
            <div className="kd-summary-stats">
              <div className="kd-sum-item">
                <Download size={16} />
                <div>
                  <strong>{dataset.download_count}</strong>
                  <span>Téléchargements</span>
                </div>
              </div>
              <div className="kd-sum-item">
                <Star size={16} />
                <div>
                  <strong>{dataset.avg_rating}/5</strong>
                  <span>{dataset.ratings_count} notes</span>
                </div>
              </div>
              <div className="kd-sum-item">
                <MessageSquare size={16} />
                <div>
                  <strong>{comments.length}</strong>
                  <span>Commentaires</span>
                </div>
              </div>
            </div>
          </div>

          {dataset.tags && (
            <div className="kd-sidebar-card">
              <h3 className="kd-sidebar-title">Tags</h3>
              <div className="kd-tags" style={{ gap: 6 }}>
                {dataset.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t} className="kd-tag">{t}</span>
                ))}
              </div>
            </div>
          )}

          <button className="kd-dl-cta" onClick={handleDownload}>
            <Download size={18} />
            Télécharger ({dataset.file_size_display})
          </button>
        </aside>
      </div>
    </div>
  );
}