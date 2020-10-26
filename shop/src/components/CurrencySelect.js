import React from 'react'

import { useStateValue } from 'data/state'
import { AllCurrencies } from 'data/Currencies'

const CurrencySelect = ({ className }) => {
  const [{ preferredCurrency }, dispatch] = useStateValue()

  const onChange = (e) => {
    dispatch({ type: 'setPreferredCurrency', currency: e.target.value })
  }

  return (
    <select className={className} value={preferredCurrency} onChange={onChange}>
      {AllCurrencies.map((currency) => (
        <option key={currency[0]} value={currency[0]}>
          {`${currency[0]}${currency[3] ? ` ${currency[3]}` : ''}`}
        </option>
      ))}
    </select>
  )
}

export default CurrencySelect
