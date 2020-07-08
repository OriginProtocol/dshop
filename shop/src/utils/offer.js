import { post } from '@origin/ipfs'

export async function acceptOffer({
  marketplace,
  offerId,
  sellerProxy,
  config
}) {
  const [, , listingID, offerID] = offerId.split('-')

  const schemaId = 'https://schema.originprotocol.com/offer_2.0.0.json'
  const acceptIpfs = await post(config.ipfsApi, { schemaId })

  if (sellerProxy) {
    const res = marketplace.interface.encodeFunctionData('acceptOffer', [
      listingID,
      offerID,
      acceptIpfs
    ])

    let gasLimit = 48099
    gasLimit += 42000 // Cost of running execute method
    gasLimit -= 21000 // Minus the transaction base cost for the main transaction since we don't have to pay it twice
    gasLimit += Math.ceil((gasLimit / 64) * 3) // Extra unused gas for the two CALLs
    gasLimit += 40000 // Temporary safety factor

    return await sellerProxy.contract.execute(0, marketplace.address, 0, res, {
      gasLimit
    })
  } else {
    return await marketplace.acceptOffer(listingID, offerID, acceptIpfs)
  }
}

export async function finalizeOffer({
  marketplace,
  offerId,
  sellerProxy,
  config
}) {
  const [, , listingID, offerID] = offerId.split('-')

  const schemaId = 'https://schema.originprotocol.com/offer_2.0.0.json'
  const finalizeIpfs = await post(config.ipfsApi, { schemaId })

  if (sellerProxy) {
    const res = marketplace.interface.encodeFunctionData('finalize', [
      listingID,
      offerID,
      finalizeIpfs
    ])

    let gasLimit = 150000
    gasLimit += 42000 // Cost of running execute method
    gasLimit -= 21000 // Minus the transaction base cost for the main transaction since we don't have to pay it twice
    gasLimit += Math.ceil((gasLimit / 64) * 3) // Extra unused gas for the two CALLs
    gasLimit += 40000 // Temporary safety factor

    return await sellerProxy.contract.execute(0, marketplace.address, 0, res, {
      gasLimit
    })
  } else {
    return await marketplace.finalize(listingID, offerID, finalizeIpfs)
  }
}

export async function waitForOfferStatus({ marketplace, offerId, status }) {
  const [, , listingID, offerID] = offerId.split('-')

  return new Promise((resolve) => {
    function checkOfferStatus() {
      marketplace.offers(listingID, offerID).then((offerData) => {
        if (offerData.status === status) {
          resolve()
        } else {
          setTimeout(checkOfferStatus, 5000)
        }
      })
    }
    checkOfferStatus()
  })
}

export async function withdrawOffer({
  marketplace,
  offerId,
  sellerProxy,
  config
}) {
  const [, , listingID, offerID] = offerId.split('-')

  const schemaId = 'https://schema.originprotocol.com/offer_2.0.0.json'
  const withdrawIpfs = await post(config.ipfsApi, { schemaId })

  if (sellerProxy) {
    const res = marketplace.interface.encodeFunctionData('withdrawOffer', [
      listingID,
      offerID,
      withdrawIpfs
    ])

    let gasLimit = 150000
    gasLimit += 42000 // Cost of running execute method
    gasLimit -= 21000 // Minus the transaction base cost for the main transaction since we don't have to pay it twice
    gasLimit += Math.ceil((gasLimit / 64) * 3) // Extra unused gas for the two CALLs
    gasLimit += 40000 // Temporary safety factor

    return await sellerProxy.contract.execute(0, marketplace.address, 0, res, {
      gasLimit
    })
  } else {
    return await marketplace.withdrawOffer(listingID, offerID, withdrawIpfs)
  }
}
