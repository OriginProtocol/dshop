import { useEffect, useState } from 'react'
import { post } from '@origin/ipfs'

import useConfig from 'utils/useConfig'
import useOrigin from 'utils/useOrigin'

function useAcceptOffer({
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
    async function acceptOffer() {
      onChange({ disabled: true, buttonText: 'Awaiting approval...' })
      const [, , listingID, offerID] = offerId.split('-')

      const acceptIpfs = await post(config.ipfsApi, {
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

        sellerProxy.contract
          .execute(0, marketplace.address, 0, res, { gasLimit })
          .then(onSuccess)
          .catch(onError)
      } else {
        marketplace
          .acceptOffer(listingID, offerID, acceptIpfs)
          .then(onSuccess)
          .catch(onError)
      }
    }
    if (submit) {
      acceptOffer()
    }
  }, [submit])
}

export default useAcceptOffer
