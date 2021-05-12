import React from 'react'
import fbt from 'fbt'
import { formInput, formFeedback } from 'utils/formHelpers'

import TokenComponent from './_TokenComponent'

/**
 * @param (prop) formState: Object
 * @param (prop) setFormState: async function(Object) => undefined [a function which accepts an Object as an argument; suggested use: set the form's state]
 * @param (prop) label: undefined
 * @param (prop) onRemove: function() => undefined [can be used to render the removal of the component]
 * @param (prop) placeholder: string [optional; can be used to display placeholder text]
 * @param (prop) disabled: boolean [used to disable the component's input]
 */
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
            elements={formState.individualOpts || []}
            onChangeTokenComponent={(newElements) =>
              setFormState({ individualOpts: newElements })
            }
            disabled={disabled}
          />

          {formState.optionsError && !formState.individualOpts.length
            ? Feedback('options')
            : null}
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
