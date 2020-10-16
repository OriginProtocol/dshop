import React from 'react'
import fbt from 'fbt'

import useDiscount from 'utils/useDiscount'
import usePalette from '../../hoc/usePalette'

const Discount = () => {
  const { code, setCode, activeCode, check, remove, error } = useDiscount()
  const { colors } = usePalette()

  return (
    <>
      <div className="mt-4">Discount code</div>
      <div className="pt-4 border-b pb-4">
        <form
          className="flex justify-between text-lg"
          onSubmit={(e) => {
            e.preventDefault()
            check(code)
          }}
        >
          <input
            className="border px-2 py-2 bg-gray-100 w-full"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className={`btn ml-2 py-2 text-sm bg-${colors.buttonColor}`}>
            Apply
          </button>
        </form>
        {activeCode && (
          <div className="inline-flex text-white mt-1 text-sm px-2 bg-gray-500 rounded items-center font-medium">
            {activeCode}
            <a
              className="ml-1 leading-none"
              href="#"
              onClick={(e) => {
                e.preventDefault()
                remove()
              }}
            >
              &times;
            </a>
          </div>
        )}
        {error && (
          <div className="text-red-700 mt-1 text-sm">
            <fbt desc="checkout.discounts.invalidCode">
              Enter a valid discount code
            </fbt>
          </div>
        )}
      </div>
    </>
  )
}

export default Discount
