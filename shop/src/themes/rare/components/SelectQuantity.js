import React from 'react'

const SelectQuantity = ({ quantity, setQuantity, max = 25 }) => {
  return (
    <div className="grid grid-cols-3 items-center gap-3 select-none">
      <svg
        width="60"
        height="60"
        className="cursor-pointer hover:opacity-75"
        onClick={() => {
          if (quantity > 1) {
            setQuantity(quantity - 1)
          }
        }}
      >
        <circle cx="30" cy="30" r="29" stroke="white" strokeWidth="1" />
        <g stroke="white" strokeWidth="3">
          <line x1="20" y1="30" x2="40" y2="30" />
        </g>
      </svg>
      <div className="text-5xl flex justify-center items-center font-semibold">
        {quantity}
      </div>
      <svg
        width="60"
        height="60"
        className="cursor-pointer hover:opacity-75"
        onClick={() => {
          if (quantity < max) {
            setQuantity(quantity + 1)
          }
        }}
      >
        <circle cx="30" cy="30" r="29" stroke="white" strokeWidth="1" />
        <g stroke="white" strokeWidth="3">
          <line x1="20" y1="30" x2="40" y2="30" />
          <line y1="20" x1="30" y2="40" x2="30" />
        </g>
      </svg>
    </div>
  )
}

export default SelectQuantity
