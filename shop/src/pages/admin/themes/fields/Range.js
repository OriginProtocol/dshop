import React from 'react'

const Range = ({ field, value, onChange }) => {
  const _onChange = (e) => onChange(e.target.value)

  return (
    <div className="form-group d-flex align-items-center">
      <label className="mb-0 mr-4">{field.title}</label>
      <input
        style={{ flex: 1 }}
        value={value || '1'}
        onChange={_onChange}
        type="range"
        min={field.min || '0'}
        max={field.max || '100'}
        step="1"
      />
    </div>
  )
}

export default Range

require('react-styl')(`
`)
