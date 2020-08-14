import React from 'react'
import get from 'lodash/get'
import kebabCase from 'lodash/kebabCase'
import fbt from 'fbt'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConfirmationModal from 'components/ConfirmationModal'
import useSetState from 'utils/useSetState'
import useBackendApi from 'utils/useBackendApi'
import useConfig from 'utils/useConfig'
import useAutoFocus from 'utils/useAutoFocus'
import useRedirect from 'utils/useRedirect'
import { useStateValue } from 'data/state'

function validate(state) {
  const newState = {}

  if (state.shopType !== 'local-dir') {
    if (!state.name) {
      newState.nameError = fbt(
        'Enter a name for your shop',
        'admin.NewShop.nameError'
      )
    } else if (state.name.length < 3) {
      newState.nameError = fbt(
        'Shop name is too short',
        'admin.NewShop.nameLenError'
      )
    }
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
      confirmText={fbt('Create a shop', 'admin.NewShop.createShop')}
      confirmedText={false}
      proceedText={fbt('Create', 'Create')}
      cancelText={fbt('Cancel', 'Cancel')}
      loadingText={`${fbt('Creating Shop', 'admin.NewShop.createShop')}...`}
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
          hostname: kebabCase(state.name)
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
              <fbt desc="admin.NewShop.shopName">Shop name</fbt>
              <span className="ml-2">
                (
                <fbt desc="admin.NewShop.changableLater">
                  you can change this later
                </fbt>
                )
              </span>
            </label>
            <input
              ref={shopName}
              {...input('name')}
              placeholder={fbt('eg My Store', 'admin.NewShop.namePlaceholder')}
            />
            {Feedback('name')}
          </div>
        )}
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
