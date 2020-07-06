import React, { useState } from 'react'

const PasswordField = ({ input, field, prepend }) => {
  const [hide, setHide] = useState(true)
  return (
    <div className="input-group">
      {!prepend ? null : (
        <div className="input-group-prepend">
          <span className="input-group-text">{prepend}</span>
        </div>
      )}
      <input type={hide ? 'password' : 'text'} {...input(field)} />
      <div className="input-group-append">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setHide(!hide)}
          children={hide ? '🔒' : '🔓'}
        />
      </div>
    </div>
  )
}

export default PasswordField
