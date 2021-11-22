import React from 'react'
import get from 'lodash/get'

export const formInput = (state, setState, opts = {}) => (
  field,
  valueOnly,
  inPercent
) => {
  let className = 'form-control'
  if (opts.className) {
    className += ` ${opts.className}`
  }
  if (state[`${field}Error`]) {
    className += ' is-invalid'
  }

  let value = get(state, field, '')
  if (inPercent && value !== '') {
    value = parseFloat((value / 100).toFixed(2))
  }

  return {
    value,
    className,
    name: field,
    onChange: (e) =>
      setState({
        [field]: valueOnly
          ? e
          : inPercent
          ? e.target.value * 100 //optimization: convert value to a 'fixed point' number before setting state. Ex: 10.32% => 1032
          : e.target.value,
        [`${field}Error`]: false
      })
  }
}

export const formFeedback = (state) =>
  function InvalidFeedback(field) {
    return state[`${field}Error`] ? (
      <div className="invalid-feedback" style={{ display: 'block' }}>
        {state[`${field}Error`]}
      </div>
    ) : null
  }
