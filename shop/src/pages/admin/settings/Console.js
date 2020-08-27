import React, { useState } from 'react'
import fbt from 'fbt'

import { get } from '@origin/ipfs'
import omit from 'lodash/omit'

import useConfig from 'utils/useConfig'
import useShopConfig from 'utils/useShopConfig'
import useBackendApi from 'utils/useBackendApi'
import useSetState from 'utils/useSetState'
import useWallet from 'utils/useWallet'
import { updateListing } from 'utils/listing'
import { formInput, formFeedback } from 'utils/formHelpers'
import Link from 'components/Link'

const AdminConsole = () => {
  const { config } = useConfig()
  const wallet = useWallet()
  const { shopConfig } = useShopConfig()
  const [encryptedData, setEncryptedData] = useState('')
  const [orderId, setOrderId] = useState('')
  const [readHash, setReadHash] = useState('')
  const [shopIpfsHash, setShopIpfsHash] = useState('')
  const [printfulError, setPrintfulError] = useState('')
  const { post } = useBackendApi({ authToken: true })

  const [state, setState] = useSetState()
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <>
      <h3 className="admin-title with-border">
        <Link to="/admin/settings" className="muted">
          <fbt desc="Settings">Settings</fbt>
        </Link>
        <span className="chevron" />
        Console
      </h3>

      <div className="mt-4">
        <pre>{JSON.stringify(omit(wallet, 'provider', 'signer'), null, 4)}</pre>
        <label className="font-weight-bold">Create order via IPFS hash</label>
        <form
          autoComplete="off"
          className="d-flex"
          onSubmit={(e) => {
            e.preventDefault()
            if (!encryptedData) {
              return
            }

            fetch(`${config.ipfsGateway}/ipfs/${encryptedData}`).then((res) => {
              if (!res.ok) {
                console.log('Not OK')
                return
              }

              fetch(`${config.backend}/orders/create`, {
                headers: {
                  authorization: `bearer ${encodeURIComponent(
                    config.backendAuthToken
                  )}`,
                  'content-type': 'application/json'
                },
                credentials: 'include',
                method: 'POST',
                body: JSON.stringify({ encryptedData })
              }).then((saveRes) => {
                if (!saveRes.ok) {
                  console.log('Not OK')
                  return
                }
                console.log('Saved OK')
              })
            })
          }}
        >
          <input
            className="form-control"
            placeholder="Encrypted IPFS Hash"
            style={{ maxWidth: 300 }}
            value={encryptedData}
            onChange={(e) => setEncryptedData(e.target.value)}
          />
          <button type="submit" className="btn btn-outline-primary ml-3">
            Submit
          </button>
        </form>
        <label className="mt-4 font-weight-bold">Send confirmation email</label>
        <form
          autoComplete="off"
          className="d-flex"
          onSubmit={(e) => {
            e.preventDefault()
            if (!orderId) {
              return
            }

            fetch(`${config.backend}/orders/${orderId}/email`, {
              headers: {
                authorization: `bearer ${encodeURIComponent(
                  config.backendAuthToken
                )}`,
                'content-type': 'application/json'
              },
              credentials: 'include',
              method: 'POST'
            }).then((saveRes) => {
              if (!saveRes.ok) {
                console.log('Not OK')
                return
              }
              console.log('OK')
            })
          }}
        >
          <input
            className="form-control"
            placeholder="Order ID"
            style={{ maxWidth: 300 }}
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button type="submit" className="btn btn-outline-primary ml-3">
            Submit
          </button>
        </form>
        <label className="mt-4 font-weight-bold">Read encrypted hash</label>
        <form
          autoComplete="off"
          className="d-flex"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!readHash) {
              return
            }

            const { pgpPrivateKey, pgpPrivateKeyPass } = shopConfig

            const encryptedData = await get(config.ipfsGateway, readHash, 10000)
            const privateKey = await openpgp.key.readArmored(pgpPrivateKey)
            if (privateKey.err && privateKey.err.length) {
              throw privateKey.err[0]
            }
            const privateKeyObj = privateKey.keys[0]
            await privateKeyObj.decrypt(pgpPrivateKeyPass)

            const message = await openpgp.message.readArmored(
              encryptedData.data
            )
            const options = { message, privateKeys: [privateKeyObj] }

            const decrypted = await openpgp.decrypt(options)

            console.log(JSON.parse(decrypted.data))
          }}
        >
          <input
            className="form-control"
            placeholder="IPFS Hash"
            style={{ maxWidth: 300 }}
            value={readHash}
            onChange={(e) => setReadHash(e.target.value)}
          />
          <button type="submit" className="btn btn-outline-primary ml-3">
            Submit
          </button>
        </form>

        <label className="mt-4 font-weight-bold">
          Emit ListingUpdated event
        </label>
        <form
          autoComplete="off"
          className="d-flex"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!shopIpfsHash) {
              return
            }
            {
              /* TODO: add UI feedback (a toast?) to show success/error. */
            }
            console.log('Calling ListingUpdated...')
            updateListing({ config, shopIpfsHash })
              .then(() => console.log('Listing updated successfully'))
              .catch((err) =>
                console.error('Listing update failed', err.message)
              )
          }}
        >
          <input
            className="form-control"
            placeholder="IPFS Hash"
            style={{ maxWidth: 300 }}
            value={shopIpfsHash}
            onChange={(e) => setShopIpfsHash(e.target.value)}
          />
          <button type="submit" className="btn btn-outline-primary ml-3">
            Submit
          </button>
        </form>

        <label className="mt-4 font-weight-bold">Sync Printful</label>
        <form
          autoComplete="off"
          className="d-flex"
          onSubmit={async (e) => {
            e.preventDefault()
            setPrintfulError('')
            fetch(`${config.backend}/shop/sync-printful`, {
              headers: {
                authorization: `bearer ${encodeURIComponent(
                  config.backendAuthToken
                )}`,
                'content-type': 'application/json'
              },
              credentials: 'include',
              method: 'POST'
            }).then((saveRes) => {
              if (!saveRes.ok) {
                console.log('Not OK')
                return
              }
              saveRes.json().then((json) => {
                if (!json.success) {
                  setPrintfulError(json.reason)
                  return
                }
              })
            })
          }}
        >
          <button type="submit" className="btn btn-outline-primary">
            Sync
          </button>
          {printfulError ? <div className="ml-3">{printfulError}</div> : null}
        </form>

        <label className="mt-4 font-weight-bold">Printful create order</label>
        <form
          autoComplete="off"
          onSubmit={async (e) => {
            e.preventDefault()
            setPrintfulError('')
            post(`/orders/${state.orderId}/printful/create`, {
              body: state.printfulOrder
            }).then((saveRes) => {
              console.log(saveRes)
            })
          }}
        >
          <div className="form-group">
            <label>Order ID</label>
            <input className="form-control" {...input('orderId')} />
            {Feedback('orderId')}
          </div>
          <div className="form-group">
            <label>Order JSON</label>
            <textarea className="form-control" {...input('printfulOrder')} />
            {Feedback('printfulOrder')}
          </div>
          <button type="submit" className="btn btn-outline-primary">
            Send
          </button>
        </form>

        <h4 className="mt-3">Contents of config.json on IPFS</h4>
        <textarea
          className="form-control"
          readOnly
          style={{ minHeight: '90vh', fontFamily: 'monospace' }}
          value={JSON.stringify(config, null, 2)}
        ></textarea>
      </div>
    </>
  )
}

export default AdminConsole
