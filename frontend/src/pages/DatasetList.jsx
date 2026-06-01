import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { getDatasets } from '../services/api'
import Spinner from '../components/Spinner'
import UploadDrawer from '../components/UploadDrawer'
import { useAuth } from '../context/AuthContext'
import {
  Search, SlidersHorizontal, TrendingUp, Clock,
  Download, ChevronUp, Plus, Database, LayoutGrid, List, Star
} from 'lucide-react'
import toast from 'react-hot-toast'

const DOMAIN_COVERS = {
  health:      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=70',
  agriculture: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=70',
  education:   'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=70',
  environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=70',
  economy:     'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=70',
  technology:  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=70',
  social:      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=70',
  physics:     'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=70',
  biology:     'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=70',
  other:       'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=70',
}

const DOMAIN_PILLS = [
  { value: '',            label: 'Tous les datasets' },
  { value: 'health',      label: 'Santé' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'education',   label: 'Éducation' },
  { value: 'environment', label: 'Environnement' },
  { value: 'economy',     label: 'Économie' },
  { value: 'technology',  label: 'Technologie' },
  { value: 'biology',     label: 'Biologie' },
  { value: 'physics',     label: 'Physique' },
  { value: 'social',      label: 'Sc. Sociales' },
  { value: 'other',       label: 'Autre' },
]

const FILE_COLORS = {
  csv: '#22c55e', json: '#f59e0b', xlsx: '#3b82f6', txt: '#8b5cf6', other: '#6b7280',
}

function getCover(dataset) {
  // Si le dataset a une image de couverture uploadée, on la préfère
  if (dataset.cover_image_url) return dataset.cover_image_url
  return DOMAIN_COVERS[dataset.domain] || DOMAIN_COVERS.other
}

