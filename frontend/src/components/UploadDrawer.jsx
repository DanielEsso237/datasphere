import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDataset } from '../services/api'
import {
  X, FileText, CheckCircle, Upload as UploadIcon,
  Plus, Trash2, Image as ImageIcon, File
} from 'lucide-react'
import toast from 'react-hot-toast'

const DOMAINS = [
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

const ALLOWED_DATA = ['text/csv', 'application/json', 'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
const ALLOWED_IMG  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const formatSize = (b) =>
  b < 1024 ? `${b} B`
  : b < 1048576 ? `${(b / 1024).toFixed(1)} KB`
  : `${(b / 1048576).toFixed(1)} MB`

// ─── Tab: Fichier upload ────────────────────────────────────────────
function FileTab({ files, onAdd, onRemove, coverImg, onCoverImg, onCoverRemove }) {
  const fileRef  = useRef()
  const coverRef = useRef()
  const [drag, setDrag]       = useState(false)
  const [dragCover, setDragCover] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false)
    Array.from(e.dataTransfer.files).forEach(f => onAdd(f))
  }
  const handleCoverDrop = (e) => {
    e.preventDefault(); setDragCover(false)
    const f = e.dataTransfer.files[0]
    if (f) onCoverImg(f)
  }

  return (
    <div className="upl-file-tab">

      {/* ── Fichiers data déjà ajoutés ── */}
      {files.length > 0 && (
        <div className="upl-file-list">
          {files.map((f, i) => (
            <div key={i} className="upl-file-row">
              <File size={16} className="upl-file-icon" />
              <span className="upl-file-name">{f.name}</span>
              <span className="upl-file-size">{formatSize(f.size)}</span>
              <button className="upl-file-rm" onClick={() => onRemove(i)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Drop zone data ── */}
      <div
        className={`upl-dropzone ${drag ? 'drag' : ''}`}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current.click()}
      >
        <input
          ref={fileRef} type="file" hidden multiple
          accept=".csv,.json,.txt,.xlsx,.xls"
          onChange={e => Array.from(e.target.files).forEach(f => onAdd(f))}
        />
        <div className="upl-dropzone-icon">⊞</div>
        <p className="upl-dropzone-title">
          {files.length > 0 ? 'Glisser d\'autres fichiers' : 'Glisser & déposer les fichiers'}
        </p>
        <p className="upl-dropzone-hint">CSV, JSON, TXT · Max 50 MB chacun</p>
        <button type="button" className="upl-add-file-btn" onClick={e => { e.stopPropagation(); fileRef.current.click() }}>
          <Plus size={15} /> {files.length > 0 ? 'Ajouter un autre fichier' : 'Choisir un fichier'}
        </button>
      </div>

      {/* ── Image de couverture ── */}
      <div className="upl-cover-section">
        <label className="upl-field-label">Image de couverture <span className="upl-optional">(optionnel)</span></label>
        <p className="upl-cover-hint">Cette image apparaîtra sur la card du dataset dans la liste.</p>

        {coverImg ? (
          <div className="upl-cover-preview">
            <img src={URL.createObjectURL(coverImg)} alt="cover" className="upl-cover-img" />
            <div className="upl-cover-info">
              <span className="upl-file-name">{coverImg.name}</span>
              <span className="upl-file-size">{formatSize(coverImg.size)}</span>
            </div>
            <button className="upl-file-rm" onClick={onCoverRemove}>
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div
            className={`upl-cover-drop ${dragCover ? 'drag' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragCover(true) }}
            onDragLeave={() => setDragCover(false)}
            onDrop={handleCoverDrop}
            onClick={() => coverRef.current.click()}
          >
            <input
              ref={coverRef} type="file" hidden
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={e => e.target.files[0] && onCoverImg(e.target.files[0])}
            />
            <ImageIcon size={28} className="upl-cover-icon" />
            <p>Glisser une image ou <span className="upl-link">parcourir</span></p>
            <p className="upl-dropzone-hint">JPG, PNG, WEBP · Max 5 MB</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Upload Drawer ─────────────────────────────────────────────
export default function UploadDrawer({ onClose }) {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('file') // 'file' | 'code'
  const [form, setForm] = useState({
    title: '', description: '', domain: 'other', tags: '', visibility: 'public', source: '',
  })
  const [files,    setFiles]    = useState([])
  const [coverImg, setCoverImg] = useState(null)
  const [contributors, setContributors] = useState([''])
  const [loading,  setLoading]  = useState(false)
  const [titleError, setTitleError] = useState(false)

  const set = k => e => setForm({ ...form, [k]: e.target.value })

  const addFile = (f) => {
    if (!ALLOWED_DATA.includes(f.type) && !f.name.match(/\.(csv|json|txt|xlsx|xls)$/i)) {
      return toast.error('Format non supporté (CSV, JSON, TXT uniquement)')
    }
    if (f.size > 50 * 1024 * 1024) return toast.error('Fichier trop volumineux (max 50 MB)')
    setFiles(prev => [...prev, f])
  }

  const addCover = (f) => {
    if (!ALLOWED_IMG.includes(f.type)) return toast.error('Format image non supporté')
    if (f.size > 5 * 1024 * 1024)     return toast.error('Image trop volumineuse (max 5 MB)')
    setCoverImg(f)
  }

  const updateContributor = (i, value) =>
    setContributors(prev => prev.map((c, idx) => idx === i ? value : c))

  const addContributor = () => setContributors(prev => [...prev, ''])

  const removeContributor = (i) =>
    setContributors(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!form.title.trim()) { setTitleError(true); return }
    if (files.length === 0) { toast.error('Ajoutez au moins un fichier.'); return }

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.append('file', files[0]) // le backend attend "file" pour le 1er
    if (coverImg) fd.append('cover_image', coverImg)

    const cleanedContributors = contributors.map(c => c.trim()).filter(Boolean)
    if (cleanedContributors.length) fd.append('contributors', cleanedContributors.join(','))

    setLoading(true)
    try {
      const { data } = await createDataset(fd)
      toast.success('Dataset publié avec succès !')
      onClose?.()
      navigate(`/datasets/${data.id}`)
    } catch (err) {
      const errors = err.response?.data
      if (errors) Object.values(errors).flat().forEach(m => toast.error(m))
      else toast.error('Erreur lors de la publication.')
    } finally {
      setLoading(false)
    }
  }

  const TABS = [
    { id: 'file', label: 'Fichier' },
    { id: 'code', label: 'Code' },
  ]

  return (
    <>
      {/* ── Backdrop ── */}
      <div className="upl-backdrop" onClick={onClose} />

      {/* ── Drawer panel ── */}
      <div className="upl-drawer">
        {/* Header */}
        <div className="upl-drawer-header">
          <button className="upl-close" onClick={onClose}><X size={20} /></button>
          <h2 className="upl-drawer-title">Publier un dataset</h2>
        </div>

        {/* Tabs */}
        <div className="upl-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`upl-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="upl-drawer-body">

          {activeTab === 'file' && (
            <>
              {/* ── Title ── */}
              <div className={`upl-field ${titleError ? 'error' : ''}`}>
                <label className="upl-field-label upl-required">TITRE DU DATASET</label>
                <input
                  className="upl-input"
                  placeholder="Saisir le titre du dataset"
                  value={form.title}
                  onChange={e => { setTitleError(false); set('title')(e) }}
                />
                {titleError && <span className="upl-error-msg">Veuillez saisir un titre.</span>}
              </div>

              {/* ── Domaine + Visibilité ── */}
              <div className="upl-row-2">
                <div className="upl-field">
                  <label className="upl-field-label">DOMAINE</label>
                  <select className="upl-select" value={form.domain} onChange={set('domain')}>
                    {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div className="upl-field">
                  <label className="upl-field-label">VISIBILITÉ</label>
                  <select className="upl-select" value={form.visibility} onChange={set('visibility')}>
                    <option value="public">Public</option>
                    <option value="private">Privé</option>
                  </select>
                </div>
              </div>

              {/* ── Description ── */}
              <div className="upl-field">
                <label className="upl-field-label">DESCRIPTION</label>
                <textarea
                  className="upl-textarea"
                  placeholder="Décrivez votre dataset : source, méthodologie, contenu…"
                  value={form.description}
                  onChange={set('description')}
                  rows={3}
                />
              </div>

              {/* ── Tags ── */}
              <div className="upl-field">
                <label className="upl-field-label">TAGS <span className="upl-optional">(séparés par des virgules)</span></label>
                <input
                  className="upl-input"
                  placeholder="nutrition, cameroun, 2023…"
                  value={form.tags}
                  onChange={set('tags')}
                />
              </div>

              {/* ── Source ── */}
              <div className="upl-field">
                <label className="upl-field-label">SOURCE <span className="upl-optional">(optionnel)</span></label>
                <input
                  className="upl-input"
                  placeholder="Votre nom si vous êtes l'auteur, ou lien/nom de la source originale"
                  value={form.source}
                  onChange={set('source')}
                />
                <span className="upl-cover-hint">
                  Laissez vide si vous êtes l'auteur original du dataset. Sinon, indiquez d'où viennent
                  les données (organisme, site, lien…).
                </span>
              </div>

              {/* ── Contributeurs ── */}
              <div className="upl-field">
                <label className="upl-field-label">
                  CONTRIBUTEURS <span className="upl-optional">(optionnel)</span>
                </label>
                <span className="upl-cover-hint">
                  Les personnes qui ont contribué à faire évoluer ce dataset.
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                  {contributors.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        className="upl-input"
                        placeholder="Nom du contributeur"
                        value={c}
                        onChange={e => updateContributor(i, e.target.value)}
                      />
                      {contributors.length > 1 && (
                        <button
                          type="button"
                          className="upl-file-rm"
                          onClick={() => removeContributor(i)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="upl-add-file-btn"
                  onClick={addContributor}
                  style={{ marginTop: 8 }}
                >
                  <Plus size={15} /> Ajouter un contributeur
                </button>
              </div>

              {/* ── File zone + cover ── */}
              <div className="upl-section-divider">FICHIERS</div>
              <FileTab
                files={files}
                onAdd={addFile}
                onRemove={i => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                coverImg={coverImg}
                onCoverImg={addCover}
                onCoverRemove={() => setCoverImg(null)}
              />
            </>
          )}

          {activeTab === 'code' && (
            <div className="upl-code-tab">
              <p className="upl-code-intro">
                Utilisez l'API DataSphere pour publier depuis votre environnement Python.
              </p>
              <div className="upl-code-block">
                <pre>{`import requests

headers = {"Authorization": "Bearer VOTRE_TOKEN"}

files = {"file": open("dataset.csv", "rb")}
data  = {
    "title":       "Mon dataset",
    "description": "Description…",
    "domain":      "health",
    "tags":        "tag1,tag2",
    "source":      "",
    "contributors": "Alice,Bob",
}

r = requests.post(
    "http://localhost:8000/api/datasets/create/",
    headers=headers,
    files=files,
    data=data,
)
print(r.json())`}</pre>
              </div>
              <p className="upl-code-note">
                Remplacez <code>VOTRE_TOKEN</code> par votre access token JWT disponible après connexion.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="upl-drawer-footer">
          <button className="upl-btn-reset" onClick={() => {
            setForm({ title: '', description: '', domain: 'other', tags: '', visibility: 'public', source: '' })
            setFiles([]); setCoverImg(null); setTitleError(false)
            setContributors([''])
          }}>
            Réinitialiser
          </button>
          <button
            className="upl-btn-create"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Publication…' : 'Publier'}
          </button>
        </div>
      </div>
    </>
  )
}