import React from 'react'

const Select = ({ field, value, onChange }) => {
  const _onChange = (e) => onChange(e.target.value)
  const options = field.options || []

  return (
    <div className="form-group d-flex align-items-center">
      <label className="mb-0 mr-4">{field.title}</label>
      <select style={{ flex: 1 }} value={value || ''} onChange={_onChange}>
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Select
