import ethers from 'ethers'
import { useEffect } from 'react'
import { post } from '@origin/ipfs'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import usePrice from 'utils/usePrice'
import useOrigin from 'utils/useOrigin'
import { useStateValue } from 'data/state'

const { AddressZero } = ethers.constants

function useMakeOffer({
  submit,
  activeToken,
  encryptedData,
  onChange,
  tokenPrice
}) {
  const { signer, marketplace } = useOrigin()
  const { config } = useConfig()
  const { toTokenPrice } = usePrice(config.currency)
  const [{ cart }] = useStateValue()
  const cryptoSelected = get(cart, 'paymentMethod.id') === 'crypto'

  useEffect(() => {
    async function makeOffer() {
      onChange({
        disabled: true,
        loading: true,
        buttonText: 'Awaiting approval...'
      })
      const l = config.listingId.split('-')
      const listingId = l[l.length - 1]
      const finalizes = 0 // Let the seller finalize things

      const amount = toTokenPrice(cart.total, activeToken.name)
      const amountWei = ethers.utils.parseUnits(amount, 'ether')
      const buyerWalletAddress = await signer.getAddress()

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

      const value = activeToken.address === AddressZero ? amountWei : 0

      marketplace
        .makeOffer(
          listingId,
          offerIpfs,
          finalizes,
          AddressZero,
          0,
          amountWei,
          activeToken.address,
          buyerWalletAddress,
          { value }
        )
        .then((tx) => {
          onChange({ disabled: true, buttonText: 'Confirming transaction...' })
          tx.wait().then(() => {
            onChange({ tx: tx.hash })
          })
        })
        .catch((err) => {
          console.error(err)
          onChange({ disabled: false, loading: false, buttonText: tokenPrice })
        })
    }
    if (cryptoSelected && submit && signer) {
      makeOffer()
    }
  }, [submit, signer])
}

export default useMakeOffer
