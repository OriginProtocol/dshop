import React, { useState, useEffect } from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import { NetworksById } from 'data/Networks'

import FetchShopConfig from '../new-shop/_FetchShopConfig'
import SyncToCacheButton from './_SyncToCacheButton'

const SyncShop = ({ shop }) => {
  const [{ admin }] = useStateValue()
  const [hash, setHash] = useState('')
  const [url, setUrl] = useState('')
  const [networkId, setNetworkId] = useState('')
  useEffect(() => {
    const firstNet = get(admin, 'networks[0].networkId')
    if (!networkId && firstNet) {
      setNetworkId(firstNet)
    }
  }, [admin])

  return (
    <div>
      <div className="form-group">
        <label>Fetch IPFS Hash from URL</label>
        <div className="input-group">
          <input
            className="form-control"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Shop URL"
          />
          <div className="input-group-append">
            <FetchShopConfig
              onSuccess={(hash) => setHash(hash)}
              className="btn btn-outline-primary"
              url={url}
              children="Go"
            />
          </div>
        </div>
      </div>
      <div className="form-group">
        <label>Sync data from IPFS</label>
        <div className="form-row">
          <div className="input-group col-md-3">
            <select
              className="form-control"
              value={networkId}
              onChange={(e) => setNetworkId(e.target.value)}
            >
              {get(admin, 'networks', []).map((network) => (
                <option key={network.networkId} value={network.networkId}>
                  {get(NetworksById, `${network.networkId}.name`)}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group col-md-6">
            <input
              className="form-control"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="IPFS Hash"
            />
            <div className="input-group-append">
              <SyncToCacheButton
                shop={shop}
                hash={hash}
                networkId={networkId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SyncShop
