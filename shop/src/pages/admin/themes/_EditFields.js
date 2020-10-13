import React, { useEffect, useReducer, useState } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import pick from 'lodash/pick'
import fbt from 'fbt'

import useBackendApi from 'utils/useBackendApi'
import useConfig from 'utils/useConfig'
import useActiveTheme from 'utils/useActiveTheme'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import SectionsList from './_Section'

const EditFields = ({ shouldBroadcastChanges }) => {
  const [{ admin, config }, dispatch] = useStateValue()

  const { setActiveShop } = useConfig()
  const history = useHistory()
  const [channel, setChannel] = useState()
  const [changes, setChanges] = useState()

  const { post } = useBackendApi({ authToken: true })

  const { activeTheme, activeThemeId } = useActiveTheme()

  useEffect(() => {
    // Disable scroll on body
    document.body.style.overflow = 'hidden'
    return () => (document.body.style.overflow = 'auto')
  }, [])

  useEffect(() => {
    // Create a broadcast channel to connect and
    // interact with the iframe
    const bc = new BroadcastChannel(`${activeThemeId}_preview_channel`)
    setChannel(bc)
    return () => bc.close()
  }, [activeThemeId])

  // useEffect(() => {
  //   if (shouldBroadcastChanges) {
  //     setTimeout(() => {
  //       broadcastChanges(get(config.theme, activeThemeId))
  //     }, 3000)
  //   }
  // }, [shouldBroadcastChanges])

  const broadcastChanges = (themeConfig) => {
    dispatch({
      type: 'setConfigSimple',
      config: {
        ...config,
        theme: {
          ...config.theme,
          [activeThemeId]: themeConfig
        }
      }
    })

    if (!channel) return
    try {
      channel.postMessage(themeConfig)
    } catch (err) {
      // Failed to post to iframe
      console.warn('Failed to push to iframe', err)
    }
  }

  const onSave = async () => {
    await post('/shop/config', {
      method: 'PUT',
      body: JSON.stringify({
        theme: {
          ...config.theme
        }
      })
    })

    dispatch({
      type: 'toast',
      message: (
        <fbt desc="admin.themes.settingsSaved">
          Your changes have been saved
        </fbt>
      )
    })
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
        <Link to="/admin/themes" className="btn btn-outline-primary">
          Cancel
        </Link>
        <button className="btn btn-primary" type="button" onClick={onSave}>
          Save
        </button>
      </div>

      <div className="fields-container">
        {!activeTheme ? (
          <div>
            <fbt desc="Loading">Loading</fbt>...
          </div>
        ) : (
          <SectionsList theme={activeTheme} onChange={broadcastChanges} />
        )}
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
