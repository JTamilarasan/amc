const FormField = ({ label, value, onChange, placeholder, type = 'text', name, required }) => {
  return (
    <label className="field">
      <span>{label}{required ? ' *' : ''}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  )
}

export default FormField
