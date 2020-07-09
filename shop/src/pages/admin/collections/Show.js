import React, { useReducer, useEffect } from 'react'
import { useRouteMatch } from 'react-router-dom'

import get from 'lodash/get'
import pickBy from 'lodash/pickBy'

import { useStateValue } from 'data/state'
import { formInput, formFeedback } from 'utils/formHelpers'

import DeleteButton from './_Delete'
import Link from 'components/Link'
import useConfig from 'utils/useConfig'
import useCollections from 'utils/useCollections'
import useProducts from 'utils/useProducts'
import useBackendApi from 'utils/useBackendApi'

import SortableTable from 'components/SortableTable'
import NoItems from 'components/NoItems'

const reducer = (state, newState) => ({ ...state, ...newState })

const validate = (state) => {
  const newState = {}

  if (!state.title) {
    newState.titleError = 'Title is required'
  }

  const valid = Object.keys(newState).every((f) => !f.endsWith('Error'))

  return {
    valid,
    newState: {
      ...pickBy(state, (v, k) => !k.endsWith('Error')),
      ...newState
    }
  }
}

const ShowCollection = () => {
  const [, dispatch] = useStateValue()
  const { config } = useConfig()
  const { products } = useProducts()
  const { collections } = useCollections()
  const match = useRouteMatch('/admin/collections/:collectionId')
  const { collectionId } = match.params

  const { post } = useBackendApi({ authToken: true })

  const [state, setState] = useReducer(reducer, {
    title: '',
    products: []
  })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  useEffect(() => {
    if (
      !products ||
      !collections ||
      !products.length ||
      !collections.length ||
      state.collection
    )
      return

    const collection = collections.find((c) => c.id === collectionId)

    const mappedProducts = get(collection, 'products', [])
      .map((pId) => products.find((p) => p.id === pId))
      .filter((p) => !!p)

    setState({
      collection,
      title: get(collection, 'title', ''),
      products: mappedProducts
    })
  }, [collections, collectionId, products, state.collection])

  const saveCollection = async () => {
    const { valid, newState } = validate(state)
    setState(newState)

    if (!valid) return

    setState({
      saving: 'saving'
    })

    try {
      await post(`/collections/${state.collection.id}`, {
        body: JSON.stringify({
          ...state.collection,
          title: state.title,
          products: state.products.map((p) => p.id)
        }),
        method: 'PUT'
      })

      dispatch({ type: 'reload', target: 'collections' })

      setState({
        saving: 'ok'
      })

      setTimeout(() => setState({ saving: false }), 2000)
    } catch (err) {
      console.error(err)
      setState({ saving: false })
    }
  }

  if (!state.collection) {
    return 'Loading...'
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        saveCollection()
      }}
    >
      <h3 className="admin-title with-border">
        <Link to="/admin/collections" className="muted">
          Collections
        </Link>
        <span className="chevron" />
        {state.title}
        <div className="actions">
          <DeleteButton collection={state.collection} />
          <button className="btn btn-primary" disabled={state.saving}>
            {state.saving === 'saving'
              ? 'Saving...'
              : state.saving === 'ok'
              ? 'Saved ✅'
              : 'Save'}
          </button>
        </div>
      </h3>
      <div className="form-group">
        <label>Collection Name</label>
        <input {...input('title')} />
        {Feedback('title')}
      </div>
      {state.products.length ? (
        <SortableTable
          items={state.products}
          onChange={(products) => {
            setState({ products })
          }}
          labels={['Product']}
        >
          {(product, DragTarget) => {
            const src = product.image
              ? `${config.activeShop}/${product.id}/orig/${product.image}`
              : null
            return (
              <>
                <div className="td title">
                  <div className="draggable-content" draggable>
                    <DragTarget />
                    {!src ? null : (
                      <img className="linked-product-image" src={src} />
                    )}
                    {product.title}
                  </div>
                </div>
              </>
            )
          }}
        </SortableTable>
      ) : (
        <NoItems
          heading="Add a product"
          description="Add a product to collection."
          linkTo="/admin/products"
          buttonText="Add products to collection"
        />
      )}
    </form>
  )
}

export default ShowCollection

require('react-styl')(`
  .linked-product-image
    width: 64px
    object-fit: contain
`)
