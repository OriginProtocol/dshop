import React, { useState } from 'react'
import fbt, { FbtParam } from 'fbt'

import useBackendApi from 'utils/useBackendApi'
import useProducts from 'utils/useProducts'
import { useStateValue } from 'data/state'
import ConfirmationModal from 'components/ConfirmationModal'
import ProductImage from 'components/ProductImage'

const AdminPrintfulSync = ({ buttonText, buttonClass, className = '' }) => {
  const { post } = useBackendApi({ authToken: true })
  const [{ admin }, dispatch] = useStateValue()
  const [refreshImages, setRefreshImages] = useState(false)

  const { products, loading } = useProducts()

  if (loading) {
    return (
      <button
        disabled
        className={`${buttonClass || 'btn btn-outline-primary'} ${className}`}
      >
        <fbt desc="Loading">Loading</fbt>...
      </button>
    )
  }

  const internalProducts = products.filter((p) => !p.externalId)

  return (
    <ConfirmationModal
      className={`${buttonClass || 'btn btn-outline-primary'} ${className}`}
      buttonText={buttonText || fbt('Sync', 'Sync')}
      confirmText={fbt(
        'Are you sure you want to sync with Printful?',
        'admin.settings.apps.printful.confirmSync'
      )}
      confirmedText={fbt('Synced OK', 'admin.settings.apps.printful.synced')}
      loadingText={`${fbt('Syncing', 'Syncing')}...`}
      onConfirm={() =>
        post(`/shop/sync-printful`, {
          body: JSON.stringify({ refreshImages })
        })
      }
      onSuccess={async () => {
        dispatch({ type: 'reload', target: 'products' })
      }}
    >
      {!internalProducts.length ? null : (
        <>
          <div className="mt-4">
            <fbt desc="admin.settings.apps.printfulInternalProdcutsWarn">
              The following{' '}
              <FbtParam name="count">
                <strong>{internalProducts.length}</strong>
              </FbtParam>{' '}
              products are not synced from Printful{' '}
              <FbtParam name="linkbreak">
                <br />
              </FbtParam>{' '}
              and will be removed after you do a sync.
            </fbt>
          </div>
          <div className="internal-products-list">
            {internalProducts.map((product) => (
              <div key={product.id}>
                <ProductImage product={product} className="mr-2" />
                <strong>{product.title}</strong>
              </div>
            ))}
          </div>
        </>
      )}
      {!admin.superuser ? null : (
        <div className="form-row mt-3 justify-content-center">
          <label className="m-0">
            <input
              type="checkbox"
              className="mr-2"
              checked={refreshImages}
              onChange={(e) => setRefreshImages(e.target.checked)}
            />{' '}
            Force refresh images
          </label>
        </div>
      )}
    </ConfirmationModal>
  )
}

export default AdminPrintfulSync

require('react-styl')(`
  .internal-products-list
    height: 135px
    overflow-y: scroll
    margin-top: 1rem
    border: 1px solid #ddd
    padding: 0.5rem
    > div
      display: flex
      align-items: center
      margin: 0.5rem 0

      .admin-product-image
        height: 30px
        width: 30px
`)
