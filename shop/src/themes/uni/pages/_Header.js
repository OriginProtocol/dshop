import React from 'react'

import Link from 'components/Link'
import SocialLinks from 'components/SocialLinks'

import useConfig from 'utils/useConfig'
import { usePrices, useWeb3Manager } from '../utils'

const Header = () => {
  const { config } = useConfig()
  const { active, error, account, activate } = useWeb3Manager()
  const [state] = usePrices({ quantity: 1 })

  const redeemed = state.totalChico
    ? config.initialCoinSupply - Number(state.totalChico)
    : null

  return (
    <div className="container grid items-center pt-6 sm:pt-20 grid-cols-3">
      <SocialLinks
        className="flex"
        itemClassName="hover:opacity-75 mr-12"
        svg={{ color: '#fff', height: 18 }}
      />
      <Link to="/" className="flex items-center justify-center">
        <img src={`${config.dataSrc}${config.logo}`} style={{ height: 80 }} />
      </Link>
      <div className="flex text-sm justify-end">
        {!redeemed ? null : (
          <Link
            className="flex py-1 px-3 bg-gray-800 rounded-full hover:bg-gray-700"
            to="/stats"
          >
            <img
              src="images/fire-icon.svg"
              width="12"
              height="12"
              className="mr-2"
            />
            {`${redeemed} redeemed`}
          </Link>
        )}
        {!account ? (
          <button className="btn btn-sm ml-2" onClick={() => activate()}>
            Connect Wallet
          </button>
        ) : (
          <Link
            to="/connection"
            className="flex py-1 px-3 bg-gray-800 rounded-full ml-4 items-center hover:bg-gray-700"
          >
            <svg height="12" width="12" className="mr-2">
              <circle
                cx="6"
                cy="6"
                r="6"
                fill={active ? '#26d198' : error ? 'red' : 'orange'}
              />
            </svg>
            {account ? `${account.substr(0, 6)}...` : ''}
          </Link>
        )}
      </div>
    </div>
  )
}

export default Header
