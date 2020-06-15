import React, { useState, useEffect } from 'react'
import { useRouteMatch, useHistory } from 'react-router'

import useProducts from 'utils/useProducts'
import useProduct from 'utils/useProduct'
import useBackendApi from 'utils/useBackendApi'
import useSetState from 'utils/useSetState'
import { formInput, formFeedback } from 'utils/formHelpers'

import ImagePicker from 'components/ImagePicker'
import DeleteButton from './_Delete'

function validate(state) {
  const newState = {}

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)
  return { valid, newState: { ...state, ...newState } }
}

const EditProduct = () => {
  const history = useHistory()
  const match = useRouteMatch('/admin/products/:productId')
  const { productId } = match.params
  const { refetch } = useProducts()
  const { post } = useBackendApi({ authToken: true })

  const [submitting, setSubmitting] = useState(false)
  const [, setSubmitError] = useState(null)

  const [formState, setFormState] = useSetState({})

  const isNewProduct = productId === 'new'

  const input = formInput(formState, (newState) => setFormState(newState))
  const Feedback = formFeedback(formState)
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

      setFormState(product)
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
          ...formState,
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
        <div className="row">
          <div className="col-md-9">

            <div className="form-section">
              <div className="form-group">
                <label>Title</label>
                <input type="text" {...input('title')} />
                {Feedback('title')}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea {...input('description')} />
                {Feedback('description')}
              </div>

              <div className="media-uploader">
                <label>Photos <span>(add as many as you like)</span></label>
                <ImagePicker images={media} onChange={(media) => setMedia(media)} />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Price</label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text">$</span>
                      </div>
                      <input type="number" {...input('price')} />
                    </div>
                    {Feedback('price')}
                  </div>

                  <div className="form-group">
                    <label>SKU <span>(Stock Keeping Unit)</span></label>
                    <input type="text" {...input('sku')} />
                    {Feedback('sku')}
                  </div>

                  <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" {...input('quantity')} />
                    {Feedback('quantity')}
                  </div>
                </div>
              </div>
            </div>


            <div className="row">
              <div className="col-md-6">
                <label>Vairants</label>
                <div className="form-check">
                  <input {...input('variants')} id="variantsCheckbox" type="checkbox" className="form-check-input" />
                  <label className="form-check-label" htmlFor="variantsCheckbox">This product has multiple options, like different sizes</label>
                  {Feedback('variants')}
                </div>
              </div>
            </div>

            <div>
              <label>Shipping</label>
              <div className="form-check">
                <input {...input('shipping')} id="shippingCheckbox" type="checkbox" className="form-check-input" />
                <label className="form-check-label" htmlFor="shippingCheckbox">Products ship internationally</label>
                {Feedback('shipping')}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Dispatch Origin</label>
                  <select {...input('origin')}>
                    <option value="value-1">Value 1</option>
                    <option value="value-1">Value 2</option>
                  </select>
                  {Feedback('origin')}
                </div>

                <div className="form-group">
                  <label>Processing Time</label>
                  <select {...input('processingTime')}>
                    <option value="value-1">Value 1</option>
                    <option value="value-1">Value 2</option>
                  </select>
                  {Feedback('processingTime')}
                </div>
              </div>
            </div>

          </div>
          <div className="col-md-2"></div>
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

    .form-group, .form-check
      margin-bottom: 1rem
    
    textarea
      height: 150px
`)
