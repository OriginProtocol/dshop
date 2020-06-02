import React, { useState } from 'react'

import FetchShopConfig from '../new-shop/_FetchShopConfig'
import SyncPrintfulButton from './_SyncPrintfulButton'
import SyncToCacheButton from './_SyncToCacheButton'

const SyncShop = ({ shop }) => {
  // const [hash, setHash] = useState('QmV1kPKTGF3zdvk3jFcJ29LNc65SS1ALBBGRbM47RRsH4Z')
  const [hash, setHash] = useState(
    'QmNbDv915ARFAcPHbhAi9k7bvNERRiZLw6gQP6DPeqN2vC'
  )
  const [url, setUrl] = useState('')
  return (
    <div>
      <div className="form-group">
        <SyncPrintfulButton shop={shop} />
      </div>
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
        <div className="input-group">
          <input
            className="form-control"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="IPFS Hash"
          />
          <div className="input-group-append">
            <select>
              <option>hmm</option>
            </select>
          </div>
          <div className="input-group-append">
            <SyncToCacheButton shop={shop} hash={hash} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SyncShop
