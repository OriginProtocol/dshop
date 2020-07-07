import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'

import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'

import DeployButton from './_DeployButton'
import Tabs from '../_Tabs'

const DeployShop = () => {
  const [{ reload }] = useStateValue()
  const [deployments, setDeployments] = useState([])
  const { get } = useBackendApi({ authToken: true })
  useEffect(() => {
    get('/shop/deployments').then((res) => {
      setDeployments(res.deployments)
    })
  }, [reload.deployments])

  return (
    <>
      <h3 className="admin-title">Settings</h3>
      <Tabs />
      <div className="mt-4">
        <DeployButton />
      </div>
      {!deployments.length ? (
        <div className="mt-3">No deployments yet...</div>
      ) : (
        <table className="table mt-3">
          <thead>
            <tr>
              <th>Deployments</th>
              <th>IFPS</th>
              <th>Domain</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((deployment, idx) => (
              <tr key={idx}>
                <td>{dayjs(deployment.createdAt).format('MMM D, h:mm A')}</td>
                <td>
                  {!deployment.ipfsHash ? (
                    ''
                  ) : (
                    <a
                      href={`${deployment.ipfsGateway}/ipfs/${deployment.ipfsHash}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {deployment.ipfsHash.substr(0, 6)}
                      {'...'}
                      {deployment.ipfsHash.substr(-6)}
                    </a>
                  )}
                </td>
                <td>
                  {!deployment.domains
                    ? null
                    : deployment.domains.map((dom, domIdx) => (
                        <span key={domIdx}>
                          {domIdx < 1 ? null : ', '}
                          <a
                            href={`http://${dom}`}
                            target="_blank"
                            rel="noreferrer"
                            children={dom}
                          />
                        </span>
                      ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default DeployShop
