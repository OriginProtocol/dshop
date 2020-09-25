import React from 'react'

import useConfig from 'utils/useConfig'

const Footer = () => {
  const { config } = useConfig()
  return (
    <div className="container mb-24">
      <div className="mb-24 flex flex-col items-center">
        <img style={{ width: 80 }} src={`${config.dataSrc}${config.logo}`} />
      </div>

      <div className="font-sm flex justify-between flex-col sm:flex-row items-center">
        <div>Powered by Origin Dshop</div>
        <div>&copy; 2020 Origin Protocol</div>
        <div>FAQ</div>
        <div>About Dshop</div>
        <div>Visit Origin</div>
        <div>Support</div>
      </div>
    </div>
  )
}

export default Footer
