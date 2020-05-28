import React from 'react'

import CreateNetwork from '../networks/CreateNetworkForm'

const ServerSetup = () => {
  return (
    <>
      <div className="mb-4">Server setup:</div>
      <CreateNetwork active={true} />
    </>
  )
}

export default ServerSetup
