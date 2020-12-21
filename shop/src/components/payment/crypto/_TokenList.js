import React from 'react'
import fbt from 'fbt'

import usePrice from 'utils/usePrice'

const TokenList = ({
  acceptedTokens,
  activeToken,
  setActiveToken,
  loading,
  config,
  cart
}) => {
  const { toTokenPrice, toFiatPrice } = usePrice(config.currency)
  return (
    <table>
      <thead>
        <tr>
          <th>
            <fbt desc="Cryptocurrency">Cryptocurrency</fbt>
          </th>
          <th>
            <fbt desc="Amount">Amount</fbt>
          </th>
          <th>
            <fbt desc="ExchangeRate">Exchange Rate</fbt>
          </th>
        </tr>
      </thead>
      <tbody>
        {acceptedTokens.map((token) => {
          const isActive = activeToken.id === token.id
          return (
            <tr key={token.id} onClick={() => setActiveToken(token)}>
              <td className="input-container">
                <input
                  type="radio"
                  disabled={loading}
                  value={token.id}
                  checked={isActive}
                  onChange={() => setActiveToken(token)}
                />
                <div className={`token-logo${isActive ? ' active' : ''}`}>
                  <img src={`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${token.address}/logo.png`} />
                </div>
                <div>{token.name}</div>
              </td>
              <td>{`${toTokenPrice(cart.total, token.name)} ${token.name}`}</td>
              <td>{`1 ${token.name} = ${toFiatPrice(100, token.name)}`}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default TokenList
