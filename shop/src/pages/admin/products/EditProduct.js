import React, { useMemo, useState } from 'react'

import useProducts from 'utils/useProducts'
import { useRouteMatch, useHistory } from 'react-router'
import useBackendApi from 'utils/useBackendApi'

import DeleteButton from './_Delete'

const EditProduct = () => {
  const history = useHistory()
  const match = useRouteMatch('/admin/products/:productId')
  const { productId } = match.params
  const { products, refetch } = useProducts()
  const { post } = useBackendApi({ authToken: true })

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  
  const isNewProduct = productId === 'new'
  
  const title = `${isNewProduct ? 'Add' : 'Edit'} product`

  const product = useMemo(() => {
    if (!products) return null
    return products.find(p => p.id === productId)
  }, [productId, products])

  const createProduct = async () => {
    if (submitting) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      await post(`/products`, {
        method: 'POST',
        body: JSON.stringify({
          //  TODO: from input state
          title: 'New product',
          price: 20000,
          image:"img-0.png"
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
      <form onSubmit={e => {
        e.preventDefault()
        createProduct()
      }}>
        <div className="title-section d-flex justify-content-between mb-3">
          <h3 className="m-0">{title}</h3>
          <div className="actions">
              {isNewProduct ? (
                <button className="btn btn-outline-primary" type="button" onClick={() => {
                  history.push('/admin/products')
                }}>Discard</button>
              ) : <DeleteButton type="button" product={product}>Delete</DeleteButton>}
            <button className="btn btn-primary ml-2" type="submit">Save</button>
          </div>
        </div>
        <div className="form-section">
          <div className="form-group">
            <label>Title</label>
            {/* <input type="text" value="" /> */}
            {product && product.title}
          </div>
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
