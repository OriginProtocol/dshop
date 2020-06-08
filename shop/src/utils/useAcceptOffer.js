import { useEffect, useState } from 'react'
import { post } from '@origin/ipfs'

import useConfig from 'utils/useConfig'
import useOrigin from 'utils/useOrigin'

function useAcceptOffer({ offerId, submit, onChange, buttonText }) {
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

      marketplace
        .acceptOffer(listingID, offerID, acceptIpfs)
        .then((tx) => {
          onChange({ disabled: true, buttonText: 'Confirming transaction...' })
          tx.wait().then(() => {
            onChange({ tx: tx.hash })
          })
        })
        .catch(() => {
          onChange({ disabled: false, buttonText: initialButtonText })
        })
    }
    if (submit) {
      acceptOffer()
    }
  }, [submit])
}

export default useAcceptOffer
