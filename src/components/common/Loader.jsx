const Loader = ({ fullScreen = false, size = 'medium', label = 'Loading your workspace...' }) => (
  <div className={`app-loader ${fullScreen ? 'app-loader-fullscreen' : 'app-loader-inline'} app-loader-${size}`} role="status" aria-live="polite" aria-label={label}>
    <div className="app-loader-brand" aria-hidden="true">
      <div className="app-loader-logo">A</div>
      <strong>AMC Manager</strong>
    </div>
    <span className="app-loader-spinner" aria-hidden="true" />
    <span className="app-loader-text">{label}</span>
  </div>
)

export default Loader
