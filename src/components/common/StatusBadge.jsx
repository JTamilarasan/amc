const StatusBadge = ({ label, tone = 'neutral' }) => {
  return <span className={`status-badge ${tone}`}>{label}</span>
}

export default StatusBadge
