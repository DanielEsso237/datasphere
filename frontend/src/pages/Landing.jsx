import { Link } from 'react-router-dom'
import { Database, Upload, Search, Star, ArrowRight, Globe, Users, BarChart2 } from 'lucide-react'

export default function Landing() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">🌍 Plateforme africaine de données scientifiques</div>
          <h1>Partagez la connaissance,<br/><span className="gradient-text">accélérez la recherche</span></h1>
          <p className="hero-sub">
            DataSphere connecte chercheurs et étudiants africains autour de datasets scientifiques
            ouverts. Publiez, explorez, collaborez.
          </p>
          <div className="hero-actions">
            <Link to="/datasets" className="btn-primary">
              Explorer les datasets <ArrowRight size={18}/>
            </Link>
            <Link to="/register" className="btn-outline">
              Rejoindre la communauté
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-band">
        <div className="stat"><span className="stat-num">500+</span><span>Datasets</span></div>
        <div className="stat"><span className="stat-num">1 200+</span><span>Chercheurs</span></div>
        <div className="stat"><span className="stat-num">10</span><span>Domaines</span></div>
        <div className="stat"><span className="stat-num">15+</span><span>Pays</span></div>
      </section>

      {/* Features */}
      <section className="features">
        <h2 className="section-title">Tout ce dont vous avez besoin</h2>
        <div className="features-grid">
          {[
            { icon: <Upload size={28}/>, title: 'Publiez vos données', desc: 'Partagez vos datasets CSV, JSON ou Excel avec toute la communauté scientifique.' },
            { icon: <Search size={28}/>, title: 'Recherche avancée', desc: 'Filtrez par domaine, auteur ou popularité. Trouvez exactement ce que vous cherchez.' },
            { icon: <BarChart2 size={28}/>, title: 'Aperçu instantané', desc: 'Visualisez les premières lignes et statistiques sans télécharger.' },
            { icon: <Star size={28}/>, title: 'Notez & commentez', desc: 'Évaluez la qualité des datasets et échangez avec les auteurs.' },
            { icon: <Globe size={28}/>, title: 'Accès libre', desc: 'Tous les datasets sont accessibles. La science ouverte pour tous.' },
            { icon: <Users size={28}/>, title: 'Communauté', desc: 'Rejoignez des étudiants et chercheurs de toute l\'Afrique.' },
          ].map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Domains */}
      <section className="domains">
        <h2 className="section-title">Explorez par domaine</h2>
        <div className="domains-grid">
          {[
            { label:'Santé', emoji:'🏥', slug:'health' },
            { label:'Agriculture', emoji:'🌾', slug:'agriculture' },
            { label:'Éducation', emoji:'📚', slug:'education' },
            { label:'Environnement', emoji:'🌿', slug:'environment' },
            { label:'Économie', emoji:'📈', slug:'economy' },
            { label:'Technologie', emoji:'💻', slug:'technology' },
            { label:'Biologie', emoji:'🔬', slug:'biology' },
            { label:'Physique', emoji:'⚛️', slug:'physics' },
          ].map((d) => (
            <Link to={`/datasets?domain=${d.slug}`} className="domain-pill" key={d.slug}>
              <span>{d.emoji}</span> {d.label}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Prêt à contribuer ?</h2>
        <p>Rejoignez des centaines de chercheurs qui partagent leurs données.</p>
        <Link to="/register" className="btn-primary">
          Créer un compte gratuitement <ArrowRight size={18}/>
        </Link>
      </section>
    </div>
  )
}
