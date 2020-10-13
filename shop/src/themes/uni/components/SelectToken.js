import React from 'react'

import Select from './Select'

const SelectToken = ({ state, setState }) => {
  return (
    <Select>
      <select
        className="rounded-full w-full border border-black px-4 py-2 font-bold appearance-none"
        style={{ minHeight: '2.5rem' }}
        value={state.token}
        onChange={(e) => setState({ token: e.target.value })}
      >
        {state.tokens.map(({ symbol }) => (
          <option key={symbol} value={symbol}>{`${
            state.token === symbol ? state.priceUSDQ : ''
          } ${symbol}`}</option>
        ))}
      </select>
    </Select>
  )
}

export default SelectToken
