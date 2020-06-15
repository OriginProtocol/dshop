import React, { useState, useEffect } from 'react'

import useProducts from 'utils/useProducts'
import { useRouteMatch, useHistory } from 'react-router'
import useBackendApi from 'utils/useBackendApi'
import ImagePicker from 'components/ImagePicker'

import DeleteButton from './_Delete'
import useProduct from 'utils/useProduct'

const EditProduct = () => {
  const history = useHistory()
  const match = useRouteMatch('/admin/products/:productId')
  const { productId } = match.params
  const { refetch } = useProducts()
  const { post } = useBackendApi({ authToken: true })

  const [submitting, setSubmitting] = useState(false)
  const [, setSubmitError] = useState(null)

  const isNewProduct = productId === 'new'

  const title = `${isNewProduct ? 'Add' : 'Edit'} product`

  const { product } = useProduct(productId)

  const [media, setMedia] = useState([])

  useEffect(() => {
    if (product) {
      let imageArray = product.images
      if (!imageArray && product.image) {
        imageArray = [product.image]
      } else if (!imageArray) {
        imageArray = []
      }

      const mappedImages = imageArray.map((image) => ({
        src: image.includes('/__tmp/')
          ? image
          : `/${localStorage.activeShop}/${product.id}/orig/${image}`,
        path: image
      }))

      setMedia(mappedImages)
    }
  }, [product])

  const createProduct = async () => {
    if (submitting) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      await post(`/products`, {
        method: 'POST',
        body: JSON.stringify({
          //  TODO: from input state
          ...product,
          title: 'New product',
          price: 20000,
          images: media.map((file) => file.path)
        })
      })

      await refetch()
      history.push('/admin/products')
      return
    } catch (error) {
      console.error('Could not update the product', error)
      setSubmitError('Could not update the product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-edit-product">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          createProduct()
        }}
      >
        <div className="title-section d-flex justify-content-between mb-3">
          <h3 className="m-0">{title}</h3>
          <div className="actions">
            {isNewProduct ? (
              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={() => {
                  history.push('/admin/products')
                }}
              >
                Discard
              </button>
            ) : (
              <DeleteButton type="button" product={product}>
                Delete
              </DeleteButton>
            )}
            <button className="btn btn-primary ml-2" type="submit">
              Save
            </button>
          </div>
        </div>
        <div className="form-section">
          <div className="form-group">
            <label>Title</label>
            {/* <input type="text" value="" /> */}
            {product && product.title}
          </div>

          <ImagePicker images={media} onChange={(media) => setMedia(media)} />
        </div>
      </form>
    </div>
  )
}

export default EditProduct

require('react-styl')(`
  .admin-edit-product
    display: block

    .actions .btn
      width: 120px

    .title-section
      border-bottom: 1px solid #dfe2e6
      padding-bottom: 1rem
`)
