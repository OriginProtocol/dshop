import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'

import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'

import NoItems from 'components/NoItems'
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
      <h3 className="admin-title">
        Settings
        {!deployments.length ? null : (
          <div className="actions">
            <DeployButton className="btn-primary" />
          </div>
        )}
      </h3>
      <Tabs />
      {!deployments.length ? (
        <NoItems
          heading="You haven't published yet"
          description="Make you shop public for anyone to view"
        >
          <DeployButton className="btn-primary" buttonText="Publish" />
        </NoItems>
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
                            href={`https://${dom}`}
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
