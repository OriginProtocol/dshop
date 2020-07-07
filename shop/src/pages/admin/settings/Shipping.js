import React, { useState } from 'react'

import formatPrice from 'utils/formatPrice'
import useShippingZones from 'utils/useShippingZones'

import Tabs from './_Tabs'

import DeleteButton from './shipping/_Delete'
import EditModal from './shipping/_Edit'

const Shipping = () => {
  const { shippingZones, loading } = useShippingZones()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="shipping-settings">
      <h3 className="admin-title">
        Settings
        <div className="actions ml-auto">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowModal({})}
          >
            Add
          </button>
        </div>
      </h3>
      <Tabs />
      {loading ? (
        'Loading...'
      ) : (
        <table className="table mt-4">
          <thead>
            <tr>
              <th>Method</th>
              <th>Cost per shipment</th>
              <th>Countries</th>
              <th>Processing Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shippingZones.map((zone) => {
              return (
                <tr key={zone.id}>
                  <td>{zone.label}</td>
                  <td>{formatPrice(zone.amount)}</td>
                  <td>
                    {zone.countries
                      ? zone.countries.join(', ')
                      : 'Rest of the world'}
                  </td>
                  <td>{zone.processingTime || zone.detail}</td>
                  <td>
                    <div className="actions">
                      <div
                        className="action-icon"
                        onClick={() => setShowModal(zone)}
                      >
                        <img src="images/edit-icon.svg" />
                      </div>
                      <DeleteButton className="action-icon" shippingZone={zone}>
                        <img src="images/delete-icon.svg" />
                      </DeleteButton>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {!showModal ? null : (
        <EditModal
          onClose={() => setShowModal(false)}
          shippingZone={showModal || {}}
        />
      )}
    </div>
  )
}

export default Shipping

require('react-styl')(`
  .shipping-settings
    .table .actions
      visibility: hidden
      display: flex

    .action-icon
      cursor: pointer
      margin-left: 20px
      align-items: center

    tr:hover .actions
      visibility: visible

`)
