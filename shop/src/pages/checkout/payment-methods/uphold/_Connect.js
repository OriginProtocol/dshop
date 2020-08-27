import React from 'react'

const UpholdConnect = ({ redirect, setReloadAuth, reloadAuth }) => {
  return (
    <a
      href={redirect}
      onClick={(e) => {
        e.preventDefault()
        const w = window.open(redirect, '', 'width=330,height=400')
        const finish = (e) => {
          // console.log('Got data', e.data)
          if (!String(e.data).match(/uphold/)) {
            return
          }
          window.removeEventListener('message', finish, false)
          setReloadAuth(reloadAuth + 1)
          if (!w.closed) {
            w.close()
          }
        }
        window.addEventListener('message', finish, false)
      }}
    >
      <img src="images/connect_with_uphold.svg" />
    </a>
  )
}

export default UpholdConnect
