import React from 'react'

const UpholdLogout = ({ upholdAuth, config, reloadAuth, setReloadAuth }) => {
  return (
    <div className="uphold-logout">
      {`Logged into Uphold as ${upholdAuth.name}. `}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          fetch(`${config.backend}/uphold/logout`, {
            credentials: 'include',
            headers: {
              authorization: `bearer ${encodeURIComponent(
                config.backendAuthToken
              )}`
            },
            method: 'POST'
          }).then(() => {
            setReloadAuth(reloadAuth + 1)
          })
        }}
      >
        Logout
      </a>
    </div>
  )
}

export default UpholdLogout

require('react-styl')(`
  .uphold-logout
    font-size: 0.875rem
    margin-left: auto
    margin-right: 0.5rem
    color: #666
`)
