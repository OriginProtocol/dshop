import React from 'react'

import { useStateValue } from 'data/state'
import Languages from 'data/Languages'

const LocaleSelect = () => {
  const [{ locale }, dispatch] = useStateValue()

  const onChange = (e) => {
    const locale = e.target.value
    dispatch({
      type: 'setLocale',
      locale
    })
  }

  return (
    <div className="currency-select">
      <select
        className="form-control currency-select"
        value={locale}
        onChange={onChange}
      >
        {Languages.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default LocaleSelect

require('react-styl')(`
`)
