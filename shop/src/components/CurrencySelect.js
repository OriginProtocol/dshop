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
    <div className="currency-select">
      <select
        className="form-control currency-select"
        value={preferredCurrency}
        onChange={onChange}
      >
        {AllCurrencies.map((currency) => (
          <option key={currency[0]} value={currency[0]}>
            {currency[0]}
          </option>
        ))}
      </select>
    </div>
  )
}

export default CurrencySelect

require('react-styl')(`
  .currency-select
    position: relative
    select
      cursor: pointer
      border-radius: 30px
      border: 1px solid #c2cbd3
      background-color: var(--white)
      -webkit-appearance: none
      padding: 0 1.125rem 0 0.75rem
      font-size: 0.875rem
      height: 1.75rem
      line-height: 1.5rem
    &:after
      content: ""
      position: absolute
      display: inline-block
      width: 5px
      background-image: url(images/caret-dark.svg)
      background-repeat: no-repeat
      background-position: 100%
      background-size: 5px
      top: 0
      bottom: 0
      right: 12px
      pointer-events: none
      transform: rotate(90deg)
`)
