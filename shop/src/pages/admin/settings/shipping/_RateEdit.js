import React from 'react'

import useConfig from 'utils/useConfig'
import { formInput, formFeedback } from 'utils/formHelpers'
import formatPrice from 'utils/formatPrice'

const shippingTimes = [
  {
    value: 'free',
    label: 'Free'
  },
  {
    value: 'expedited',
    label: 'Expedited (1 day)'
  },
  {
    value: 'fast',
    label: 'Fast (2-7 days)'
  },
  {
    value: 'slow',
    label: 'Slow (7+ days)'
  }
]

const RateEdit = ({ rateInfo, onChange, hideLabel, onDelete, showDelete }) => {
  const { config } = useConfig()

  const input = formInput(rateInfo, (newState) =>
    onChange({ ...rateInfo, ...newState })
  )
  const Feedback = formFeedback(rateInfo)

  return (
    <div className="rate-row row">
      <div className="col-md-5">
        <div className="form-group">
          {hideLabel ? null : <label>Rate name</label>}
          <select {...input('processingTime')}>
            <option>Select one</option>
            {shippingTimes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {rateInfo.processingTime === 'free' ? null : (
        <div className="col-md-5">
          <div className="form-group">
            {hideLabel ? null : <label>Price</label>}
            <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text">
                  {formatPrice(0, {
                    symbolOnly: true,
                    currency: config.currency
                  })}
                </span>
              </div>
              <input {...input('amount')} />
            </div>
            {Feedback('amount')}
          </div>
        </div>
      )}
      {!showDelete ? null : (
        <div
          className={`col-md-1 rate-edit-delete-icon${
            hideLabel ? '' : ' mt-4'
          }`}
        >
          <button className="btn px-0" type="button" onClick={onDelete}>
            <img src="images/delete-icon.svg" />
          </button>
        </div>
      )}
    </div>
  )
}

export default RateEdit

require('react-styl')(`
  .rate-edit-delete-icon
    display: flex
    align-items: center
    padding-left: 0
    img 
      cursor: pointer
`)
