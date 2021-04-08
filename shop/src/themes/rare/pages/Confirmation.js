import React, { useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import queryString from 'query-string'
import { confetti } from '../components/confetti'

import useConfig from 'utils/useConfig'
import useSingleProduct from 'utils/useSingleProduct'
import { usePrices } from '../utils'

import Etherscan from '../components/Etherscan'

const Confirmation = ({ buy, sell }) => {
  const location = useLocation()
  const opts = queryString.parse(location.search)
  const { config } = useConfig()
  const ref = useRef()
  const product = useSingleProduct()
  const [state] = usePrices({})

  useEffect(() => {
    if (product) {
      confetti(ref.current)
    }
  }, [product])

  if (!product) {
    return null
  }

  const numOwned = Number(state.ownedChico) || 0

  let content, title
  let nextLink = 'Nice, thanks!'

  if (buy) {
    title = (
      <>
        You purchased <span className="text-purple-600">${config.coin}!</span>
      </>
    )
    content = (
      <>
        You can sell your $CHICO or redeem it for a sweet limited edition
        T-shirt
      </>
    )
  } else if (sell) {
    title = (
      <>
        You sold <span className="text-purple-600">${config.coin}!</span>
      </>
    )
    content = <Etherscan hash={opts.tx} />
    if (numOwned > 0) {
      content = (
        <div className="text-xl">
          {`You still own ${numOwned} $${config.coin}`}
        </div>
      )
    }
  } else {
    title = (
      <>
        You redeemed <span className="text-purple-600">${config.coin}!</span>
      </>
    )
    content =
      'Your sweet, limited edition Chico Tee is on it’s way! We’ll email you with details.'
    nextLink = 'Dope!'
  }

  return (
    <div ref={ref} className="container mt-12 flex flex-col items-center">
      <div className="flex items-center">
        <div className="text-lg sm:text-4xl font-semibold rounded-full bg-purple-600 w-32 h-32 sm:w-48 sm:h-48 text-black flex items-center justify-center">
          $CHICO
        </div>
        <div
          className="rounded-full border-purple-600 w-32 h-32 sm:w-48 sm:h-48 border bg-no-repeat bg-center bg-black"
          style={{
            marginLeft: '-1.5rem',
            backgroundSize: '60%',
            backgroundImage: `url(chico-crypto/mini-shirt-icon.svg)`
          }}
        />
      </div>
      <div className="text-xl sm:text-5xl mt-8 font-semibold">{title}</div>
      <div className="sm:text-lg mt-3 text-gray-300">{content}</div>
      <Link to="/product" className="btn btn-primary w-auto px-16 mt-12">
        {nextLink}
      </Link>
    </div>
  )
}

export default Confirmation
