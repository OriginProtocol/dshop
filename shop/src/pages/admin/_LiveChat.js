import React, { useEffect, useState } from 'react'

import { useStateValue } from 'data/state'

const LiveChat = ({ className = '' }) => {
  const [enabled, setEnabled] = useState()
  const [{ admin }] = useStateValue()

  useEffect(() => {
    if (enabled) {
      if (typeof window.Intercom !== 'function') {
        window.intercomSettings = {
          app_id: 'efh8mo3l',
          custom_launcher_selector: '#show-chat',
          name: admin.name,
          email: admin.email
        }
        const intercomEl = document.createElement('script')
        intercomEl.src = 'https://widget.intercom.io/widget/efh8mo3l'
        intercomEl.onload = () => window.Intercom('show')
        document.head.appendChild(intercomEl)
      }
    }
  }, [enabled])

  return (
    <a
      id="show-chat"
      className={`live-chat ${className}`}
      href="#chat"
      onClick={(e) => {
        e.preventDefault()
        setEnabled(true)
      }}
    >
      Live Chat &amp; Support
    </a>
  )
}

export default LiveChat

require('react-styl')(`
  .live-chat
    color: #8293a4
    font-size: 14px
`)
