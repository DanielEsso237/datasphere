import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register } from '../services/api'
import { Database, Mail, Lock, User, Building, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ username:'', email:'', password:'', password2:'', role:'student', institution:'' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm({...form, [k]: e.target.value})

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) return toast.error('Les mots de passe ne correspondent pas.')
    setLoading(true)
    try {
      const { data } = await register(form)
      loginUser(data.tokens, data.user)
      toast.success('Compte créé avec succès !')
      navigate('/dashboard')
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        Object.values(errors).flat().forEach(msg => toast.error(msg))
      } else {
        toast.error('Erreur lors de l\'inscription.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="auth-logo"><Database size={32}/><span>DataSphere</span></div>
        <h2>Créer un compte</h2>
        <p className="auth-sub">Rejoignez la communauté scientifique africaine</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="fields-row">
            <div className="field">
              <label>Nom d'utilisateur</label>
              <div className="input-wrap"><User size={16}/>
                <input placeholder="Toubet" value={form.username} onChange={set('username')} required/>
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <div className="input-wrap"><Mail size={16}/>
                <input type="email" placeholder="vous@exemple.com" value={form.email} onChange={set('email')} required/>
              </div>
            </div>
          </div>

          <div className="field">
            <label>Rôle</label>
            <div className="role-select">
              {[['student','Étudiant'],['researcher','Chercheur']].map(([val, label]) => (
                <label key={val} className={`role-opt ${form.role === val ? 'active' : ''}`}>
                  <input type="radio" name="role" value={val} checked={form.role === val} onChange={set('role')}/>
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Institution (optionnel)</label>
            <div className="input-wrap"><Building size={16}/>
              <input placeholder="Université d'Ebolowa" value={form.institution} onChange={set('institution')}/>
            </div>
          </div>

          <div className="fields-row">
            <div className="field">
              <label>Mot de passe</label>
              <div className="input-wrap"><Lock size={16}/>
                <input type={showPwd ? 'text' : 'password'} placeholder="8 caractères min." value={form.password} onChange={set('password')} required minLength={8}/>
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="pwd-toggle">
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <div className="field">
              <label>Confirmer</label>
              <div className="input-wrap"><Lock size={16}/>
                <input type="password" placeholder="••••••••" value={form.password2} onChange={set('password2')} required/>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-link">Déjà un compte ? <Link to="/login">Se connecter</Link></p>
      </div>
    </div>
  )
}
