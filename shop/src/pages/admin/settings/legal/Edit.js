import React, { useState, useEffect } from 'react'
import fbt from 'fbt'
import { get } from 'lodash'
import CKEditor from 'ckeditor4-react'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import Link from 'components/Link'
import AdminConfirmationModal from 'components/ConfirmationModal'
import PlusIcon from 'components/icons/Plus'

const LegalSettings = () => {
  const [{ config }, dispatch] = useStateValue()
  const { post } = useBackendApi({ authToken: true })
  const [saving, setSaving] = useState(false)

  // policies is of type <Array<Array<String, String, boolean>>. The two strings represent the Policy title and contents respectively,
  // while the boolean is used to indicate whether there is an error associated with the policy
  // E.g.:
  // [
  //   ['Terms and Conditions', 'Eget egestas purus viverra accumsan in nisl nisi scelerisque.', false],
  //   ['Privacy Policy', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', false ],
  //   ['Return Policy', 'Eget egestas purus viverra accumsan.', false]
  // ]
  const [policies, setPolicies] = useState([['', '', false]])

  useEffect(() => {
    let timeout
    fetch(`shop/policies`, {
      method: 'GET',
      headers: {
        authorization: `bearer ${encodeURIComponent(config.backendAuthToken)}`
      }
    })
      // NOTE: CKEditor takes a few seconds to load
      .then((res) => {
        if (!res.ok) {
          return null
        } else {
          return res.json() //Expected type: <Array<Array<String, String, boolean>>>
        }
      })
      .then((result) => {
        if (result) {
          timeout = setTimeout(() => setPolicies(result), 2000)
        }
      })
      .catch((err) => {
        console.error('Failed to load shop policies', err)
      })
    return () => clearTimeout(timeout)
  }, [window.onload])

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
          // Make sure that the request body is either a JS Object or Array. Failure to do
          // so will produce a SyntaxError when the body is parsed by Express' body-parser
          // module (i.e. backend). Discussion: https://github.com/expressjs/body-parser/issues/309
          await post('/shop/policies', {
            body: JSON.stringify({
              allPolicies: policies
            })
          })

          setSaving(false)
          dispatch({
            type: 'toast',
            message: (
              <fbt desc="admin.settings.policies.savedMessage">
                Settings saved
              </fbt>
            )
          })
        } catch (err) {
          dispatch({
            type: 'toast',
            message: (
              <fbt desc="admin.settings.policies.postError">
                Error posting shop&apos;s policies. Check console for details
              </fbt>
            ),
            style: 'error'
          })
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
          return (
            <>
              <br />
              <div className="form-group">
                <div>
                  <label>
                    <fbt desc="admin.settings.legal.title">Title: </fbt>
                    <input
                      className={`form-control ${
                        policy[2] ? 'is-invalid' : ''
                      }`}
                      type="text"
                      required
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
                          //console.log(policies)
                          return [...policies]
                        })
                      }}
                    />
                  </label>
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
                <div>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => {
                      setPolicies((policies) => {
                        policies.splice(index, 1)
                        return [...policies]
                      })
                    }}
                  >
                    <fbt desc="admin.settings.legal.removePolicyButton">
                      Remove
                    </fbt>
                  </button>
                </div>
              </div>
            </>
          )
        })}
        <div>
          <button
            type="button"
            onClick={() => setPolicies([...policies, ['', '', false]])}
            className="btn btn-outline-primary mt-4"
            s
          >
            <PlusIcon size="9" />
            <span className="ml-2">Add page</span>
          </button>
        </div>
      </div>

      <div className="footer-actions">{actions}</div>
    </form>
  )
}

export default LegalSettings

require('react-styl')(`

`)
