import React, { useEffect, useState } from 'react'
import fbt from 'fbt'
import { get, pick, pickBy } from 'lodash'


import CKEditor from 'ckeditor4-react'

import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import { formFeedback } from 'utils/formHelpers'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import AdminConfirmationModal from 'components/ConfirmationModal'
import PlusIcon from 'components/icons/Plus'

//  const ABOUT_FILENAME = 'about.html'

const LegalSettings = () => {
  const [{ admin }, dispatch] = useStateValue()
  const { postRaw, post } = useBackendApi({ authToken: true })
  const [saving, setSaving] = useState(false)

  // To do: enforce limit on the length of policy title

  // policies is of type <Array<Array<String, String, boolean>>. The two strings represent the Policy title and contents respectively,
  // while the boolean is used to indicate whether there is an error associated with the policy 
  // E.g.:
  // [
  //   ['Terms and Conditions', 'Eget egestas purus viverra accumsan in nisl nisi scelerisque.', false],
  //   ['Privacy Policy', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', false ],
  //   ['Return Policy', 'Eget egestas purus viverra accumsan.', false]
  // ]
  
  const [policies, setPolicies] = useState([
    ['Terms and Conditions', 'Eget egestas purus viverra accumsan in nisl nisi scelerisque. Nibh praesent tristique magna sit amet purus gravida quis. In nibh mauris cursus mattis molestie. Eget dolor morbi non arcu risus quis. Quam id leo in vitae turpis massa sed elementum. Lectus sit amet est placerat in egestas. Aliquam eleifend mi in nulla posuere sollicitudin aliquam ultrices. Feugiat nibh sed pulvinar proin. Semper quis lectus nulla at volutpat diam. Mattis vulputate enim nulla aliquet. Gravida in fermentum et sollicitudin ac orci phasellus egestas.'],
    ['Privacy Policy', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae sapien pellentesque habitant morbi tristique. Et netus et malesuada fames ac turpis. Vitae sapien pellentesque habitant morbi tristique senectus et netus. Ultrices tincidunt arcu non sodales neque. Orci phasellus egestas tellus rutrum tellus pellentesque eu. Vivamus arcu felis bibendum ut tristique et egestas quis ipsum. In egestas erat imperdiet sed euismod nisi porta lorem mollis. Lectus mauris ultrices eros in cursus turpis massa. Vulputate eu scelerisque felis imperdiet proin. Blandit turpis cursus in hac habitasse platea dictumst quisque.'],
    ['Return Policy', 'Eget egestas purus viverra accumsan in nisl nisi scelerisque. Nibh praesent tristique magna sit amet purus gravida quis. In nibh mauris cursus mattis molestie. Eget dolor morbi non arcu risus quis. Quam id leo in vitae turpis massa sed elementum. Lectus sit amet est placerat in egestas. Aliquam eleifend mi in nulla posuere sollicitudin aliquam ultrices. Feugiat nibh sed pulvinar proin. Semper quis lectus nulla at volutpat diam. Mattis vulputate enim nulla aliquet. Gravida in fermentum et sollicitudin ac orci phasellus egestas.']])
  
  // useEffect(() => {
  //   let timeout
  //   if (config.about) {
  //     fetch(`${config.dataSrc}${config.about}`)
  //       .then((res) => {
  //         if (!res.ok) throw new Error('Failed to fetch')
  //         return res.text()
  //       })
  //       // NOTE: CKEditor takes a few seconds to load
  //       .then((body) => (timeout = setTimeout(() => setAboutText(body), 2000)))
  //       .catch((err) => {
  //         console.error('Failed to load about page', err)
  //       })
  //   }

  //   return () => clearTimeout(timeout)
  // }, [config && config.about])

  const actions = (
    <div className="actions">
      <AdminConfirmationModal
        customEl={
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={saving}
          >
            <fbt desc="Cancel">Cancel</fbt>
          </button>
        }
        confirmText={fbt(
          'Unsaved changes will be lost. Continue?',
          'areYouSure'
        )}
        onConfirm={() => {
          window.location.reload()
          return
        }}
      />
      <button
        type="submit"
        className="btn btn-primary"
        disabled={saving}
        children={
          saving ? (
            <fbt desc="Updating">Updating</fbt>
          ) : (
            <fbt desc="Update">Update</fbt>
          )
        }
      />
    </div>
  )

  // Seperating out a component for CKEditor that has 'default' options set on the toolbar. To customize CKEditor's toolbar, see https://ckeditor.com/docs/ckeditor4/latest/features/toolbar.html
  const Editor = ({ data, onChange }) => {
    return (
      <CKEditor
        data={data}
        config={{
          toolbar: [
            {
              name: 'clipboard',
              items: ['Cut', 'Copy', 'Paste', 'PasteText', '-', 'Undo', 'Redo']
            },
            { name: 'editing', items: ['Find', 'Replace', 'Scayt'] },
            { name: 'forms', items: ['Button', 'ImageButton'] },
            '/',
            {
              name: 'basicstyles',
              items: [
                'Bold',
                'Italic',
                'Underline',
                'Strike',
                'Subscript',
                'Superscript',
                '-',
                'CopyFormatting',
                'RemoveFormat'
              ]
            },
            {
              name: 'paragraph',
              items: [
                'NumberedList',
                'BulletedList',
                '-',
                'Outdent',
                'Indent',
                '-',
                'Blockquote',
                'CreateDiv',
                '-',
                'JustifyLeft',
                'JustifyCenter',
                'JustifyRight',
                'JustifyBlock',
                '-',
                'Language'
              ]
            },
            { name: 'links', items: ['Link', 'Unlink'] },
            {
              name: 'insert',
              items: [
                'Image',
                'Table',
                'HorizontalRule',
                'Smiley',
                'SpecialChar'
              ]
            },
            '/',
            {
              name: 'styles',
              items: ['Styles', 'Format', 'Font', 'FontSize']
            },
            { name: 'colors', items: ['TextColor', 'BGColor'] },
            { name: 'tools', items: ['Maximize'] }
          ]
        }}
        onChange={onChange}
      />
    )
  }

  return (
    <form
      autoComplete="off"
      onSubmit={async (e) => {
        e.preventDefault()

        if (saving) return

        setSaving(true)

        try {
          const shopPolicies = pickBy(state, (v, k) => !k.endsWith('Error'))

          // Shop policy pages object
          shopPolicies.pages = policies

          // const shopPoliciesRes = //tbd await post('tbd', {
          //   method: 'PUT',
          //   body: JSON.stringify(shopPolicies),
          //   suppressError: true
          // })

          if (!shopPolicies.success && shopPolicies.field) {
            //setState({ [`${shopPolicies.field}Error`]: shopConfigRes.reason })
            setSaving(false)
            return
          }
          setSaving(false)
          dispatch({
            type: 'toast',
            message: (
              <fbt desc="admin.settings.appearance.savedMessage">
                Settings saved
              </fbt>
            )
          })
        } catch (err) {
          console.error(err)
          setSaving(false)
        }
      }}
    >
      <h3 className="admin-title with-border">
        <Link to="/admin/settings" className="muted">
          <fbt desc="Settings">Settings</fbt>
        </Link>
        <span className="chevron" />
        <fbt desc="Legal">Legal</fbt>
        {actions}
      </h3>
      <div className="form-group">
        <label>
          <fbt desc="admin.settings.legal">
            Add policy-related pages to your store
          </fbt>
          <span>
            (
            <fbt desc="admin.settings.appearance.legalSettingsDesc">
              links will appear on the footer of your website
            </fbt>
            )
          </span>
        </label>
        {policies.map((policy, index) => {
          return (<>
              <div className="form-group">
                <label>
                  <fbt desc="admin.settings.legal.title">Title</fbt>
                </label>
                <div>
                  <input
                    className={`form-control ${policy[2] ? 'is-invalid' : ''}`}
                    placeholder={
                      index === 0
                        ? 'e.g. "Terms and Conditions"'
                        : index === 1
                        ? 'e.g. "Privacy Policy"'
                        : ''
                    }
                    value={get(policy, 0)}
                    onChange={(e) => {
                      setPolicies((policies) => {
                        const updatedPolicyTitle = e.target.value
                        policies[index].splice(0, 1, updatedPolicyTitle)
                        return policies
                      })
                    }}
                  />
                </div>
                <Editor
                  data={policy[1]}
                  onChange={(e) => {
                    setPolicies((policies) => {
                      const updatedPolicyText = e.editor.getData()
                      policies[index].splice(1, 1, updatedPolicyText)
                      return policies
                    })
                  }}
                />
              </div>
            </>
          )
        })}
        <button
        type="button"
        onClick={() => setPolicies([...policies, ['', '']])}
        className="btn btn-outline-primary mt-4"
      >
        <PlusIcon size="9" />
        <span className="ml-2">Add page</span>
      </button>
      </div>

      <div className="footer-actions">{actions}</div>
    </form>
  )
}

export default LegalSettings
