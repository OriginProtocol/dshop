import React, { useReducer, useEffect } from 'react'
import omit from 'lodash/omit'
import sortBy from 'lodash/sortBy'

import fbt from 'fbt'

import useProducts from 'utils/useProducts'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import Modal from 'components/Modal'
import ProductImage from 'components/ProductImage'

const reducer = (state, newState) => {
  return newState.reset ? omit(newState, 'reset') : { ...state, ...newState }
}

const AddProducts = ({ children, collection }) => {
  const { post } = useBackendApi({ authToken: true })
  const { products } = useProducts()
  const [, dispatch] = useStateValue()
  const [state, setState] = useReducer(reducer, {
    products: collection.products,
    sortedProducts: products || []
  })

  useEffect(() => {
    setState({ products: collection.products })
  }, [collection.products])

  useEffect(() => {
    setState({
      sortedProducts: sortBy(products, (p) => {
        const idx = collection.products.indexOf(p.id)
        return idx < 0 ? Infinity : idx
      })
    })
  }, [products, collection.products])

  function onCheck(product, checked) {
    if (checked) {
      setState({ products: [...state.products, product.id] })
    } else {
      setState({ products: state.products.filter((p) => p !== product.id) })
    }
  }

  return (
    <>
      <button
        className="btn btn-primary px-4"
        children={children || 'Add products'}
        onClick={() => setState({ modal: true })}
      />
      {state.modal && (
        <Modal
          onClose={() => setState({ modal: false, shouldClose: false })}
          shouldClose={state.shouldClose}
        >
          <div className="modal-body">
            <h4>
              <fbt desc="admin.collections.editProducts">Edit products</fbt>
            </h4>
            <div className="collection-products">
              {products.length ? null : 'No products found.'}
              {state.sortedProducts.map((product) => (
                <label key={product.id} className="d-flex align-items-center">
                  <input
                    type="checkbox"
                    checked={state.products.indexOf(product.id) >= 0}
                    onChange={(e) => onCheck(product, e.target.checked)}
                  />
                  <ProductImage product={product} className="mx-3" />
                  {product.title}
                </label>
              ))}
            </div>
            <div className="action-buttons">
              <div>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setState({ shouldClose: true })}
                  children={<fbt desc="Cancel">Cancel</fbt>}
                />
                <button
                  className={`btn btn-primary${
                    state.saving ? ' disabled' : ''
                  }`}
                  onClick={() => {
                    const body = JSON.stringify({
                      products: state.products.filter((p) => p)
                    })
                    setState({ saving: true })
                    post(`/collections/${collection.id}`, {
                      method: 'PUT',
                      body
                    })
                      .then(() => {
                        dispatch({
                          type: 'reload',
                          target: 'collections'
                        })
                        dispatch({
                          type: 'toast',
                          message: fbt(
                            'Saved OK',
                            'admin.collections.saveSuccess'
                          )
                        })
                        setState({ shouldClose: true })
                      })
                      .catch((err) => {
                        console.error(err)
                        setState({ saving: false })
                      })
                  }}
                >
                  <fbt desc="Save">Save</fbt>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default AddProducts

require('react-styl')(`
  .collection-products
    max-height: 50vh
    overflow: auto
    margin-top: 2rem
`)
