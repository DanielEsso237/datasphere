import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateMe } from '../services/api'
import { User, Building, FileText, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditProfile() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    institution: user?.institution || '',
  })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await updateMe(form)
      setUser(data)
      toast.success('Profil mis à jour !')
      navigate('/dashboard')
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        Object.values(errors).flat().forEach(msg => toast.error(msg))
      } else {
        toast.error('Erreur lors de la mise à jour.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-ghost btn-sm"
          style={{ marginBottom: 20, alignSelf: 'flex-start' }}
        >
          <ArrowLeft size={15} /> Retour au tableau de bord
        </button>

        <h2 style={{ textAlign: 'center', marginBottom: 4 }}>Modifier le profil</h2>
        <p className="auth-sub">Mettez à jour vos informations personnelles</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Nom d'utilisateur</label>
            <div className="input-wrap">
              <User size={16} />
              <input
                placeholder="Votre nom d'utilisateur"
                value={form.username}
                onChange={set('username')}
                required
                minLength={3}
              />
            </div>
          </div>

          <div className="field">
            <label>Institution</label>
            <div className="input-wrap">
              <Building size={16} />
              <input
                placeholder="Université, labo, organisation…"
                value={form.institution}
                onChange={set('institution')}
              />
            </div>
          </div>

          <div className="field">
            <label>Bio</label>
            <div style={{ position: 'relative' }}>
              <textarea
                placeholder="Parlez de vous, de vos recherches, de vos intérêts…"
                value={form.bio}
                onChange={set('bio')}
                rows={4}
                style={{ paddingLeft: 14 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button
              type="button"
              className="btn-outline"
              style={{ flex: 1 }}
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}