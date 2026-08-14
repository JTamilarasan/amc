const StatCard = ({ icon: Icon, title, value, subtitle, accent, onClick }) => {
  const Component = onClick ? 'button' : 'article'
  return (
    <Component className={`stat-card ${onClick ? 'stat-card-clickable' : ''} ${accent || ''}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <p className="stat-title">{title}</p>
        <h3>{value}</h3>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
    </Component>
  )
}

export default StatCard
