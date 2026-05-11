import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getDatasets } from '../services/api'
import DatasetCard from '../components/DatasetCard'
import Spinner from '../components/Spinner'
import { Search, Filter, X } from 'lucide-react'

const DOMAINS = [
  { value:'', label:'Tous les domaines' },
  { value:'health', label:'Santé' },
  { value:'agriculture', label:'Agriculture' },
  { value:'education', label:'Éducation' },
  { value:'environment', label:'Environnement' },
  { value:'economy', label:'Économie' },
  { value:'technology', label:'Technologie' },
  { value:'biology', label:'Biologie' },
  { value:'physics', label:'Physique' },
  { value:'social', label:'Sc. Sociales' },
  { value:'other', label:'Autre' },
]

export default function DatasetList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const search = searchParams.get('search') || ''
  const domain = searchParams.get('domain') || ''
  const sort = searchParams.get('sort') || 'newest'

  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    setLoading(true)
    getDatasets({ search, domain, sort, page })
      .then(({ data }) => {
        setDatasets(data.results || data)
        setTotal(data.count || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
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

  const clearAll = () => {
    setSearchInput('')
    setSearchParams({})
    setPage(1)
  }

  const hasFilters = search || domain || sort !== 'newest'
  const totalPages = Math.ceil(total / 12)

  return (
    <div className="page-container">
      <div className="list-header">
        <div>
          <h1>Explorer les datasets</h1>
          <p>{total} dataset{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-wrap">
            <Search size={16}/>
            <input placeholder="Rechercher un dataset…" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}/>
            {searchInput && <button type="button" onClick={() => { setSearchInput(''); updateParam('search', '') }} className="clear-btn"><X size={14}/></button>}
          </div>
          <button type="submit" className="btn-primary">Rechercher</button>
        </form>

        <div className="filters-row">
          <div className="filter-group">
            <Filter size={15}/>
            <select value={domain} onChange={e => updateParam('domain', e.target.value)}>
              {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select value={sort} onChange={e => updateParam('sort', e.target.value)}>
              <option value="newest">Plus récents</option>
              <option value="oldest">Plus anciens</option>
              <option value="popular">Plus populaires</option>
            </select>
          </div>
          {hasFilters && <button onClick={clearAll} className="btn-ghost">Réinitialiser</button>}
        </div>
      </div>

      {/* Results */}
      {loading ? <Spinner /> : (
        <>
          {datasets.length === 0 ? (
            <div className="empty-state">
              <h3>Aucun dataset trouvé</h3>
              <p>Essayez d'autres filtres ou termes de recherche.</p>
            </div>
          ) : (
            <div className="datasets-grid">
              {datasets.map(d => <DatasetCard key={d.id} dataset={d}/>)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-ghost">← Précédent</button>
              <span>Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="btn-ghost">Suivant →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
