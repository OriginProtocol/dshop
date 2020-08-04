import { useEffect, useState } from 'react'
import ethers from 'ethers'

import useConfig from 'utils/useConfig'
import useOrigin from 'utils/useOrigin'
import IdentityProxyAbi from 'utils/abis/IdentityProxy'

const useOfferData = (orderId) => {
  const { config } = useConfig()
  const [offer, setOffer] = useState()
  const [listing, setListing] = useState()
  const [sellerProxy, setSellerProxy] = useState()
  const { marketplace, provider, signer } = useOrigin()
  const splitOrder = (orderId || '').split('-')

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
      provider.getCode(listing.seller).then((code) => {
        if (code && code.length > 2) {
          const contract = new ethers.Contract(
            listing.seller,
            IdentityProxyAbi,
            signer || provider
          )
          contract.owner().then((address) => {
            setSellerProxy({ address, contract })
          })
        }
      })
    })
  }, [marketplace, orderId])

  return {
    offer,
    listing,
    sellerProxy
  }
}

export default useOfferData
