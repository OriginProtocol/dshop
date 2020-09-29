import React, { useState, useEffect } from 'react'
import { useRouteMatch, useHistory, Prompt } from 'react-router'

import get from 'lodash/get'
import pickBy from 'lodash/pickBy'

import fbt, { FbtParam } from 'fbt'

import { useStateValue } from 'data/state'
import formatPrice from 'utils/formatPrice'
import useAdminProduct from 'utils/useAdminProduct'
import useCollections from 'utils/useCollections'
import useBackendApi from 'utils/useBackendApi'
import useSetState from 'utils/useSetState'
import { formInput, formFeedback } from 'utils/formHelpers'
import { generateVariants } from 'utils/generateVariants'

import fetchProduct from 'data/fetchProduct'
// import { Countries } from '@origin/utils/Countries'
// import ProcessingTimes from '@origin/utils/ProcessingTimes'

import Link from 'components/Link'
import Redirect from 'components/Redirect'
import ImagePicker from 'components/ImagePicker'
import DeleteButton from './_Delete'
import EditOption from './_EditOption'
import EditVariants from './_EditVariants'

import LinkCollections from './_LinkCollections'

const removeErrorKeys = (obj) => {
  return {
    ...pickBy(obj, (v, k) => !k.endsWith('Error'))
  }
}

function validate(state, { hasOptions }) {
  const newState = {}
  let validVariants = true
  let validCustomProcTime = true

  if (!state.title || !state.title.trim().length) {
    newState.titleError = fbt('Title is required', 'admin.products.titleError')
  }

  if (!state.description || !state.description.trim().length) {
    newState.descriptionError = fbt(
      'Description is required',
      'admin.products.descriptionError'
    )
  }

  if (hasOptions) {
    newState.variants = state.variants.map((variant) => {
      const out = removeErrorKeys(variant)
      if (!variant.title || !variant.title.trim().length) {
        out.titleError = fbt(
          'Variant name is required',
          'admin.products.varNameError'
        )
      }

      if (!variant.options || !variant.options.length) {
        out.optionsError = fbt(
          'At least one value is required',
          'admin.products.optionsError'
        )
      }

      if (variant.available) {
        if (!variant.price || variant.price < 0) {
          out.priceError = fbt('Price is required', 'admin.products.priceError')
        } else if (!String(variant.price).match(/^[0-9]+(\.[0-9]{1,2})?$/)) {
          out.priceError = fbt('Invalid price', 'admin.products.priceValError')
        }
      }

      return out
    })

    validVariants = newState.variants.every((v) =>
      Object.keys(v).every((f) => f.indexOf('Error') < 0)
    )
  } else {
    if (!state.price || state.price < 0) {
      newState.priceError = fbt(
        'Price is required',
        'admin.products.priceError'
      )
    } else if (!String(state.price).match(/^[0-9]+(\.[0-9]{1,2})?$/)) {
      newState.priceError = fbt('Invalid price', 'admin.products.priceValError')
    }
  }

  // if (!state.dispatchOrigin) {
  //   newState.dispatchOriginError = 'Select a dispatch origin'
  // }

  // if (!state.processingTime) {
  //   newState.processingTimeError = 'Select a processing time'
  // } else
  if (state.processingTime === 'custom') {
    newState.processingTimeOpts = {
      ...removeErrorKeys(state.processingTimeOpts)
    }

    if (!state.processingTimeOpts || !state.processingTimeOpts.fromVal) {
      newState.processingTimeOpts.fromValError = fbt(
        'Select a value',
        'admin.products.fromValError'
      )
    }

    if (!state.processingTimeOpts || !state.processingTimeOpts.toVal) {
      newState.processingTimeOpts.toValError = fbt(
        'Select a value',
        'admin.products.toValError'
      )
    }

    validCustomProcTime = Object.keys(newState.processingTimeOpts).every(
      (f) => f.indexOf('Error') < 0
    )
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)
  return {
    valid: validVariants && validCustomProcTime && valid,
    newState: {
      ...removeErrorKeys(state),
      ...newState
    }
  }
}

