import React from 'react'
import fbt from 'fbt'
import { formInput, formFeedback } from 'utils/formHelpers'
// import useSetState from 'utils/useSetState'

import TokenComponent from './_TokenComponent'

const EditOptions = ({
  formState,
  setFormState,
  label,
  onRemove,
  placeholder,
  disabled
}) => {
  const input = formInput(formState, (newState) => setFormState(newState))
  const Feedback = formFeedback(formState)

  return (
    <div className="edit-product-option row">
      <div className="col-md-4">
        <label>
          {label}
          {placeholder && (
            <span className="ml-2">
              {placeholder ? `(${placeholder})` : ''}
            </span>
          )}
        </label>
        <input
          type="text"
          {...input('title')}
          placeholder={placeholder}
          disabled={disabled}
        />
        {Feedback('title')}
      </div>
      <div className="col-md-8">
        <div className="d-flex">
          {disabled ? (
            <label>&nbsp;</label>
          ) : (
            <button
              type="button"
              className="remove-link btn btn-link ml-auto"
              onClick={onRemove}
              children={fbt('Remove', 'Remove')}
            />
          )}
        </div>
        <div>
          <TokenComponent
            options={formState.options || []}
            onChangeTokenComponent={(options) => setFormState({ options })}
            disabled={disabled}
          />
          {Feedback('options')}
        </div>
      </div>
    </div>
  )
}

export default EditOptions

require('react-styl')(`
  .edit-product-option
    margin-bottom: 1rem
    .remove-link
      font-size: 0.8rem
      padding: 0
      margin-bottom: 0.625rem
`)
