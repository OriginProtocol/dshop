import React from 'react'

const SelectQuantity = ({ quantity, setQuantity, max = 50 }) => {
  return (
    <div
      className="rounded-full border border-black grid grid-cols-3 items-center font-bold m-height-12"
      style={{ minHeight: '2.5rem' }}
    >
      <a
        href="#"
        className="text-xl px-4 hover:opacity-50"
        onClick={(e) => {
          e.preventDefault()
          if (quantity > 1) {
            setQuantity(quantity - 1)
          }
        }}
      >
        -
      </a>
      <div className="text-center">{quantity}</div>
      <a
        href="#"
        className="text-xl text-right px-4 hover:opacity-50"
        onClick={(e) => {
          e.preventDefault()
          if (quantity < max) {
            setQuantity(quantity + 1)
          }
        }}
      >
        +
      </a>
    </div>
  )
}

export default SelectQuantity
