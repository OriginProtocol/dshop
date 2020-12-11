import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import fbt from 'fbt'

import useBackendApi from 'utils/useBackendApi'
import useConfig from 'utils/useConfig'
import useActiveTheme from 'utils/useActiveTheme'
import { useStateValue } from 'data/state'

import SectionsList from './_Section'
import Link from 'components/Link'

const EditFields = () => {
  const [{ config }, dispatch] = useStateValue()

  const { setActiveShop } = useConfig()
  const history = useHistory()
  const [channel, setChannel] = useState()
  const [changes, setChanges] = useState({})
  const [hasChanges, setHasChanges] = useState(false)
  const [activeSection, setActiveSection] = useState(false)

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
    if (!activeThemeId) return

    const bc = new BroadcastChannel(`${activeThemeId}_preview_channel`)
    setChannel(bc)

    return () => {
      bc.close()
    }
  }, [activeThemeId])

  useEffect(() => {
    if (!channel) return

    let closed = false

    channel.onmessage = (event) => {
      if (get(event, 'data.type') !== 'DATA_REQUEST') {
        return
      }

      // Post saved changes, if any, to the channel
      const newChanges = {
        ...get(config.theme, activeThemeId),
        ...changes
      }

      if (closed) return

      broadcastChanges(newChanges, true)
    }

    return () => {
      closed = true
    }
  }, [channel, activeThemeId, changes])

  const postToChannel = (payload) => {
    if (!channel) return
    try {
      channel.postMessage(payload)
    } catch (err) {
      // Failed to post to iframe
      console.warn('Failed to push to iframe', err)
    }
  }

  const broadcastChanges = (updates, overrideNoChange) => {
    const newChanges = {
      ...changes,
      ...updates
    }

    setChanges(newChanges)

    if (!overrideNoChange) {
      setHasChanges(true)
    }

    postToChannel({
      type: 'DATA_UPDATE',
      changes: newChanges
    })
  }

  const onSave = async () => {
    const themeData = {
      ...config.theme,
      [activeThemeId]: {
        ...get(config.theme, activeThemeId),
        ...changes
      }
    }

    await post('/shop/config', {
      method: 'PUT',
      body: JSON.stringify({
        theme: themeData
      })
    })

    setHasChanges(false)

    dispatch({
      type: 'setConfigSimple',
      config: {
        ...config,
        theme: themeData
      }
    })

    dispatch({ type: 'reload', target: 'shopConfig' })

    dispatch({
      type: 'toast',
      message: (
        <fbt desc="admin.themes.settingsSaved">
          Your changes have been saved
        </fbt>
      )
    })
  }

  const onCancel = () => {
    if (hasChanges) {
      const newChanges = {
        ...get(config.theme, activeThemeId)
      }

      setChanges(newChanges)
      setHasChanges(false)

      postToChannel({
        type: 'DATA_UPDATE',
        changes: newChanges
      })
    } else if (activeSection) {
      setActiveSection(null)
    }
  }

  const onDrilldown = (section) => {
    setActiveSection(section.id)

    postToChannel({
      type: 'SECTION_CHANGED',
      section
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
        {hasChanges ? (
          <>
            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={onCancel}
            >
              <fbt desc="Cancel">Cancel</fbt>
            </button>
            <button className="btn btn-primary" type="button" onClick={onSave}>
              <fbt desc="Save">Save</fbt>
            </button>
          </>
        ) : activeSection ? (
          <button
            className="btn btn-link px-0"
            type="button"
            onClick={onCancel}
          >
            <fbt desc="admin.themes.backToMenu">Back to menu</fbt>
          </button>
        ) : (
          <Link to="/admin/themes" className="btn btn-link px-0">
            <fbt desc="admin.themes.backToThemes">Back to Themes</fbt>
          </Link>
        )}
      </div>

      <div className="fields-container">
        {!activeTheme ? (
          <div>
            <fbt desc="Loading">Loading</fbt>...
          </div>
        ) : (
          <SectionsList
            theme={activeTheme}
            state={changes}
            onChange={broadcastChanges}
            onDrilldown={onDrilldown}
            activeSection={activeSection}
          />
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
      .btn.btn-link
        text-align: left
        &:before
          content: ""
          display: inline-block
          width: 10px
          height: 10px
          border-width: 0 2px 2px 0
          border-style: solid
          border-color: #3b80ee
          transform: rotate(-225deg)
          margin-right: .5rem

    .fields-container
      margin: 0 1.25rem
      flex: 1
      overflow: auto

`)
