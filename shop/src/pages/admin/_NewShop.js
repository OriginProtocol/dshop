import React from 'react'
import get from 'lodash/get'
import kebabCase from 'lodash/kebabCase'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConfirmationModal from 'components/ConfirmationModal'
import useSetState from 'utils/useSetState'
import useBackendApi from 'utils/useBackendApi'
import useConfig from 'utils/useConfig'
import useAutoFocus from 'utils/useAutoFocus'
import useRedirect from 'utils/useRedirect'
import { useStateValue } from 'data/state'

const emailRegex = /^[a-z0-9-._+]+@[a-z0-9-]+(\.[a-z]+)*(\.[a-z]{2,})$/i

function validate(state) {
  const newState = {}

  if (state.shopType !== 'local-dir') {
    if (!state.name) {
      newState.nameError = 'Enter a name for your shop'
    } else if (state.name.length < 3) {
      newState.nameError = 'Shop name is too short'
    }
  }

  if (!state.supportEmail) {
    newState.supportEmailError = 'Support Email is required'
  } else if (!emailRegex.test(state.supportEmail)) {
    newState.supportEmailError = 'Invalid email address'
  }

  if (!state.storeEmail) {
    newState.storeEmailError = 'Store Email is required'
  } else if (!emailRegex.test(state.storeEmail)) {
    newState.storeEmailError = 'Invalid email address'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const defaultState = { title: '', shopType: 'empty' }

const AdminNewShop = ({ shouldShow, onClose = () => {} }) => {
  const shopName = useAutoFocus()
  const redirectTo = useRedirect()
  const [{ admin }, dispatch] = useStateValue()
  const { setActiveShop } = useConfig()
  const [state, setState] = useSetState(defaultState)
  const { post } = useBackendApi({ authToken: true })
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const localShops = get(admin, 'localShops', [])

  return (
    <ConfirmationModal
      confirmText="Create a shop"
      confirmedText={false}
      proceedText="Create"
      cancelText="Cancel"
      loadingText="Creating Shop..."
      modalOnly={true}
      shouldShow={shouldShow}
      onClose={() => {
        setState(defaultState, true)
        onClose()
      }}
      onConfirm={() => {
        const data = {
          shopType: state.shopType,
          name: state.name,
          dataDir: kebabCase(state.name),
          hostname: kebabCase(state.name),
          supportEmail: state.supportEmail,
          storeEmail: state.storeEmail
        }
        if (state.shopType === 'local-dir') {
          data.hostname = data.dataDir = state.dataDir || localShops[0]
        }
        return post('/shop', {
          method: 'POST',
          suppressError: true,
          body: JSON.stringify(data)
        })
      }}
      onError={(json) => {
        console.log(json)
        setState({ nameError: json.message })
      }}
      validate={() => {
        const { valid, newState } = validate(state)
        setState(newState)
        return valid
      }}
      onSuccess={(json) => {
        setState({}, true)
        setActiveShop(json.slug)
        dispatch({ type: 'reload', target: 'auth' })
        redirectTo('/admin/onboarding')
      }}
    >
      <div className="new-shop-modal text-left pt-3">
        {state.shopType === 'local-dir' ? null : (
          <div className="form-group">
            <label>
              Shop name<span className="ml-2">(you can change this later)</span>
            </label>
            <input
              ref={shopName}
              {...input('name')}
              placeholder="eg My Store"
            />
            {Feedback('name')}
          </div>
        )}
        <div className="form-group">
          <label>Store contact email</label>
          <input {...input('storeEmail')} />
          {Feedback('storeEmail')}
          <div className="desc">
            We&apos;ll use this address if we need to contact you about your
            store.
          </div>
        </div>
        <div className="form-group">
          <label>Customer email</label>
          <input {...input('supportEmail')} />
          {Feedback('supportEmail')}
          <div className="desc">
            Your customers will see this address when receiving emails about
            their order.
          </div>
        </div>
        {!get(admin, 'superuser') ? null : (
          <div className="form-row">
            <div className="form-group col-md-6">
              <label>Shop type</label>
              <select {...input('shopType')}>
                {/* <option value="multi-product">New Multi Product</option> */}
                {/* <option value="single-product">New Single Product</option> */}
                <option value="empty">No Template</option>
                {localShops.length ? (
                  <option value="local-dir">From Cache</option>
                ) : null}
                {/* <option value="clone-url">Clone URL</option> */}
                {/* <option value="clone-ipfs">Clone IPFS Hash</option> */}
                {/* <option value="printful">New Printful</option> */}
                {/* <option value="affiliate">New Affiliate</option> */}
              </select>
            </div>
            {state.shopType === 'local-dir' ? (
              <div className="form-group col-md-6">
                <label>Data dir</label>
                <select {...input('dataDir')}>
                  {localShops.map((localShop) => (
                    <option key={localShop}>{localShop}</option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </ConfirmationModal>
  )
}

export default AdminNewShop

require('react-styl')(`
  .new-shop-modal
    label span
      color: #8293a4
      font-size: 0.875rem
      font-weight: normal

`)
