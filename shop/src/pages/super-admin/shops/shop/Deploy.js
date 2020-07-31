import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import DeployButton from './_DeployButton'
import ActivateBuild from './_ActivateBuild'

const DeployShop = ({ shop }) => {
  const { config } = useConfig()
  const [{ reload }] = useStateValue()
  const [deployments, setDeployments] = useState([])
  useEffect(() => {
    fetch(`${config.backend}/shops/${shop.authToken}/deployments`, {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((res) => {
        setDeployments(res.deployments)
      })
      .catch((e) => {
        console.log(e)
      })
  }, [reload.deployments])

  return (
    <div>
      <DeployButton shop={shop} />
      {!deployments.length ? (
        <div className="mt-3">No deployments yet...</div>
      ) : (
        <table className="table mt-3">
          <thead>
            <tr>
              <th>Deployments</th>
              <th>IPFS</th>
              <th>Domain</th>
              <th>-</th>
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
                <td>
                  <ActivateBuild shop={shop} ipfsHash={deployment.ipfsHash} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default DeployShop
