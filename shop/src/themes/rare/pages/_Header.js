import React from 'react'

import Link from 'components/Link'

import useConfig from 'utils/useConfig'
import { usePrices, useWeb3Manager } from '../utils'

const Header = () => {
  const { config } = useConfig()
  const { active, error, account, activate } = useWeb3Manager()
  const [state] = usePrices()

  return (
    <div className="container mt-8 sm:mt-20 flex flex-col sm:flex-row justify-between items-center">
      <Link to="/">
        {/* <img src={`chico-crypto/bcleaks.svg`} style={{ height: 70 }} /> */}
        <img src={`${config.dataSrc}${config.logo}`} style={{ height: 70 }} />
      </Link>
      <div className="flex text-sm mt-8 sm:mt-0">
        {state.ownedChico === '0' ? null : (
          <div className="flex py-1 px-3 bg-purple-600 rounded-full ml-4 items-center text-white">
            <b className="mr-1">{state.ownedChico}</b>
            $CHICO
          </div>
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
