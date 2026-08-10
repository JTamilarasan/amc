const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variantClass = variant === 'secondary' ? 'btn-secondary' : variant === 'ghost' ? 'btn-ghost' : 'btn-primary'

  return (
    <button className={`btn ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}

export default Button
