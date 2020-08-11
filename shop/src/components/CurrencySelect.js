import React from 'react'

import { useStateValue } from 'data/state'
import { AllCurrencies } from 'data/Currencies'

const CurrencySelect = () => {
  const [{ preferredCurrency }, dispatch] = useStateValue()

  const onChange = (e) => {
    const currency = e.target.value
    dispatch({
      type: 'setPreferredCurrency',
      currency
    })
  }

  return (
    <select
      className="form-control"
      value={preferredCurrency}
      onChange={onChange}
    >
      {AllCurrencies.map((currency) => (
        <option key={currency[0]} value={currency[0]}>
          {currency[0]}
        </option>
      ))}
    </select>
  )
}

export default CurrencySelect
