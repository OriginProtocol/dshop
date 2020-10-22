import React, { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { confetti } from '../components/confetti'

import useConfig from 'utils/useConfig'
import useSingleProduct from 'utils/useSingleProduct'
import { usePrices } from '../utils'

const Confirmation = ({ buy, sell }) => {
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

  if (buy) {
    title = `You bought $${config.coin}!`
    content = (
      <div className="text-xl font-bold">
        {`You now own ${state.ownedChico} $${config.coin}`}
      </div>
    )
  } else if (sell) {
    title = `You sold $${config.coin}!`
    if (numOwned > 0) {
      content = (
        <div className="text-xl">
          {`You still own ${numOwned} $${config.coin}`}
        </div>
      )
    }
  } else {
    title = `You redeemed $${config.coin}!`
    content = (
      <div className="px-8">
        You should receive a confirmation email momentarily.
      </div>
    )
  }

  return (
    <>
      <div
        ref={ref}
        className="w-full flex flex-col items-center bg-white rounded-lg pt-6 pb-8 text-black mb-6"
      >
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold mb-6">{title}</div>
          <img style={{ height: 150 }} src={product.imageUrl} />
          <div className="mt-6 leading-tight text-center">{content}</div>
        </div>
      </div>
      <Link to="/" className="btn">
        Back Home
      </Link>
    </>
  )
}

export default Confirmation
