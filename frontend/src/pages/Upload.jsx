import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDataset } from '../services/api'
import { Upload as UploadIcon, FileText, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const DOMAINS = [
  { value:'health', label:'🏥 Santé' }, { value:'agriculture', label:'🌾 Agriculture' },
  { value:'education', label:'📚 Éducation' }, { value:'environment', label:'🌿 Environnement' },
  { value:'economy', label:'📈 Économie' }, { value:'technology', label:'💻 Technologie' },
  { value:'biology', label:'🔬 Biologie' }, { value:'physics', label:'⚛️ Physique' },
  { value:'social', label:'👥 Sc. Sociales' }, { value:'other', label:'📦 Autre' },
]

export default function Upload() {
  const [form, setForm] = useState({ title:'', description:'', domain:'other', tags:'' })
  const [file, setFile] = useState(null)
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = k => e => setForm({...form, [k]: e.target.value})

  const handleFile = (f) => {
    const allowed = ['text/csv','application/json','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain']
    if (!allowed.includes(f.type) && !f.name.match(/\.(csv|json|xlsx|xls|txt)$/i)) {
      return toast.error('Format non supporté (CSV, JSON, Excel, TXT uniquement)')
    }
    if (f.size > 50 * 1024 * 1024) return toast.error('Fichier trop volumineux (max 50MB)')
    setFile(f)
  }

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Veuillez sélectionner un fichier.')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.append('file', file)
    setLoading(true)
    try {
      const { data } = await createDataset(fd)
      toast.success('Dataset publié avec succès !')
      navigate(`/datasets/${data.id}`)
    } catch (err) {
      const errors = err.response?.data
      if (errors) Object.values(errors).flat().forEach(m => toast.error(m))
      else toast.error('Erreur lors de la publication.')
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`

  return (
    <div className="page-container upload-page">
      <div className="upload-header">
        <h1><UploadIcon size={28}/> Publier un dataset</h1>
        <p>Partagez vos données avec la communauté scientifique africaine</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        {/* Drop zone */}
        <div className={`dropzone ${drag ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => !file && document.getElementById('file-input').click()}>
          <input id="file-input" type="file" accept=".csv,.json,.xlsx,.xls,.txt" hidden
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])}/>
          {file ? (
            <div className="file-preview">
              <CheckCircle size={32} className="text-green"/>
              <div>
                <p className="file-name"><FileText size={16}/> {file.name}</p>
                <p className="file-size">{formatSize(file.size)}</p>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }} className="btn-icon">
                <X size={18}/>
              </button>
            </div>
          ) : (
            <>
              <UploadIcon size={40} className="drop-icon"/>
              <p>Glissez votre fichier ici ou <span className="link">cliquez pour parcourir</span></p>
              <p className="drop-hint">CSV, JSON, Excel, TXT · Max 50MB</p>
            </>
          )}
        </div>

        {/* Metadata */}
        <div className="form-grid">
          <div className="field full">
            <label>Titre du dataset *</label>
            <input placeholder="Ex: Données sur la malnutrition au Cameroun 2023"
              value={form.title} onChange={set('title')} required/>
          </div>

          <div className="field">
            <label>Domaine scientifique *</label>
            <select value={form.domain} onChange={set('domain')} required>
              {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Tags (séparés par des virgules)</label>
            <input placeholder="nutrition, cameroun, 2023, santé publique"
              value={form.tags} onChange={set('tags')}/>
          </div>

          <div className="field full">
            <label>Description *</label>
            <textarea placeholder="Décrivez votre dataset : source, méthodologie, contenu, période couverte…"
              value={form.description} onChange={set('description')} rows={5} required/>
          </div>
        </div>

        <button type="submit" className="btn-primary btn-large" disabled={loading || !file}>
          {loading ? 'Publication en cours…' : <><UploadIcon size={18}/> Publier le dataset</>}
        </button>
      </form>
    </div>
  )
}
