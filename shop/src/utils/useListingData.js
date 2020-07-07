import { useEffect, useState } from 'react'
import ethers from 'ethers'

import useOrigin from 'utils/useOrigin'
import IdentityProxyAbi from 'utils/abis/IdentityProxy'

const useListingData = (listingId) => {
  const [listing, setListing] = useState()
  const [sellerProxy, setSellerProxy] = useState()
  const { marketplace, provider, signer } = useOrigin()

  useEffect(() => {
    if (!marketplace || !listingId) {
      return
    }
    const splitListing = listingId.split('-')
    marketplace.listings(splitListing[2]).then((listing) => {
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
  }, [marketplace])

  return {
    listing,
    sellerProxy
  }
}

export default useListingData
