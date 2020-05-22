import ethers from 'ethers'
import { useEffect, useState } from 'react'

import usePrice from 'utils/usePrice'
import useOrigin from 'utils/useOrigin'
import { useStateValue } from 'data/state'

function useToken(activeToken = {}) {
  const [state, setStateRaw] = useState({
    shouldRefetchBalance: 0,
    hasBalance: false,
    loading: true,
    hasAllowance: false
  })
  const { provider, signer, ogn, marketplace } = useOrigin()

  const setState = (newState) => setStateRaw({ ...state, ...newState })
  const { exchangeRates } = usePrice()
  const [{ cart }] = useStateValue()

  useEffect(() => {
    async function getBalance() {
      setState({ loading: true })
      console.log('getBalance', activeToken.id)
      const address = await signer.getAddress()
      if (activeToken.id === 'token-ETH') {
        const balance = await provider.getBalance(address)
        const balanceNum = ethers.utils.formatUnits(balance, 'ether')
        const balanceUSD = Math.floor(
          (Number(balanceNum) / exchangeRates['ETH']) * 100
        )
        const hasBalance = balanceUSD >= cart.total
        setState({ hasBalance, hasAllowance: true, loading: false })
      } else if (activeToken.id === 'token-OGN') {
        const balance = await ogn.balanceOf(address)
        const balanceNum = ethers.utils.formatUnits(balance, 'ether')
        const balanceUSD = Math.floor(
          (Number(balanceNum) / exchangeRates['OGN']) * 100
        )
        console.log({ balanceUSD, balanceNum })
        const hasBalance = balanceUSD > cart.total
        let hasAllowance = false
        if (hasBalance) {
          const allowance = await ogn.allowance(address, marketplace.address)
          const allowanceNum = ethers.utils.formatUnits(allowance, 'ether')
          const allowanceUSD = Math.ceil(
            (Number(allowanceNum) / exchangeRates['OGN']) * 100
          )
          // console.log({ allowanceUSD })
          hasAllowance = allowanceUSD >= cart.total
        }
        setState({ hasBalance, hasAllowance, loading: false })
      } else {
        setState({ hasAllowance: false, hasBalance: false, loading: false })
      }
    }
    if (exchangeRates[activeToken.name]) {
      getBalance()
    }
  }, [activeToken.name, state.shouldRefetchBalance])

  return {
    ...state,
    refetchBalance: () => {
      setState({ shouldRefetchBalance: state.shouldRefetchBalance + 1 })
    }
  }
}

export default useToken
