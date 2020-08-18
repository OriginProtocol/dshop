import React from 'react'
import fbt from 'fbt'
import useConfig from 'utils/useConfig'
import { formInput, formFeedback } from 'utils/formHelpers'
import formatPrice from 'utils/formatPrice'
import shippingTimes from 'utils/shippingTimes'

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
          {hideLabel ? null : (
            <label>
              <fbt desc="admin.settings.shipping.rateName">Rate name</fbt>
            </label>
          )}
          <select {...input('type')}>
            <option>
              <fbt desc="SelectOne">Select one</fbt>
            </option>
            {shippingTimes.map((t) => (
              <option key={t.value} value={t.value}>
                {`${t.label}${
                  !t.processingTime ? '' : ` (${t.processingTime})`
                }`}
              </option>
            ))}
          </select>
          {Feedback('type')}
        </div>
      </div>
      {rateInfo.type === 'free' ? null : (
        <div className="col-md-5">
          <div className="form-group">
            {hideLabel ? null : (
              <label>
                <fbt desc="Price">Price</fbt>
              </label>
            )}
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
            hideLabel ? '' : ' mt-30px'
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
    align-items: flex-start
    padding-left: 0
    img
      cursor: pointer

  .mt-30px
    margin-top: 30px !important
`)
