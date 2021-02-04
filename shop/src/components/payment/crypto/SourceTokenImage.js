import React, { useState, useEffect } from 'react'
import fetch from 'cross-fetch'

const Web3Utils = require('web3-utils')

/**
 * Token Logo Source URLs, especially ones available on Ethereum Lists, sometimes link to websites that _contain_ the image for the token. Returning
 * such links would fail to display the token image on DShop. 'checkForImage' may therefore be used to filter to verify that the link returns an image
 * directly.
 * @ param url: <string> Logo URL
 * @ returns <Promise<string>> if 'url' passes the test; <Promise<undefined>> if it fails.
 */
const checkForImage = (url) => {
	return fetch(url)
		.then((res) => {
			if (res.status >= 400) {
				throw new Error(`HTTPS response status code: ${res.status}`)
			}

			const response_type = res.headers.get('content-type')

			const acceptable_types = ['image/png', 'image/jpeg', 'image/svg+xml']
			let is_acceptable = false
			for (let _type of acceptable_types) {
				if (_type == response_type) {
					is_acceptable = true
					break
				}
			}

			if (is_acceptable) {
				return url
			} else {
				throw new Error(
					`The URL may not be returning an image. HTTPS response: ${res}\n`
				)
			}
		})
		.catch((err) =>
			console.log(`Error fetching token image from ${url}: ${err}`)
		)
}
/**
 * @param token_checksum_address: <string>
 * @returns <Promise<string>> if the token_checksum_address has a valid Token Image in the TrustWallet repository.
 * @returns <Promise<undefined>> if an error is encountered. In this case, the error is logged to the console.
 *
 * Ref: https://developer.trustwallet.com/add_new_asset/for-developers
 */
const tryTrustWallet = (token_checksum_address) => {
	return checkForImage(
		`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${token_checksum_address}/logo.png`
	)
}

/**
 * @param token_checksum_address: <string>
 * @returns <Promise<string>> if token_checksum_address has a valid Token Image URL in the Ethereum Lists repository. The string will be the URL for the token image.
 * @returns <Promise<undefined> if errors are encountered. Errors are logged to the console.
 */
const tryEthLists = (token_checksum_address) => {
	const token_data_url = `https://raw.githubusercontent.com/ethereum-lists/tokens/master/tokens/eth/${token_checksum_address}.json`

	// getLogoSource: <Promise<string>> if token_checksum_address has valid data in the EthLists repo
	// Ref: https://github.com/ethereum-lists/tokens#tokens
	const getLogoSource = fetch(token_data_url)
							.then((response) => {
								if (response.status >= 400) {
									throw new Error(`HTTPS response status code: ${res.status}`)
								}
								return response.json() //token data
							})
							.then(data => data.logo.src)

	return getLogoSource
		.then((res) => {
			//The logo source URL is an optional parameter for token data on EthLists. Check for this possibility.
			if (res.length) {
				return checkForImage(res)
			} else throw new Error(`Error reading logo URL from ${token_data_url}.`)
		})
		.catch((err) =>
			console.log(
				`Cannot find token image using EthLists. Details:\nToken data URL: ${token_data_url}\n${err}`
			)
		)
}

/**
 * @prop address: <string> ERC-20 token address to find an image for
 */
const SourceTokenImage = ({ address }) => {
	const checksum_address = Web3Utils.toChecksumAddress(address)
	const [tokenImageUrl, setTokenImageUrl] = useState('')

	// attempts: <Array<Promise>>
	const attempts = [
		tryTrustWallet(checksum_address),
		tryEthLists(checksum_address)
	]

	//Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
	useEffect(() => {
		Promise.allSettled(attempts)
			.then((result_array) => {
				for (let outcome of result_array) {
					if (outcome.status == 'fulfilled' && outcome.value) {
						setTokenImageUrl(outcome.value)
						break
					}
				}
			})
			.catch((err) => {
				console.log(err) /*Ignore*/
			})
	}, [tokenImageUrl])

	return <img src={tokenImageUrl} />
}

export default SourceTokenImage
