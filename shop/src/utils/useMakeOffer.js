import ethers from 'ethers'
import { useEffect, useState } from 'react'
import { post } from '@origin/ipfs'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import usePrice from 'utils/usePrice'
import useOrigin from 'utils/useOrigin'
import { useStateValue } from 'data/state'

function useMakeOffer({
  submit,
  activeToken,
  encryptedData,
  onChange,
  buttonText
}) {
  const { signer, ogn, marketplace } = useOrigin()
  const { config } = useConfig()
  const { toTokenPrice } = usePrice()
  const [{ cart }] = useStateValue()
  const [initialButtonText] = useState(buttonText)
  const cryptoSelected = get(cart, 'paymentMethod.id') === 'crypto'

  useEffect(() => {
    async function makeOffer() {
      onChange({ disabled: true, buttonText: 'Awaiting approval...' })
      const l = config.listingId.split('-')
      const listingId = l[l.length - 1]
      const finalizes = 60 * 60 * 24 * 14

      const amount = toTokenPrice(cart.total, activeToken.name)
      const amountWei = ethers.utils.parseUnits(amount, 'ether')
      const address = await signer.getAddress()
      const currency =
        activeToken.id === 'token-ETH'
          ? ethers.constants.AddressZero
          : ogn.address

      const offerIpfs = await post(config.ipfsApi, {
        schemaId: 'https://schema.originprotocol.com/offer_2.0.0.json',
        listingId: config.listingId,
        listingType: 'unit',
        unitsPurchased: 1,
        totalPrice: { amount: 0, currency: 'encrypted' },
        commission: { currency: 'OGN', amount: '0' },
        finalizes,
        encryptedData: encryptedData.hash
      })

      marketplace
        .makeOffer(
          listingId,
          offerIpfs,
          finalizes,
          ethers.constants.AddressZero,
          0,
          amountWei,
          currency,
          address,
          {
            value: activeToken.id === 'token-ETH' ? amountWei : 0
          }
        )
        .then((tx) => {
          onChange({ buttonText: 'Confirming transaction...' })
          tx.wait().then(() => {
            onChange({ tx: tx.hash })
          })
        })
        .catch(() => {
          onChange({ disabled: false, buttonText: initialButtonText })
        })
    }
    if (cryptoSelected && submit) {
      makeOffer()
    }
  }, [submit])
}

export default useMakeOffer
