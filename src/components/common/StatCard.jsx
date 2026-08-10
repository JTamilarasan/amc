const StatCard = ({ icon: Icon, title, value, subtitle, accent }) => {
  return (
    <article className={`stat-card ${accent || ''}`}>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <p className="stat-title">{title}</p>
        <h3>{value}</h3>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
    </article>
  )
}

export default StatCard
