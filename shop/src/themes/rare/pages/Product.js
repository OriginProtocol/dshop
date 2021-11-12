import React from 'react'

import { usePrices } from '../utils'
import useConfig from 'utils/useConfig'

import Link from 'components/Link'
import Chart from '../components/Chart'

const Product = () => {
  const { config } = useConfig()
  const [state] = usePrices()

  const redeemed = state.totalChico
    ? config.initialCoinSupply - Number(state.totalChico)
    : ''

  const pct = state.priceDAIAvg
    ? (Math.round((Number(state.priceDAIAvg) / 25) * 10000) / 100).toFixed(2)
    : ''

  return (
    <div className="container flex flex-col sm:grid grid-cols-2 mt-12 sm:mt-20 gap-6 items-start">
      <div className="bg-white rounded-lg py-10 p-6">
        <img src="chico-crypto/chico-tee.png" />
      </div>
      <div className="sm:px-6">
        <div className="text-2xl sm:text-5xl font-bold whitespace-pre-line leading-none tracking-wide">
          {`Chico Tee
              Limited Edition`}
        </div>
        <div className="text-sm mt-4 flex items-center text-gray-300">
          <div>$CHICO</div>
          <div className="ml-6">by</div>
          <img
            src="chico-crypto/artist-pic.jpg"
            className="h-4 w-4 mx-2 rounded-full"
          />
          <div>Fullmetal Magdalene</div>
        </div>
        <div className="text-sm mt-8 text-gray-300 leading-snug">
          Integer in dolor eu elit porta pulvinar. Aenean consectetur ultrices
          augue sit amet facilisis. Praesent dictum, tellus eu viverra viverra,
          ante ante condimentum leo, quis iaculis risus risus eget enim. Nam
          faucibus efficitur vehicula. Duis suscipit malesuada diam, ut
          porttitor lacus consectetur et.
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6">
          <div className="text-3xl font-bold flex items-baseline">
            {`${state.priceDAIAvg} USD`}
          </div>
          <div className="text-3xl text-green-600 flex items-center">
            <svg width="16" height="16" className="mr-2">
              <path
                d="m 1 8 l 7 -7 l 7 7 m -7 -7 l 0 15"
                stroke="#53ff96"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {pct}%
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 leading-none">
          <div className="text-sm text-gray-300 flex">
            {`${state.availableChico}/${state.totalChico} available`}
          </div>
          <div className="text-sm text-gray-300 flex items-center">
            <svg width="13" height="17" viewBox="0 0 13 17" className="mr-2">
              <g fill="#f545ff" fillRule="evenodd">
                <path
                  d="M958.465 113.208c2.712 2.826 1.046 6.375-1.132 6.375-1.325 0-2.007-.896-2-1.825.014-1.724 1.977-1.725 3.132-4.55M955.062 104c.441 5.092-4.062 6.845-4.062 11.33 0 3.047 2.216 5.647 6.5 5.67 4.284.022 6.5-3.127 6.5-6.344 0-2.933-1.489-5.7-4.299-7.419.668 1.847-.22 3.533-1.084 4.114.05-2.364-.812-5.871-3.554-7.351"
                  transform="translate(-951 -104)"
                />
              </g>
            </svg>

            {`${redeemed} redeemed`}
          </div>
        </div>
        <div className="mt-8">
          <Link to="/buy" className="btn btn-primary">
            Buy $CHICO
          </Link>
        </div>
        {state.ownedChico === '0' ? null : (
          <div className="mt-3 flex flex-col sm:grid grid-cols-2 gap-3">
            <Link to="/sell" className="btn btn-primary">
              Sell $CHICO
            </Link>
            <Link to="/redeem" className="btn btn-primary">
              Redeem $CHICO
            </Link>
          </div>
        )}
        <div className="mt-8 text-xs text-gray-300 leading-none">
          Buy and sell real t-shirts with digital currency. Delivered on demand.
        </div>
        <div className="mt-16 font-bold">Historical Prices</div>
        <div className="mt-8">
          <Chart />
        </div>
        <div className="mt-8">
          <div className="font-bold mb-3">Market Info</div>
          <div className="grid grid-cols-2 text-gray-300 gap-2 text-sm">
            <div>Launched</div>
            <div className="text-right">9/26/2020</div>
            <div>Limited Edition</div>
            <div className="text-right">50 items</div>
            <div>All time high</div>
            <div className="text-right">546.90 USD</div>
            <div>Starting price</div>
            <div className="text-right">60.00 USD</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// const ChooseQuantity = ({ state, setState }) => {
//   return (
//     <div className="grid grid-cols-3 items-center gap-3 select-none">
//       <svg
//         width="34"
//         height="34"
//         className="cursor-pointer hover:opacity-75"
//         onClick={() => {
//           if (state.quantityBuy > 1) {
//             setState({ quantityBuy: state.quantityBuy - 1 })
//           }
//         }}
//       >
//         <circle cx="17" cy="17" r="16" stroke="white" strokeWidth="1" />
//         <g stroke="white" strokeWidth="2">
//           <line x1="11" y1="17" x2="23" y2="17" />
//         </g>
//       </svg>
//       <div className="text-3xl flex justify-center items-center">
//         {state.quantityBuy}
//       </div>
//       <svg
//         width="34"
//         height="34"
//         className="cursor-pointer hover:opacity-75"
//         onClick={() => {
//           if (state.quantityBuy < 10) {
//             setState({ quantityBuy: state.quantityBuy + 1 })
//           }
//         }}
//       >
//         <circle cx="17" cy="17" r="16" stroke="white" strokeWidth="1" />
//         <g stroke="white" strokeWidth="2">
//           <line x1="11" y1="17" x2="23" y2="17" />
//           <line y1="11" x1="17" y2="23" x2="17" />
//         </g>
//       </svg>
//     </div>
//   )
// }

export default Product
