import React from 'react'
import get from 'lodash/get'
import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'

const Contact = () => {
  const { config } = useConfig()
  const themeVars = useThemeVars()
  const contactText = get(themeVars, 'contact.contactText')
  const contactEmail = get(themeVars, 'contact.email', config.supportEmail)
  const contactNumber = get(themeVars, 'contact.number')

  return (
    <div className="container mt-12">
      <div className="flex">
        <div style={{ flex: '2' }}>
          <div className="text-4xl leading-none font-medium">Contact us</div>
          <div className="mt-12 text-sm whitespace-pre">{contactText}</div>
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
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <label>First name</label>
            <label>Last name</label>
            <input className="border bg-gray-100 p-3 w-full" />
            <input className="border bg-gray-100 p-3 w-full" />
          </div>
          <label className="mt-3">Email</label>
          <input className="border bg-gray-100 p-3 w-full" />
          <label className="mt-3">Subject</label>
          <input className="border bg-gray-100 p-3 w-full" />
          <label className="mt-3">Message</label>
          <textarea className="border bg-gray-100 p-3 w-full h-32" />
          <div className="mt-6 flex justify-end">
            <button className="btn btn-primary px-16">Submit</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Contact
