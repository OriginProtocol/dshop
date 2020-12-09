import React, { useState } from 'react'
import fbt from 'fbt'
import Creatable from 'react-select/creatable'

const TokenComponent = ({ options, onChangeTokenComponent, disabled }) => {
  const [inputValue, setInputValue] = useState('')

  function handleOnChange(valueArray, options) {
    const transformValueArray = (arr) => (arr ? arr.map((v) => v.value) : [])
    const newOptions = transformValueArray(valueArray)
    console.log('Previously, Options were ', options)
    console.log('New Options are ', newOptions)
    onChangeTokenComponent(newOptions)
  }

  return (
    <Creatable
      components={{ DropdownIndicator: null }}
      inputValue={inputValue}
      isMulti
      isDisabled={disabled}
      menuIsOpen={false}
      onChange={(value) => handleOnChange(value, options)}
      onInputChange={(inputValue) => setInputValue(inputValue)}
      onKeyDown={(event) => {
        if (!inputValue) return
        switch (event.key) {
          case 'Enter':
          case 'Tab':
          case ',':
            setInputValue('')
            onChangeTokenComponent([...options, inputValue])
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

export default TokenComponent
