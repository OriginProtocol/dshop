import React, { useEffect, useReducer, useState } from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import { useHistory } from 'react-router-dom'

import Link from 'components/Link'

const reducer = (state, newState) => ({ ...state, ...newState })

const EditFields = () => {
  const [{ admin, config }, dispatch] = useStateValue()

  const { setActiveShop } = useConfig()
  const history = useHistory()
  const [channel, setChannel] = useState()

  const [state, setState] = useReducer(reducer, {
    themeConfig: '{}'
  })

  const themeId = get(config, 'themeId')

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => (document.body.style.overflow = 'auto')
  }, [])

  useEffect(() => {
    const bc = new BroadcastChannel(`${themeId}_preview_channel`)

    setChannel(bc)

    return () => bc.close()
  }, [themeId])

  const broadcastChanges = (themeConfig) => {
    if (channel) {
      channel.postMessage(themeConfig)
    }
  }
  
  const onSave = () => {
    broadcastChanges(JSON.parse(state.themeConfig))
  }

  return (
    <>
      <div className="customize-nav">
        <img
          className="dshop-logo"
          src="images/dshop-logo-blue.svg"
          onClick={() => {
            setActiveShop()
            history.push('/admin')
          }}
        />
      </div>
      <div className="fields-actions">
        <Link to="/admin/themes" className="btn btn-outline-primary">Cancel</Link>
        <button className="btn btn-primary" type="button" onClick={onSave}>
          Save
        </button>
      </div>

      <div className="fields-container">
        <textarea 
          value={state.themeConfig}
          onChange={e => {
            setState({
              themeConfig: e.target.value
            })
          }}
        />
      </div>
    </>
  )
}

export default EditFields

require('react-styl')(`
  .customize-theme
    .dshop-logo
      cursor: pointer
      padding: 0 1.125rem
    .fields-actions
      display: flex
      flex: auto 0 0
      margin: 0 1.25rem 1rem 1.25rem
      padding-bottom: 1rem
      border-bottom: 1px solid #cdd7e0
      .btn
        flex: 1
        margin: 0 0.3125rem

    .fields-container
      margin: 0 1.25rem
      flex: 1
      overflow: auto

`)
