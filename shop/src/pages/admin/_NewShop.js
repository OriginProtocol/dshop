import React from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import kebabCase from 'lodash/kebabCase'

import { formInput, formFeedback } from 'utils/formHelpers'
import ConfirmationModal from 'components/ConfirmationModal'
import useSetState from 'utils/useSetState'
import useBackendApi from 'utils/useBackendApi'
import useConfig from 'utils/useConfig'
import useAutoFocus from 'utils/useAutoFocus'
import { useStateValue } from 'data/state'

function validate(state) {
  const newState = {}

  if (state.shopType !== 'local-dir') {
    if (!state.name) {
      newState.nameError = 'Enter a title'
    } else if (state.name.length < 3) {
      newState.nameError = 'Title is too short'
    }
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const defaultState = { title: '', shopType: 'empty' }

const AdminNewShop = ({ shouldShow, onClose = () => {} }) => {
  const shopName = useAutoFocus()
  const history = useHistory()
  const [{ admin, config }, dispatch] = useStateValue()
  const { setActiveShop } = useConfig()
  const [state, setState] = useSetState(defaultState)
  const { post } = useBackendApi({ authToken: true })
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const localShops = get(admin, 'localShops', [])

  return (
    <ConfirmationModal
      confirmText="Add a new shop"
      confirmedText={false}
      proceedText="Add"
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
          backend: config.backend || get(window, 'location.origin'),
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
        history.push({
          pathname: '/admin/onboarding',
          state: { scrollToTop: true }
        })
      }}
    >
      <div className="text-left pt-3">
        {state.shopType === 'local-dir' ? null : (
          <div className="form-group">
            <label>Shop name</label>
            <input ref={shopName} {...input('name')} />
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
