import React, { useEffect, useState } from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'
import ethers from 'ethers'
import dayjs from 'dayjs'

import useConfig from 'utils/useConfig'
import useOrigin from 'utils/useOrigin'
import usePrice from 'utils/usePrice'
import useAcceptOffer from 'utils/useAcceptOffer'

function status(id) {
  if (id === 1) return 'Created'
  if (id === 2) return 'Accepted'
  if (id === 3) return 'Disputed'
  else return id
}

const AdminContract = () => {
  const { config } = useConfig()
  const [offer, setOffer] = useState()
  const [listing, setListing] = useState()
  const { marketplace } = useOrigin()
  const match = useRouteMatch('/admin/orders/:orderId')
  const { orderId } = match.params
  const splitOrder = orderId.split('-')
  const [state, setState] = useState({ submit: 0, buttonText: 'Accept Offer' })
  const onChange = (newState) => setState({ ...state, ...newState })
  const { toFiatPrice } = usePrice()

  useAcceptOffer({ offerId: orderId, onChange, ...state })

  useEffect(() => {
    if (!marketplace || !orderId) {
      return
    }
    marketplace.offers(splitOrder[2], splitOrder[3]).then((offer) => {
      setOffer({
        status: offer.status,
        affiliate: offer.affiliate,
        arbitrator: offer.arbitrator,
        buyer: offer.buyer,
        commission: offer.commission.toString(),
        currency: offer.currency,
        finalizes: offer.finalizes.toString(),
        refund: offer.refund.toString(),
        value: ethers.utils.formatUnits(offer.value, 'ether'),
        token: config.acceptedTokens.find(
          (t) => t.address.toLowerCase() === offer.currency.toLowerCase()
        )
      })
    })
    marketplace.listings(splitOrder[2]).then((listing) => {
      setListing({
        seller: listing.seller,
        deposit: ethers.utils.formatUnits(listing.deposit, 'ether'),
        depositManager: listing.depositManager
      })
    })
  }, [marketplace])

  if (!offer) {
    return null
  }

  return (
    <div className="order-details">
      <div className="customer-info">
        <div>Status</div>
        <div>
          {status(offer.status)}
          {offer.status !== 1 ? null : (
            <button
              className="btn btn-outline-primary btn-sm ml-3"
              onClick={() => setState({ submit: state.submit + 1 })}
              children={state.buttonText}
            />
          )}
        </div>
        {offer.token ? (
          <>
            <div>Value</div>
            <div>
              {`${offer.value} ${offer.token.name}`}
              <span className="ml-3">{`$${toFiatPrice(
                offer.value,
                offer.token.name
              )}`}</span>
            </div>
          </>
        ) : (
          <>
            <div>Token</div>
            <div>{get(offer, 'token.name', offer.currency)}</div>
            <div>Value</div>
            <div>{offer.value}</div>
          </>
        )}
        <div>Finalizes</div>
        <div>
          {offer.finalizes < 10000000
            ? `${offer.finalizes / 60 / 60 / 24} days after offer is accepted`
            : dayjs(offer.finalizes * 1000).format('MMM D, h:mm A')}
        </div>
        <div>Buyer</div>
        <div>{offer.buyer}</div>
        <div>Seller</div>
        <div>{listing ? listing.seller : ''}</div>
        <div>Arbitrator</div>
        <div>{offer.arbitrator}</div>
        <div>Affiliate</div>
        <div>
          {offer.affiliate.indexOf('0x000000') === 0
            ? 'None set'
            : offer.affiliate}
        </div>
        <div>Commission</div>
        <div>{`${offer.commission} OGN`}</div>
        <div>Refund</div>
        <div>{offer.refund}</div>
      </div>
    </div>
  )
}

export default AdminContract
