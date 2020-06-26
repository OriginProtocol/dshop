import { useEffect, useState } from 'react'
import { post } from '@origin/ipfs'

import useConfig from 'utils/useConfig'
import useOrigin from 'utils/useOrigin'

function useFinalizeOffer({
  offerId,
  submit,
  onChange,
  buttonText,
  sellerProxy
}) {
  const { marketplace } = useOrigin()
  const { config } = useConfig()
  const [initialButtonText] = useState(buttonText)

  useEffect(() => {
    async function finalizeOffer() {
      onChange({ disabled: true, buttonText: 'Awaiting approval...' })
      const [, , listingID, offerID] = offerId.split('-')

      const finalizeIpfsHash = await post(config.ipfsApi, {
        schemaId: 'https://schema.originprotocol.com/offer_2.0.0.json'
      })

      function onSuccess(tx) {
        onChange({
          disabled: true,
          buttonText: 'Confirming transaction...'
        })
        tx.wait().then(() => {
          onChange({ tx: tx.hash })
        })
      }

      function onError(err) {
        console.log(err)
        onChange({ disabled: false, buttonText: initialButtonText })
      }

      if (sellerProxy) {
        const res = marketplace.interface.encodeFunctionData('finalize', [
          listingID,
          offerID,
          finalizeIpfsHash
        ])

        const gasLimit = 150000

        sellerProxy.contract
          .execute(0, marketplace.address, 0, res, { gasLimit })
          .then(onSuccess)
          .catch(onError)
      } else {
        marketplace
          .finalize(listingID, offerID, finalizeIpfsHash)
          .then(onSuccess)
          .catch(onError)
      }
    }
    if (submit) {
      finalizeOffer()
    }
  }, [submit])
}

export default useFinalizeOffer
