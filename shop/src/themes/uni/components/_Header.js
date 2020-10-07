import React from 'react'
import { useWeb3React } from '@web3-react/core'

import Twitter from 'components/icons/Twitter'
import Facebook from 'components/icons/Facebook'
import YouTube from 'components/icons/YouTube'
import Link from 'components/Link'

import useConfig from 'utils/useConfig'
import { injectedConnector, useEagerConnect } from '../utils'

const Header = () => {
  const { config } = useConfig()
  const { active, error, account, activate } = useWeb3React()
  useEagerConnect()

  return (
    <div className="container grid items-center pt-6 sm:pt-20 grid-cols-3">
      <div className="flex">
        <div className="hidden sm:block hover:opacity-75">
          <Twitter color="#fff" style={{ width: 20 }} />
        </div>
        <div className="hidden sm:block hover:opacity-75 ml-10">
          <Facebook color="#fff" style={{ width: 12 }} />
        </div>
        <div className="hidden sm:block hover:opacity-75 ml-10">
          <YouTube color="#fff" style={{ width: 20 }} />
        </div>
      </div>
      <Link to="/" className="flex items-center justify-center">
        <img src={`${config.dataSrc}${config.logo}`} style={{ height: 80 }} />
      </Link>
      <div className="flex text-sm justify-end">
        <div className="flex py-1 px-3 bg-gray-800 rounded-full">
          <img
            src="images/fire-icon.svg"
            width="12"
            height="12"
            className="mr-2"
          />
          123 redeemed
        </div>
        {!active ? (
          <button
            className="btn btn-sm ml-2"
            onClick={() => activate(injectedConnector)}
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex py-1 px-3 bg-gray-800 rounded-full ml-4 items-center">
            <svg height="12" width="12" className="mr-2">
              <circle
                cx="6"
                cy="6"
                r="6"
                fill={active ? '#26d198' : error ? 'red' : 'orange'}
              />
            </svg>
            {account ? `${account.substr(0, 6)}...` : ''}
          </div>
        )}
      </div>
    </div>
  )
}

export default Header
