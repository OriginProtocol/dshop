import React, { useState } from 'react'
import CreatableSelect from 'react-select/creatable'
import fbt from 'fbt'

import { formInput, formFeedback } from 'utils/formHelpers'

const TokenComponent = ({ options, onChange, disabled }) => {
  const [inputValue, setInputValue] = useState('')

  return (
    <CreatableSelect
      components={{ DropdownIndicator: null }}
      inputValue={inputValue}
      isMulti
      isDisabled={disabled}
      menuIsOpen={false}
      onChange={(value) => onChange(value ? value.map((v) => v.value) : [])}
      onInputChange={(inputValue) => setInputValue(inputValue)}
      onKeyDown={(event) => {
        if (!inputValue) return
        switch (event.key) {
          case 'Enter':
          case 'Tab':
          case ',':
            setInputValue('')
            onChange([...options, inputValue])
            event.preventDefault()
        }
      }}
      placeholder={fbt(
        'Separate options with a comma',
        'admin.products.optionValuesPlaceholder'
      )}
      value={options.map((label) => ({ label, value: label }))}
    />
  )
}

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
            onChange={(options) => setFormState({ options })}
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
