import React from 'react'
import fbt from 'fbt'
import dayjs from 'dayjs'

import useShopDeployments from 'utils/useShopDeployments'

import NoItems from 'components/NoItems'
import Link from 'components/Link'
import DeployButton from './_DeployButton'

const DeployShop = () => {
  const { deployments } = useShopDeployments()

  return (
    <>
      <h3 className="admin-title">
        <Link to="/admin/settings" className="muted">
          <fbt desc="Settings">Settings</fbt>
        </Link>
        <span className="chevron" />
        <fbt desc="Publish">Publish</fbt>
        {!deployments.length ? null : (
          <div className="actions">
            <DeployButton className="btn-primary" />
          </div>
        )}
      </h3>
      {!deployments.length ? (
        <NoItems
          heading="You haven't published yet"
          description="Make you shop public for anyone to view"
        >
          <DeployButton className="btn-primary" buttonText="Publish" />
        </NoItems>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>
                <fbt desc="Deployments">Deployments</fbt>
              </th>
              <th>
                <fbt desc="IPFS">IPFS</fbt>
              </th>
              <th>
                <fbt desc="Domain">Domain</fbt>
              </th>
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