const EditProduct = () => {
  const history = useHistory()
  const match = useRouteMatch('/admin/products/:productId')
  const [{ config }, dispatch] = useStateValue()
  const { productId } = match.params
  const { post } = useBackendApi({ authToken: true })

  const [submitting, setSubmitting] = useState(false)
  const [, setSubmitError] = useState(null)

  const [formState, setFormState] = useSetState({
    options: [],
    variants: [],
    collections: []
  })

  const [hasOptions, setHasOptions] = useState(false)

  const isNewProduct = productId === 'new'
  const externallyManaged = formState.externalId ? true : false

  const input = formInput(formState, (newState) => {
    setFormState({ ...newState, hasChanges: true })
  })
  const Feedback = formFeedback(formState)

  // const procTimeState = get(formState, 'processingTimeOpts', {})

  // const customProcTimeInput = formInput(procTimeState, (newState) => {
  //   setFormState({
  //     processingTimeOpts: {
  //       ...formState.processingTimeOpts,
  //       ...newState
  //     }
  //   })
  // })
  // const customProcTimeFeedback = formFeedback(procTimeState)

  const title = isNewProduct
    ? fbt('Add product', 'admin.products.addProduct')
    : fbt('Edit product', 'admin.products.editProduct')

  const { product } = useAdminProduct(productId)
  const { collections } = useCollections()
  const [media, setMedia] = useState([])

  useEffect(() => {
    if (product === null) {
      history.push('/admin/products')
      return
    }
    if (product === undefined) {
      return
    }
    const newFormState = {
      ...product,
      price: (product.price / 100).toFixed(2),
      variants: (product.variants || []).map((variant) => ({
        ...variant,
        price: (variant.price / 100).toFixed(2)
      }))
    }

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

    const shouldBackfillOptions =
      newFormState.options &&
      (!newFormState.availableOptions ||
        newFormState.availableOptions.length !== product.options.length)

    if (shouldBackfillOptions) {
      // While editing existing products
      newFormState.availableOptions = newFormState.options.map(
        (option, index) => {
          // Parse possible values from generated variants
          return Array.from(
            new Set(
              (product.variants || [])
                .map((v) => v.options[index])
                .filter((o) => !!o)
            )
          )
        }
      )
    }

    // Regenerate variants
    newFormState.variants = generateVariants(newFormState)

    setMedia(mappedImages)
    setFormState(newFormState)
    setHasOptions(!!product.options && product.options.length > 0)
  }, [product])

  useEffect(() => {
    if (collections && collections.length) {
      setFormState({
        collections: collections
          .filter((c) => c.products.includes(productId))
          .map((c) => c.id)
      })
    }
  }, [collections.length, productId])

  useEffect(() => {
    if (hasOptions && (!formState.options || !formState.options.length)) {
      setFormState({
        // Enforce at least one option if checkbox is selected
        options: [''],
        availableOptions: [[]]
      })
    }
  }, [hasOptions, formState])

  const createProduct = async () => {
    if (submitting) return

    setSubmitError(null)

    const { valid, newState } = validate(formState, { hasOptions })
    setFormState({ ...newState, hasChanges: false })

    if (!valid) {
      setSubmitError(
        fbt(
          'Please fill in all required fields',
          'admin.products.missingFieldsError'
        )
      )
      dispatch({
        type: 'toast',
        message: fbt(
          'Please fill in all required fields',
          'admin.products.missingFieldsError'
        ),
        style: 'error'
      })
      return
    }

    setSubmitting(true)

    const variants = (newState.variants || []).map((variant) => ({
      ...variant,
      price: variant.price * 100
    }))

    try {
      const { product } = await post(`/products`, {
        method: 'POST',
        body: JSON.stringify({
          ...newState,
          price: hasOptions
            ? variants.reduce((min, v) => {
                return v.price < min ? v.price : min
              }, get(variants, '0.price', newState.price * 100))
            : newState.price * 100,
          images: media.map((file) => file.path),
          collections: newState.collections,
          variants
        })
      })

      // Clear memoize cache for existing product
      fetchProduct.cache.delete(`${config.dataSrc}-${product.id}`)

      dispatch({
        type: 'toast',
        message: fbt('Product saved', 'admin.products.productSaved')
      })
      dispatch({
        type: 'reload',
        target: ['products', 'collections', 'shopConfig']
      })

      if (!newState.id) {
        history.push(`/admin/products/${product.id}`)
      }

      return
    } catch (error) {
      console.error('Could not update the product', error)
      setSubmitError(
        fbt('Could not update the product', 'admin.products.updateFailed')
      )
    } finally {
      setSubmitting(false)
    }
  }

  const actions = (
    <div className="actions">
      {isNewProduct ? (
        <button
          className="btn btn-outline-primary"
          type="button"
          onClick={() => {
            setFormState({ hasChanges: false, redirectTo: '/admin/products' })
          }}
          children="Discard"
        />
      ) : (
        <DeleteButton type="button" product={product}>
          <fbt desc="Delete">Delete</fbt>
        </DeleteButton>
      )}
      <button
        className={`btn btn-primary${formState.hasChanges ? '' : ' disabled'}`}
        type="submit"
        children="Save"
      />
    </div>
  )

  if (formState.redirectTo) {
    return <Redirect to={formState.redirectTo} />
  }

  return (
    <div className="admin-edit-product">
      <Prompt
        when={formState.hasChanges ? true : false}
        message={fbt(
          'Are you sure? You have unsaved changes.',
          'admin.products.unsavedChanges'
        ).toString()}
      />
      <form
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault()
          createProduct()
        }}
      >
        <h3 className="admin-title with-border">
          <Link to="/admin/products" className="muted">
            <fbt desc="Products">Products</fbt>
          </Link>
          <span className="chevron" />
          {title}
          {actions}
        </h3>

        <div className="row">
          <div className="col-md-9">
            <div className="form-section">
              {!externallyManaged ? null : (
                <div className="alert alert-info">
                  <fbt desc="admin.products.manageViaPrintful">
                    Please manage this product
                    <a
                      className="ml-1"
                      style={{ textDecoration: 'underline' }}
                      href={`https://www.printful.com/dashboard/sync/update?id=${formState.externalId}`}
                    >
                      via Printful
                    </a>
                  </fbt>
                  .
                </div>
              )}
              <div className="form-group">
                <label>
                  <fbt desc="Title">Title</fbt>
                </label>
                <input
                  type="text"
                  {...input('title')}
                  autoFocus={isNewProduct && !externallyManaged}
                  disabled={externallyManaged}
                />
                {Feedback('title')}
              </div>

              <div className="form-group">
                <label>
                  <fbt desc="Description">Description</fbt>
                </label>
                <textarea
                  {...input('description')}
                  disabled={externallyManaged}
                />
                {Feedback('description')}
              </div>

              <div className="media-uploader">
                <label>
                  <fbt desc="Photos">Photos</fbt>{' '}
                  {externallyManaged ? null : (
                    <span>
                      (
                      <fbt desc="admin.products.addManyPhotos">
                        add as many as you like
                      </fbt>
                      )
                    </span>
                  )}
                </label>
                <ImagePicker
                  images={media}
                  onChange={(media) => {
                    setFormState({ hasChanges: true })
                    setMedia(media)
                  }}
                  disabled={externallyManaged}
                />
              </div>

              <div className={`row${hasOptions ? ' d-none' : ''}`}>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>
                      <fbt desc="Price">Price</fbt>
                    </label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text">
                          {formatPrice(0, {
                            symbolOnly: true,
                            currency: config.currency
                          })}
                        </span>
                      </div>
                      <input
                        {...input('price')}
                        disabled={externallyManaged || hasOptions}
                      />
                    </div>
                    {Feedback('price')}
                  </div>

                  <div className="form-group">
                    <label>
                      <fbt desc="SKU">SKU</fbt>{' '}
                      <span>
                        (<fbt desc="StockKeepingUnit">Stock Keeping Unit</fbt>)
                      </span>
                    </label>
                    <input
                      type="text"
                      {...input('sku')}
                      disabled={hasOptions}
                    />
                    {Feedback('sku')}
                  </div>
                  {/* <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" {...input('quantity')} />
                    {Feedback('quantity')}
                  </div> */}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <label>
                  <fbt desc="Variants">Variants</fbt>
                </label>
                <div className="form-check">
                  <label className="form-check-label">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={hasOptions}
                      disabled={externallyManaged}
                      onChange={(e) => {
                        setHasOptions(e.target.checked)
                        setFormState({ hasChanges: true })
                      }}
                    />
                    <fbt desc="admin.products.hasVariants">
                      This product has multiple options, like different sizes
                    </fbt>
                  </label>
                </div>
              </div>
            </div>

            {!hasOptions ? null : (
              <>
                {(formState.options || []).map((option, index) => {
                  return (
                    <EditOption
                      key={index}
                      label={
                        <fbt desc="admin.products.optionTitle">
                          Option{' '}
                          <FbtParam name="optionNumber">{index + 1}</FbtParam>
                        </fbt>
                      }
                      placeholder={
                        index === 0
                          ? fbt('eg Size', 'admin.products.optionExampleSize')
                          : index === 1
                          ? fbt('eg Color', 'admin.products.optionExampleColor')
                          : null
                      }
                      formState={{
                        title: option,
                        options: formState.availableOptions[index]
                      }}
                      setFormState={(newState) => {
                        const updatedState = {
                          options: [...formState.options],
                          availableOptions: [...formState.availableOptions]
                        }

                        const keysToUpdate = Object.keys(newState)

                        if (keysToUpdate.includes('title')) {
                          updatedState.options[index] = newState.title
                        }

                        if (keysToUpdate.includes('options')) {
                          updatedState.availableOptions[index] =
                            newState.options

                          updatedState.variants = generateVariants({
                            ...formState,
                            ...updatedState
                          })
                        }
                        updatedState.hasChanges = true
                        setFormState(updatedState)
                      }}
                      onRemove={() => {
                        const options = [...formState.options]
                        const availableOptions = [...formState.availableOptions]
                        options.splice(index, 1)
                        availableOptions.splice(index, 1)
                        setFormState({
                          options,
                          availableOptions,
                          hasChanges: true
                        })
                      }}
                      disabled={externallyManaged}
                    />
                  )
                })}
                <div className="mb-5">
                  {get(formState, 'options.length') >= 3 ||
                  externallyManaged ? null : (
                    <button
                      className="btn btn-outline-primary"
                      type="button"
                      onClick={() => {
                        setFormState({
                          options: [...formState.options, ''],
                          availableOptions: [...formState.availableOptions, []],
                          hasChanges: true
                        })
                      }}
                    >
                      <fbt desc="admin.products.addOption">Add option</fbt>
                    </button>
                  )}
                </div>
                <EditVariants
                  currency={config.currency}
                  options={formState.options}
                  variants={formState.variants}
                  media={media}
                  disabled={externallyManaged}
                  onChange={(variants) => {
                    setFormState({ variants, hasChanges: true })
                  }}
                />
              </>
            )}

            {/* <div>
              <label>Shipping</label>
              <div className="form-check">
                <input
                  checked={formState.shipInternational ? true : false}
                  onChange={(e) =>
                    setFormState({ shipInternational: e.target.checked })
                  }
                  id="shippingCheckbox"
                  type="checkbox"
                  className="form-check-input"
                />
                <label className="form-check-label" htmlFor="shippingCheckbox">
                  Products ship internationally
                </label>
                {Feedback('shipping')}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Dispatch Origin</label>
                  <select {...input('dispatchOrigin')}>
                    <option>Please choose one...</option>
                    {Object.keys(Countries).map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {Feedback('dispatchOrigin')}
                </div>

                <div className="form-group">
                  <label>Processing Time</label>
                  <select {...input('processingTime')}>
                    <option>Please choose one...</option>
                    {ProcessingTimes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {Feedback('processingTime')}
                </div>

                {formState.processingTime !== 'custom' ? null : (
                  <div className="row">
                    <div className="col-6">
                      <div className="form-group">
                        <select {...customProcTimeInput('fromVal')}>
                          <option>From...</option>
                          {new Array(10).fill(0).map((_, index) => (
                            <option key={index} value={index + 1}>
                              {index + 1}
                            </option>
                          ))}
                        </select>
                        {customProcTimeFeedback('fromVal')}
                      </div>
                    </div>

                    <div className="col-6">
                      <div className="form-group">
                        <select {...customProcTimeInput('toVal')}>
                          <option>To...</option>
                          {new Array(10).fill(0).map((_, index) => (
                            <option key={index} value={index + 1}>
                              {index + 1}
                            </option>
                          ))}
                        </select>
                        {customProcTimeFeedback('toVal')}
                      </div>
                    </div>

                    <div className="col-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          checked={
                            get(procTimeState, 'interval', 'days') === 'days'
                          }
                          onChange={(e) => {
                            setFormState({
                              processingTimeOpts: {
                                ...procTimeState,
                                interval: e.target.value
                              }
                            })
                          }}
                          value="days"
                          id="procTimeDays"
                        />
                        <label
                          htmlFor="procTimeDays"
                          className="form-check-label"
                        >
                          Business days
                        </label>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          checked={
                            get(procTimeState, 'interval', 'days') === 'weeks'
                          }
                          onChange={(e) => {
                            setFormState({
                              processingTimeOpts: {
                                ...procTimeState,
                                interval: e.target.value
                              }
                            })
                          }}
                          value="weeks"
                          id="procTimeWeeks"
                        />
                        <label
                          htmlFor="procTimeWeeks"
                          className="form-check-label"
                        >
                          Weeks
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div> */}
          </div>
          <div className="col-md-3">
            <LinkCollections
              selectedValues={formState.collections}
              onChange={(collections) =>
                setFormState({ collections, hasChanges: true })
              }
            />
          </div>
        </div>
        <div className="footer-actions">{actions}</div>
      </form>
    </div>
  )
}

export default EditProduct

require('react-styl')(`
  .admin-edit-product
    display: block

    .footer-actions
      border-top: 1px solid #cdd7e0
      margin-top: 1rem
      padding-top: 2rem
      margin-bottom: 5rem
      display: flex
      justify-content: flex-end

    .form-group, .form-check
      margin-bottom: 1rem

    textarea
      height: 150px

    label span
      color: #8293a4
      font-size: 0.875rem
      font-weight: normal
`)
