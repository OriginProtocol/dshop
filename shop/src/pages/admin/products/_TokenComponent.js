import React, { useState } from 'react'
import fbt from 'fbt'
import Creatable from 'react-select/creatable'

const TokenComponent = ({ elements, onChangeTokenComponent, disabled }) => {
  const [inputValue, setInputValue] = useState('')

  return (
    <Creatable
      components={{ DropdownIndicator: null }}
      inputValue={inputValue}
      isMulti
      isDisabled={disabled}
      menuIsOpen={false}
      onChange={(value) =>
        onChangeTokenComponent(value ? value.map((v) => v.value) : [])
      }
      onInputChange={(inputValue) => setInputValue(inputValue)}
      onKeyDown={(event) => {
        if (!inputValue) return
        switch (event.key) {
          case 'Enter':
          case 'Tab':
          case ',':
            setInputValue('')
            onChangeTokenComponent([...elements, inputValue])
            event.preventDefault()
        }
      }}
      placeholder={fbt(
        'Separate options with a comma',
        'admin.products.optionValuesPlaceholder'
      )}
      value={elements.map((label) => ({ label, value: label }))}
    />
  )
}

export default TokenComponent
