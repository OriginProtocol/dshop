import React, { useRef, useState } from 'react'
import { formInput, formFeedback } from 'utils/formHelpers'

const TokenComponent = ({ values, onChange, validationError }) => {
  const inputRef = useRef()
  const [newValue, setNewValue] = useState('')

  const onClickListener = (e) => {
    if (e.target.matches('.option-token-comp')) {
      inputRef.current.focus()
    }
  }

  return (
    <>
      <div
        className={`option-token-comp${validationError ? ' is-invalid' : ''}`}
        onClick={onClickListener}
      >
        {values.map((v, index) => {
          return (
            <div
              className="token"
              onClick={() => {
                const updatedValues = [...values]
                updatedValues.splice(index, 1)
                onChange(updatedValues)
              }}
              key={index}
            >
              {v}
              <div className="remove-icon">&times;</div>
            </div>
          )
        })}
        <input
          placeholder="Add a new value"
          ref={inputRef}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onChange(Array.from(new Set([...values, newValue])))
              setNewValue('')
            } else if (e.key === 'Backspace' && newValue.length === 0) {
              onChange(values.slice(0, -1))
            }
          }}
        />
      </div>
      {validationError && (
        <div className="invalid-feedback d-block">{validationError}</div>
      )}
    </>
  )
}

const EditOptions = ({
  formState,
  setFormState,
  label,
  onRemove,
  placeholder
}) => {
  const input = formInput(formState, (newState) => setFormState(newState))
  const Feedback = formFeedback(formState)

  return (
    <div className="edit-product-option row">
      <>
        <div className="col-md-6">
          <label>{label}</label>
          <input type="text" {...input('title')} placeholder={placeholder} />
          {Feedback('title')}
        </div>
        <div className="col-md-6">
          <div className="d-flex">
            <button
              type="button"
              className="remove-link btn btn-link ml-auto"
              onClick={onRemove}
            >
              Remove
            </button>
          </div>
          <TokenComponent
            values={formState.options || []}
            onChange={(newOptions) => setFormState({ options: newOptions })}
            validationError={formState.optionsError}
          />
        </div>
      </>
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

  .option-token-comp
    border-radius: 5px
    border: solid 1px #cdd7e0
    background-color: #fafbfc
    padding: 6px
    min-height: 80px
    display: flex
    flex-wrap: wrap
    cursor: text

    &.is-invalid
      border-color: #dc3545;
      padding-right: calc(1.5em + 0.75rem);
      background-image: url(data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23dc3545' viewBox='0 0 12 12'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e);
      background-repeat: no-repeat;
      background-position: right calc(0.375em + 0.1875rem) center;
      background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);

    .token
      border-radius: 5px
      border: solid 1px #3b80ee
      background-color: #f8fbff
      padding: 0.25rem 0.5rem
      height: 1.75rem
      font-size: 0.75rem
      cursor: pointer
      margin: 5px
      display: flex
      align-items: center
      .remove-icon
        border-left: solid 1px #3b80ee
        margin-left: 0.5rem
        padding-left: 0.5rem
        color: #3b80ee
        font-size: 1rem

    input
      padding: 0.25rem 0.5rem
      height: 1.75rem
      font-size: 0.75rem
      margin: 5px
`)
