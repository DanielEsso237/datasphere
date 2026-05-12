import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login, getMe } from '../services/api'
import { Database, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await login(form)
      localStorage.setItem('access_token', data.access)
      const meRes = await getMe()
      loginUser({ access: data.access, refresh: data.refresh }, meRes.data)
      toast.success('Connexion réussie !')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><Database size={32}/><span>DataSphere</span></div>
        <h2>Connexion</h2>
        <p className="auth-sub">Accédez à votre espace chercheur</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Email</label>
            <div className="input-wrap">
              <Mail size={16}/>
              <input type="email" placeholder="vous@exemple.com" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} required/>
            </div>
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <div className="input-wrap">
              <Lock size={16}/>
              <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})} required/>
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="pwd-toggle">
                {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-link">Pas encore de compte ? <Link to="/register">S'inscrire</Link></p>
      </div>
    </div>
  )
}