function DatasetCard({ dataset, view }) {
  const navigate = useNavigate()
  const cover    = getCover(dataset)
  const fileColor = FILE_COLORS[dataset.file_type] || '#6b7280'

  if (view === 'list') {
    return (
      <div className="ds-list-card" onClick={() => navigate(`/datasets/${dataset.id}`)}>
        <div className="ds-list-cover">
          <img src={cover} alt="" onError={e => { e.target.style.display = 'none' }} />
        </div>
        <div className="ds-list-body">
          <div className="ds-list-top">
            <h3 className="ds-list-title">{dataset.title}</h3>
            <button className="ds-more-btn" onClick={e => e.stopPropagation()}>···</button>
          </div>
          <p className="ds-list-author">{dataset.uploaded_by?.username}</p>
          <p className="ds-list-meta">
            <span className="ds-badge" style={{ background: fileColor }}>
              {dataset.file_type?.toUpperCase()}
            </span>
            <span>{dataset.file_size_display}</span>
            <span>·</span>
            <span>{dataset.download_count} téléchargements</span>
          </p>
          <p className="ds-list-desc">{dataset.description?.slice(0, 120)}…</p>
        </div>
        <div className="ds-list-actions">
          <button className="ds-upvote-btn" onClick={e => e.stopPropagation()}>
            <ChevronUp size={14} /><span>{dataset.ratings_count || 0}</span>
          </button>
          <div className="ds-avatar-sm">{dataset.uploaded_by?.username?.[0]?.toUpperCase()}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="ds-grid-card" onClick={() => navigate(`/datasets/${dataset.id}`)}>
      <div className="ds-card-cover">
        <img src={cover} alt="" onError={e => { e.target.style.background = '#1a1e28' }} />
        <div className="ds-card-cover-overlay" />
        <button className="ds-more-btn cover-more" onClick={e => e.stopPropagation()}>···</button>
      </div>
      <div className="ds-card-body">
        <h3 className="ds-card-title">{dataset.title}</h3>
        <p className="ds-card-author">{dataset.uploaded_by?.username}</p>
        <div className="ds-card-meta-row">
          <span className="ds-badge" style={{ background: fileColor }}>
            {dataset.file_type?.toUpperCase()}
          </span>
          <span className="ds-meta-text">{dataset.file_size_display}</span>
          <span className="ds-meta-text">· {dataset.download_count} dl</span>
        </div>
        <div className="ds-card-footer">
          <button className="ds-upvote-btn" onClick={e => e.stopPropagation()}>
            <ChevronUp size={14} /><span>{dataset.ratings_count || 0}</span>
          </button>
          <div className="ds-avatar-sm">{dataset.uploaded_by?.username?.[0]?.toUpperCase()}</div>
        </div>
      </div>
    </div>
  )
}

export default function DatasetList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [datasets, setDatasets]       = useState([])
  const [trending, setTrending]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(1)
  const [view, setView]               = useState('grid')
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [showDrawer, setShowDrawer]   = useState(false)

  const search = searchParams.get('search') || ''
  const domain = searchParams.get('domain') || ''
  const sort   = searchParams.get('sort')   || 'newest'

  // Ouvrir le drawer si URL contient ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') setShowDrawer(true)
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getDatasets({ search, domain, sort, page }),
      getDatasets({ sort: 'popular', page: 1 }),
    ]).then(([main, pop]) => {
      setDatasets(main.data.results || main.data)
      setTotal(main.data.count || 0)
      setTrending((pop.data.results || pop.data).slice(0, 4))
    }).finally(() => setLoading(false))
  }, [search, domain, sort, page])

  const updateParam = (key, val) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val); else p.delete(key)
    p.delete('page')
    setPage(1)
    setSearchParams(p)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateParam('search', searchInput)
  }

  const handleNewDataset = () => {
    if (!user) { toast.error('Connectez-vous pour publier un dataset.'); return }
    setShowDrawer(true)
  }

  const totalPages = Math.ceil(total / 12)

  return (
    <div className="dl-root">
      {/* ── Drawer ── */}
      {showDrawer && (
        <UploadDrawer
          onClose={() => setShowDrawer(false)}
          onSuccess={() => {
            setShowDrawer(false)
            // refresh
            setPage(1)
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className="dl-sidebar">
        <button className="dl-create-btn" onClick={handleNewDataset}>
          <Plus size={18} /> Nouveau dataset
        </button>
        <nav className="dl-nav">
          <Link to="/"         className="dl-nav-item"><Database size={18} /> Accueil</Link>
          <Link to="/datasets" className="dl-nav-item active"><TrendingUp size={18} /> Explorer</Link>
          <Link to="/dashboard" className="dl-nav-item"><Star size={18} /> Mon espace</Link>
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="dl-main">

        {/* Hero (sans filtre actif) */}
        {!search && !domain && (
          <div className="dl-hero">
            <div className="dl-hero-text">
              <h1 className="dl-hero-title">Datasets</h1>
              <p className="dl-hero-sub">
                Explorez, analysez et partagez des données scientifiques africaines.{' '}
                <Link to="/register" className="dl-hero-link">En savoir plus</Link> sur DataSphere.
              </p>
              <button className="dl-hero-cta" onClick={handleNewDataset}>
                <Plus size={16} /> Nouveau dataset
              </button>
            </div>
            <div className="dl-hero-illustration">
              <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="40" width="70" height="90" rx="6" fill="#1e2433" stroke="#2a3148" strokeWidth="1.5"/>
                <rect x="30" y="55" width="50" height="6" rx="2" fill="#3b82f6" opacity=".7"/>
                <rect x="30" y="67" width="38" height="4" rx="2" fill="#4b5563" opacity=".6"/>
                <rect x="30" y="77" width="44" height="4" rx="2" fill="#4b5563" opacity=".5"/>
                <rect x="30" y="87" width="30" height="4" rx="2" fill="#4b5563" opacity=".4"/>
                <rect x="30" y="100" width="50" height="18" rx="3" fill="#3b82f6" opacity=".15"/>
                <rect x="110" y="20" width="70" height="55" rx="6" fill="#1e2433" stroke="#2a3148" strokeWidth="1.5"/>
                <rect x="120" y="32" width="50" height="5" rx="2" fill="#22c55e" opacity=".7"/>
                <rect x="120" y="43" width="30" height="4" rx="2" fill="#4b5563" opacity=".5"/>
                <rect x="120" y="53" width="42" height="4" rx="2" fill="#4b5563" opacity=".4"/>
                <rect x="110" y="90" width="70" height="55" rx="6" fill="#1e2433" stroke="#2a3148" strokeWidth="1.5"/>
                <circle cx="135" cy="112" r="14" fill="#f59e0b" opacity=".15"/>
                <circle cx="135" cy="112" r="8" fill="#f59e0b" opacity=".3"/>
                <rect x="155" y="103" width="18" height="4" rx="2" fill="#4b5563" opacity=".5"/>
                <rect x="155" y="113" width="12" height="4" rx="2" fill="#4b5563" opacity=".4"/>
              </svg>
            </div>
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="dl-searchbar">
          <Search size={18} className="dl-search-icon" />
          <input
            className="dl-search-input"
            placeholder="Rechercher des datasets…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="button" className="dl-filter-btn">
            <SlidersHorizontal size={16} /> Filtres
          </button>
        </form>

        {/* Domain pills */}
        <div className="dl-pills">
          {DOMAIN_PILLS.map(d => (
            <button
              key={d.value}
              className={`dl-pill ${domain === d.value ? 'active' : ''}`}
              onClick={() => updateParam('domain', d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Trending */}
        {!search && !domain && trending.length > 0 && (
          <section className="dl-section">
            <div className="dl-section-header">
              <span className="dl-section-title">
                <TrendingUp size={18} /> Datasets tendance
              </span>
              <button className="dl-see-all" onClick={() => updateParam('sort', 'popular')}>
                Voir tout
              </button>
            </div>
            <div className="dl-trending-grid">
              {trending.map(d => <DatasetCard key={d.id} dataset={d} view="grid" />)}
            </div>
          </section>
        )}

        {/* All datasets */}
        <section className="dl-section">
          <div className="dl-section-header">
            <span className="dl-section-title">
              <Clock size={18} />
              {search || domain
                ? `${total} résultat${total !== 1 ? 's' : ''}`
                : 'Tous les datasets'}
            </span>
            <div className="dl-view-sort">
              <select
                className="dl-sort-select"
                value={sort}
                onChange={e => updateParam('sort', e.target.value)}
              >
                <option value="newest">Plus récents</option>
                <option value="popular">Plus populaires</option>
                <option value="oldest">Plus anciens</option>
              </select>
              <button className={`dl-view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>
                <LayoutGrid size={16} />
              </button>
              <button className={`dl-view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
                <List size={16} />
              </button>
            </div>
          </div>

          {loading ? <Spinner /> : datasets.length === 0 ? (
            <div className="empty-state">
              <span>🔍</span>
              <h3>Aucun dataset trouvé</h3>
              <p>Essayez d'autres termes ou filtres.</p>
            </div>
          ) : (
            <div className={view === 'grid' ? 'dl-grid' : 'dl-list'}>
              {datasets.map(d => <DatasetCard key={d.id} dataset={d} view={view} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-ghost">
                ← Précédent
              </button>
              <span>Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="btn-ghost">
                Suivant →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}