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
      value={elements.map((label) => ({ label, value: label }))}
      onChange={(valueArray) =>
        onChangeTokenComponent(valueArray ? valueArray.map((v) => v.value) : [])
      }
      /* 
          If an element in the Creatable component is removed, update the parent (onChangeTokenComponent) with a modified list of elements.
          When the last element is removed, valueArray === null (react-select version 3.1.1).
          Element addition is handled via 'onInputChange' and 'onKeyDown'.
       */
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
    />
  )
}

export default TokenComponent
