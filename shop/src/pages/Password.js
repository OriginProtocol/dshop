import React, { useState } from 'react'
import fbt, { FbtParam } from 'fbt'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

const Password = () => {
  const { config } = useConfig()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [, dispatch] = useStateValue()
  const now = new Date()
  return (
    <div className="password container">
      <header className="justify-content-center">
        <h1>
          {config.logo ? <img src={`${config.dataSrc}${config.logo}`} /> : null}
          {config.title}
        </h1>
      </header>
      <div className="bdr" />
      <h3>
        <fbt desc="OpeningSoon">Opening Soon</fbt>
      </h3>
      <div className="description">
        <fbt desc="password.checkBack">Please check back soon!</fbt>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setError('')
          if (password === '') {
            return
          }
          fetch(`${config.backend}/password`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: `bearer ${config.backendAuthToken}`
            },
            body: JSON.stringify({ password }),
            credentials: 'include'
          }).then(async (response) => {
            if (response.status === 200) {
              const data = await response.json()
              if (!data.success) {
                setError(fbt('Invalid password', 'password.invalidPassword'))
              }
              dispatch({ type: 'setPasswordAuthed', authed: data.success })
            }
          })
        }}
      >
        <div className="form-group mr-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`form-control mb-2 mr-sm-2${error ? ' is-invalid' : ''}`}
            placeholder={fbt('Enter password', 'password.enterPassword')}
          />
          {!error ? null : (
            <div className="invalid-feedback" style={{ display: 'block' }}>
              {error}
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-primary">
          <fbt desc="Submit">Submit</fbt>
        </button>
      </form>
      <div className="footer">
        <fbt desc="password.copyrightText">
          Copyright © <FbtParam name="year">{now.getFullYear()}</FbtParam>.
        </fbt>
      </div>
    </div>
  )
}

export default Password

require('react-styl')(`
  .password
    max-width: 800px
    text-align: center
    .description
      color: #777
      max-width: 650px
      margin: 2rem auto
    .bdr
      border-top: 1px solid #eee
      margin-bottom: 3rem
    form
      justify-content: center
      margin-bottom: 3rem
      display: flex
      align-items: end
    .footer
      padding-top: 3rem
`)
