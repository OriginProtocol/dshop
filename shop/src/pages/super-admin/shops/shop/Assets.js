import React, { useEffect } from 'react'

import useConfig from 'utils/useConfig'
import useSetState from 'utils/useSetState'

import UploadAssets from './_UploadAssets'
import DeleteAsset from './_DeleteAsset'

const ShopAssets = ({ shop }) => {
  const { config } = useConfig()
  const [state, setState] = useSetState({ reload: 1, assets: [] })
  useEffect(() => {
    fetch(`${config.backend}/shops/${shop.authToken}/assets`, {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((res) => {
        setState({ assets: res.assets })
      })
      .catch((e) => {
        console.log(e)
      })
  }, [config.backend, state.reload])

  return (
    <div>
      <UploadAssets
        shop={shop}
        onSuccess={() => setState({ reload: state.reload + 1 })}
      />
      {!state.assets.length ? (
        <div className="mt-3">No assets yet...</div>
      ) : (
        <table className="table mt-3 shop-assets">
          <thead>
            <tr>
              <th>Assets</th>
              <th>Preview</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.assets.map((asset, idx) => (
              <tr key={idx}>
                <td>{asset}</td>
                <td>
                  <img src={`${config.backend}/${shop.authToken}/${asset}`} />
                </td>
                <td className="text-right">
                  <a
                    className="btn btn-sm btn-outline-primary"
                    href={`${config.backend}/${shop.authToken}/${asset}`}
                    target="_blank"
                    rel="noreferrer"
                    children="View"
                  />
                  <DeleteAsset
                    className="btn btn-sm btn-outline-danger ml-2"
                    file={asset}
                    shop={shop}
                    onSuccess={() => {
                      setState({ reload: state.reload + 1 })
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ShopAssets

require('react-styl')(`
  table.shop-assets
    img
      max-width: 12rem
      max-height: 2rem
`)
