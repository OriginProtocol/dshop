import React from 'react'
import fbt from 'fbt'

import Paginate from 'components/Paginate'
import useRest from 'utils/useRest'

const AdminEvents = () => {
  const { data = [], loading, error } = useRest('/events')

  return (
    <>
      <h3>
        <fbt desc="Events">Events</fbt>
      </h3>
      {error ? (
        <fbt desc="Error">Error</fbt>
      ) : loading ? (
        <>
          <fbt desc="Loading">Loading</fbt>...
        </>
      ) : (
        <table className="table admin-orders table-hover">
          <thead>
            <tr>
              <th>
                <fbt desc="Listing">Listing</fbt>
              </th>
              <th>
                <fbt desc="Offer">Offer</fbt>
              </th>
              <th>
                <fbt desc="Name">Name</fbt>
              </th>
              <th>
                <fbt desc="Timestamp">Timestamp</fbt>
              </th>
              <th>
                <fbt desc="IPFS">IPFS</fbt>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((event) => (
              <tr key={event.id}>
                <td>{event.listingId}</td>
                <td>{event.offerId}</td>
                <td>{event.eventName}</td>
                <td>{event.timestamp}</td>
                <td>{(event.ipfsHash || '').substr(0, 8)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Paginate total={data.length} />
    </>
  )
}

export default AdminEvents
