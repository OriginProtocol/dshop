import React from 'react'

const TextField = ({ field, value, onChange }) => {
  const _onChange = (e) => onChange(e.target.value)

  return (
    <div className="form-group">
      <label>{field.title}</label>
      {field.multiline ? (
        <textarea
          className="form-control"
          onChange={_onChange}
          value={value || ''}
        />
      ) : (
        <input
          type="text"
          className="form-control"
          onChange={_onChange}
          value={value || ''}
        />
      )}
    </div>
  )
}

export default TextField

require('react-styl')(`
`)
