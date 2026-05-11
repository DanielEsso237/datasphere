import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="page-container" style={{textAlign:'center', padding:'80px 20px'}}>
      <div style={{fontSize:'80px'}}></div>
      <h1 style={{fontSize:'48px'}}>404</h1>
      <p style={{fontSize:'18px', marginBottom:'32px'}}>Cette page n'existe pas.</p>
      <Link to="/" className="btn-primary">Retour à l'accueil</Link>
    </div>
  )
}
