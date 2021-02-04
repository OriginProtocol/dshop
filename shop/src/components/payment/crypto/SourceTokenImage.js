import React, { useState, useEffect } from 'react'
import fetch from 'cross-fetch'

const Web3Utils = require('web3-utils')

/**
 * Token Logo Source URLs, especially ones available on Ethereum Lists, sometimes link to websites that _contain_ the image for the token. Returning
 * such links would fail to display the token image on DShop. 'CheckForImage' may therefore be used to filter to verify that the link returns an image
 * directly.
 * @ param url: <string> Logo URL
 * @ returns <Promise<string>> if 'url' passes the test; <Promise<undefined>> if it fails.
 */
const CheckForImage = (url) => {
  return fetch(url)
    .then((res) => {
      if (res.status >= 400) {
        throw new Error(`HTTPS response status code: ${res.status}`)
      }

      const responseType = res.headers.get('content-type')

      const acceptableTypes = ['image/png', 'image/jpeg', 'image/svg+xml']
      let isAcceptable = false
      for (const _type of acceptableTypes) {
        if (_type == responseType) {
          isAcceptable = true
          break
        }
      }

      if (isAcceptable) {
        return url
      } else {
        throw new Error(`The URL may not be returning an image.`)
      }
    })
    .catch((err) =>
      console.log(`Error fetching token image from ${url}: ${err}`)
    )
}
/**
 * @param tokenChecksumAddress: <string>
 * @returns <Promise<string>> if the tokenChecksumAddress has a valid Token Image in the TrustWallet repository. The string will be the URL for the token image.
 * @returns <Promise<undefined>> if an error is encountered. In this case, the error is logged to the console.
 *
 * Ref: https://developer.trustwallet.com/add_new_asset/for-developers
 */
const TryTrustWallet = (tokenChecksumAddress) => {
  return CheckForImage(
    `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenChecksumAddress}/logo.png`
  )
}

/**
 * @param tokenChecksumAddress: <string>
 * @returns <Promise<string>> if tokenChecksumAddress has a valid Token Image URL in the Ethereum Lists repository. The string will be the URL for the token image.
 * @returns <Promise<undefined> if errors are encountered. Errors are logged to the console.
 */
const TryEthLists = (tokenChecksumAddress) => {
  const tokenDataUrl = `https://raw.githubusercontent.com/ethereum-lists/tokens/master/tokens/eth/${tokenChecksumAddress}.json`

  // getLogoSource: <Promise<string>> if tokenChecksumAddress has valid data in the EthLists repo [https://github.com/ethereum-lists/tokens#tokens]
  const getLogoSource = fetch(tokenDataUrl)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(`HTTPS response status code: ${response.status}`)
      }
      return response.json() //token data
    })
    .then((data) => data.logo.src)

  return getLogoSource
    .then((res) => {
      //The logo source URL is an optional parameter for token data on EthLists. Check for this possibility.
      if (res.length) {
        return CheckForImage(res)
      } else throw new Error(`Error reading logo URL from ${tokenDataUrl}.`)
    })
    .catch((err) =>
      console.log(
        `Cannot find token image using EthLists. Details:\nToken data URL: ${tokenDataUrl}\n${err}`
      )
    )
}

/**
 * @prop address: <string> ERC-20 token address to find an image for
 */
const SourceTokenImage = ({ address }) => {
  const checksumAddress = Web3Utils.toChecksumAddress(address)
  const [tokenImageUrl, setTokenImageUrl] = useState('')

  // attempts: <Array<Promise>>
  const attempts = [
    TryTrustWallet(checksumAddress),
    TryEthLists(checksumAddress)
  ]

  //Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
  useEffect(() => {
    Promise.allSettled(attempts)
      .then((resultArray) => {
        for (const outcome of resultArray) {
          if (outcome.status == 'fulfilled' && outcome.value) {
            setTokenImageUrl(outcome.value)
            break
          }
        }
      })
      .catch((err) => {
        console.log(err)
      })
  }, [tokenImageUrl])

  return <img src={tokenImageUrl} />
}

export default SourceTokenImage
