import React, { useState } from 'react'

const Web3Utils = require('web3-utils')
const https = require('https')

const tryTrustWallet = (tokenChecksumAddress) => {
  return new Promise((resolve, reject) => {
    console.log(
      `In tryTrustWallet Promise. tokenChecksumAddress: ${tokenChecksumAddress}`
    )

    // Try loading image from TrustWallet repo
    // req is of type <https.ClientRequest> (extends <stream>)
    // References:
    // https://nodejs.org/api/http.html#http_class_http_clientrequest
    // https://developer.trustwallet.com/add_new_asset/for-developers
    const req = https.get(
      `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenChecksumAddress}/logo.png`
    )
    req.setTimeout(10000, (socket) => {
      console.log(`TrustWallet Token image request timed out`)
      socket.destroy()
    })
    req.on('response', (response) => {
      // response is of type <https.IncomingMessage> (extends <stream.Readable>)
      // if response's status is not 'OK', reject it
      if (response.statusCode < 200 || response.statusCode >= 300) {
        //but not before freeing up the internal memory by 'consuming'the data from the stream's buffer
        response.read()
        reject(
          new Error(
            `Error in fetching image URL from TrustWallet respository: HTTPS response status code: ${response.statusCode}`
          )
        )
      } else {
        response.read()
        resolve(
          `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenChecksumAddress}/logo.png`
        )
      }

      response.on('error', (error) => {
        reject(error)
      })
    })
    req.on('error', (error) => {
      reject(error)
    })
  })
}

//

// @param address: <string>
const findValidURL = async (address) => {
  const checksumAddress = Web3Utils.toChecksumAddress(address)
  try {
    const firstAttempt = await tryTrustWallet(checksumAddress)
    console.log(`findValidURL firstAttempt: ${firstAttempt}`)
    return firstAttempt
  } catch (e) {
    //log all rejections and error messages from the execution of 'firstAttempt'
    console.log('Error fetching Token Image URL:', e)
  }
}

const SourceTokenImage = ({ address }) => {
  const [tokenImageUrl, setTokenImageUrl] = useState('')
  findValidURL(address).then((result) => {
    console.log(`Result of SourceTokenImage(${address}): ${result}`)
    setTokenImageUrl(result)
  })
  return <img src={tokenImageUrl} />
}

export default SourceTokenImage
