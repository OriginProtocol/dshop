import React, { useState } from 'react'
import get from 'lodash/get'
import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'
import useBackendApi from 'utils/useBackendApi'

const initialState = {
  firstName: '',
  lastName: '',
  userEmail: '',
  subject: '',
  content: ''
}

const Contact = () => {
  const { config } = useConfig()
  const themeVars = useThemeVars()
  const { post } = useBackendApi({ shopSlug: true })
  const contactText = get(themeVars, 'contact.contactText')
  const contactEmail = get(themeVars, 'contact.email', config.supportEmail)
  const contactNumber = get(themeVars, 'contact.number')

  const [formState, setFormState] = useState({
    ...initialState
  })

  const onSubmit = async () => {
    await post('/email-seller', {
      body: JSON.stringify(formState)
    })
    setFormState({
      ...initialState
    })
  }

  return (
    <div className="container mt-12">
      <div className="flex">
        <div style={{ flex: '2' }}>
          <div className="text-4xl leading-none font-medium">Contact us</div>
          <div className="mt-12 text-sm whitespace-pre-line">{contactText}</div>
          <div className="mt-4 font-semibold">
            {!contactEmail ? null : (
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            )}
            <br />
            {!contactNumber ? null : (
              <a href={`tel:${contactNumber}`}>{contactNumber}</a>
            )}
          </div>
        </div>
        <form
          className="grid gap-y-2 ml-24"
          style={{ flex: '3' }}
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <label>First name</label>
            <label>Last name</label>
            <input
              value={formState.firstName}
              onChange={(e) => setFormState({ firstName: e.target.value })}
              className="border bg-gray-100 p-3 w-full"
            />
            <input
              value={formState.lastName}
              onChange={(e) => setFormState({ lastName: e.target.value })}
              className="border bg-gray-100 p-3 w-full"
            />
          </div>
          <label className="mt-3">Email</label>
          <input
            type="email"
            value={formState.userEmail}
            onChange={(e) => setFormState({ userEmail: e.target.value })}
            className="border bg-gray-100 p-3 w-full"
          />
          <label className="mt-3">Subject</label>
          <input
            value={formState.subject}
            onChange={(e) => setFormState({ subject: e.target.value })}
            className="border bg-gray-100 p-3 w-full"
          />
          <label className="mt-3">Message</label>
          <textarea
            value={formState.content}
            onChange={(e) => setFormState({ content: e.target.value })}
            className="border bg-gray-100 p-3 w-full h-32"
          />
          <div className="mt-6 flex justify-end">
            <button className="btn btn-primary px-16">Submit</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Contact
