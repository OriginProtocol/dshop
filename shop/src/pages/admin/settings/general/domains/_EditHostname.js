import React, { useReducer, useEffect, useState } from 'react'
import kebabCase from 'lodash/kebabCase'
import get from 'lodash/get'

import useShopConfig from 'utils/useShopConfig'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import Modal from 'components/Modal'
import { formInput, formFeedback } from 'utils/formHelpers'

function reducer(state, newState) {
  return { ...state, ...newState }
}

const EditHostname = ({ onClose }) => {
  const [{ admin }, dispatch] = useStateValue()
  const [shouldClose, setShouldClose] = useState()

  const { shopConfig } = useShopConfig()
  const { post } = useBackendApi({ authToken: true })
  const [state, setState] = useReducer(reducer, { domain: '' })
  useEffect(() => {
    if (shopConfig) {
      setState({ hostname: shopConfig.hostname })
    }
  }, [shopConfig])

  const input = formInput(state, (newState) =>
    setState({ ...newState, hasChanges: true })
  )
  const Feedback = formFeedback(state)

  async function onSave() {
    const shopConfigRes = await post('/shop/config', {
      method: 'PUT',
      body: JSON.stringify({ hostname: state.hostname }),
      suppressError: true
    })

    if (!shopConfigRes.success && shopConfigRes.field) {
      setState({ [`${shopConfigRes.field}Error`]: shopConfigRes.reason })
      return
    }

    dispatch({ type: 'reload', target: 'shopConfig' })
    dispatch({ type: 'toast', message: 'Domain updated' })
    setShouldClose(true)
  }

  return (
    <Modal onClose={onClose} shouldClose={shouldClose}>
      <div className="modal-body p-5 shop-settings">
        <div className="text-lg text-center">Modify Domain</div>
        <div className="form-group mt-4">
          <div className="suffix-wrap">
            <input
              {...input('hostname')}
              onChange={(e) =>
                setState({
                  hostname: kebabCase(e.target.value),
                  hostnameError: null
                })
              }
            />
            <div className="suffix">
              <span>{state.hostname}</span>
              {`.${get(admin, 'network.domain')}`}
            </div>
          </div>
          {Feedback('hostname')}
        </div>
        <div className="actions text-center">
          <button
            className="btn btn-outline-primary px-5 mr-2"
            onClick={() => setShouldClose(true)}
            children="Cancel"
          />
          <button
            className="btn btn-primary px-5"
            onClick={() => onSave()}
            children="Save"
          />
        </div>
      </div>
    </Modal>
  )
}

export default EditHostname
