import React, { Fragment, useState } from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'
import capitalize from 'lodash/capitalize'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

import useOrder from 'utils/useOrder'
import useConfig from 'utils/useConfig'
import usePrintfulIds from 'utils/usePrintfulIds'
import usePrintful from 'utils/usePrintful'
import generatePrintfulOrder from '@origin/utils/generatePrintfulOrder'

const PrintfulDetails = ({
  setReload,
  reload,
  config,
  orderId,
  printfulOrder
}) => {
  const [confirm, setConfirm] = useState(false)
  const [showJson, setShowJson] = useState(false)

  return (
    <div className="printful-order">
      {printfulOrder.status !== 'draft' ? null : (
        <button
          className={`btn btn-primary${confirm ? ' disabled' : ''}`}
          onClick={async () => {
            if (confirm) {
              return
            }
            setConfirm(true)
            const headers = new Headers({
              authorization: `bearer ${config.backendAuthToken}`,
              'content-type': 'application/json'
            })
            const myRequest = new Request(
              `${config.backend}/orders/${orderId}/printful/confirm`,
              {
                headers,
                credentials: 'include',
                method: 'POST'
              }
            )
            const raw = await fetch(myRequest)
            const json = await raw.json()
            console.log(json)
            setReload(reload + 1)
          }}
        >
          Confirm Order
        </button>
      )}
      <div className="printful-details">
        <div>Status</div>
        <div>
          <span
            className={`font-weight-bold ${
              printfulOrder.status === 'fulfilled'
                ? 'text-success'
                : 'text-warning'
            }`}
          >
            {capitalize(printfulOrder.status)}
          </span>
          <a
            className="ml-4"
            href={printfulOrder.dashboard_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Printful
          </a>
        </div>
        <div>Created</div>
        <div>
          {dayjs(printfulOrder.created * 1000).format('MMM Do, h:mm A')}
          {` (${dayjs(printfulOrder.created * 1000).fromNow()})`}
        </div>
        {printfulOrder.created === printfulOrder.updated ? null : (
          <>
            <div>Updated</div>
            <div>
              {dayjs(printfulOrder.updated * 1000).format('MMM Do, h:mm A')}
              {` (${dayjs(printfulOrder.updated * 1000).fromNow()})`}
            </div>
          </>
        )}
        <div>Shipping</div>
        <div>{printfulOrder.shipping_service_name}</div>
      </div>
      {printfulOrder.shipments.map((shipment, idx) => {
        return (
          <Fragment key={idx}>
            <div className="mt-3 mb-2">
              <span className="font-weight-bold">{`Shipment #${shipment.id}`}</span>
              <a
                className="ml-4"
                href={shipment.packing_slip_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Packing Slip
              </a>
            </div>
            <div className="printful-shipping ml-3">
              <div>Status</div>
              <div>
                {`${capitalize(shipment.status)} from ${shipment.location}`}
              </div>
              <div>Shipped</div>
              <div>
                {dayjs(shipment.shipped_at * 1000).format('MMM Do, h:mm A')}
                {` (${dayjs(shipment.shipped_at * 1000).fromNow()})`}
              </div>
              <div>Service</div>
              <div>{shipment.service}</div>
              <div>Tracking #</div>
              <div>
                <a href={shipment.tracking_url}>{shipment.tracking_number}</a>
              </div>
              <div>Items</div>
              <div>
                {shipment.items.map((item, key) => {
                  return (
                    <div key={key}>
                      {`Item ${item.item_id}${
                        item.quantity > 1 ? ` x ${item.quantity}` : ''
                      }`}{' '}
                      &bull; {`Picked ${item.picked}`} &bull;{' '}
                      {`Printed ${item.printed}`}
                    </div>
                  )
                })}
              </div>
            </div>
          </Fragment>
        )
      })}
      <div className="printful-products mt-4">
        {printfulOrder.items.map((item, idx) => {
          const img = item.files.find((i) => i.type === 'preview')
          return (
            <div key={idx}>
              <img src={get(img, 'thumbnail_url')} />
              <div>{item.name}</div>
            </div>
          )
        })}
      </div>

      <div className="mt-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setShowJson(!showJson)
          }}
        >
          {`${showJson ? 'Hide' : 'Show'} JSON`}
        </a>
        {!showJson ? null : (
          <pre className="mt-3">{JSON.stringify(printfulOrder, null, 2)}</pre>
        )}
      </div>
    </div>
  )
}

const Printful = () => {
  const { config } = useConfig()
  const [create, setCreate] = useState(false)
  const [reload, setReload] = useState(1)
  const [draft, setDraft] = useState(false)
  const match = useRouteMatch('/admin/orders/:orderId/:tab?')
  const { orderId } = match.params
  const { order, loading } = useOrder(orderId)
  const { printfulIds } = usePrintfulIds()
  const { order: printfulOrder, loading: printfulLoading } = usePrintful(
    orderId,
    reload
  )

  if (loading || printfulLoading) {
    return <div>Loading...</div>
  }
  if (!order) {
    return <div>Order not found</div>
  }

  if (printfulOrder) {
    return (
      <PrintfulDetails
        {...{
          setReload,
          reload,
          config,
          orderId,
          printfulOrder
        }}
      />
    )
  }

  const printfulData = generatePrintfulOrder(order, printfulIds, draft)
  return (
    <div className="mt-3">
      <div className="d-flex align-items-center">
        <button
          className={`btn btn-primary${create ? ' disabled' : ''} mr-3`}
          onClick={async () => {
            if (create) {
              return
            }
            setCreate(true)
            const raw = await fetch(
              `${config.backend}/orders/${orderId}/printful/create`,
              {
                headers: {
                  authorization: `bearer ${config.backendAuthToken}`,
                  'content-type': 'application/json'
                },
                credentials: 'include',
                method: 'POST',
                body: JSON.stringify(printfulData)
              }
            )
            const json = await raw.json()
            console.log(json)
            setReload(reload + 1)
          }}
        >
          Create Order
        </button>
        <label className="p-0 m-0 d-flex align-items-center">
          <input
            type="checkbox"
            className="mr-1"
            value={draft}
            onChange={() => setDraft(!draft)}
          />
          Draft only
        </label>
      </div>
      <pre className="mt-3">{JSON.stringify(printfulData, null, 2)}</pre>
    </div>
  )
}

export default Printful

require('react-styl')(`
  .printful-order
    a
      text-decoration: underline
      color: #3b80ee

  .printful-shipping
    display: grid
    grid-template-columns: 6rem 1fr
    row-gap: 0.5rem
    > div:nth-child(odd)
      font-weight: 700
  .printful-details
    display: grid
    grid-template-columns: 7rem 1fr
    row-gap: 0.5rem
    > div:nth-child(odd)
      font-weight: 700
  .printful-products
    display: grid
    grid-template-columns: repeat(auto-fill, 8rem)
    grid-column-gap: 1.5rem
    grid-row-gap: 1.5rem
    text-align: center
    font-size: 14px
    line-height: 1.25rem
    img
      max-height: 80px
      margin-bottom: 0.5rem
`)
