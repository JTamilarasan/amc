const SelectField = ({ label, value, onChange, name, options, required }) => {
  return (
    <label className="field">
      <span>{label}{required ? ' *' : ''}</span>
      <select name={name} value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default SelectField
