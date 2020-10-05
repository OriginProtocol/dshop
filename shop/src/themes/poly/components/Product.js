import React, { useState } from 'react'

import { useStateValue } from 'data/state'
import useProduct from 'utils/useProduct'
import useIsMobile from 'utils/useIsMobile'

import Link from 'components/Link'

const Product = ({ match }) => {
  const isMobile = useIsMobile()
  const [addedToCart, setAddedToCart] = useState()
  const [, dispatch] = useStateValue()
  const { product, variant, loading } = useProduct(match.params.id)

  if (loading || !product) {
    return null
  }

  const Images = () =>
    product.imageUrls.map((image, idx) => <img key={idx} src={image} />)

  const btnCls = 'btn sm:px-12 text-xl block text-center sm:inline'
  const Details = () => (
    <>
      <div className="text-4xl sm:text-5xl leading-none">{product.title}</div>
      <div className="mt-4 text-4xl font-bold mb-8">{variant.priceStr}</div>
      {addedToCart ? (
        <Link to="/cart" className={btnCls}>
          View Cart
        </Link>
      ) : (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            dispatch({ type: 'addToCart', product, variant })
            setAddedToCart(true)
          }}
          className={btnCls}
        >
          Add to Cart
        </a>
      )}
    </>
  )
  if (isMobile) {
    return (
      <>
        <div className="container my-8">
          <Details />
        </div>
        <Images />
        <div
          className="container mt-12 mb-24 whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </>
    )
  }
  return (
    <div className="container mt-16 flex flex-row">
      <div className="mb-10 grid gap-12" style={{ flex: '1' }}>
        <Images />
      </div>
      <div className="sm:ml-24" style={{ flex: '1' }}>
        <Details />
        <div
          className="mt-12 mb-24 whitespace-pre-line text-2xl"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </div>
    </div>
  )
}

export default Product
