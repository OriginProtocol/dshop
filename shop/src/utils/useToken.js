import ethers from 'ethers'
import { useEffect, useState } from 'react'

import usePrice from 'utils/usePrice'
import useWallet from 'utils/useWallet'
import useOrigin from 'utils/useOrigin'

const tokenAbi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
]

function useToken(activeToken = {}, totalUsd) {
  const [state, setStateRaw] = useState({
    shouldRefetchBalance: 0,
    hasBalance: false,
    loading: true,
    hasAllowance: false
  })
  const { status } = useWallet()
  const { marketplace, provider, signer } = useOrigin()

  const setState = (newState) => setStateRaw({ ...state, ...newState })
  const { exchangeRates } = usePrice()

  useEffect(() => {
    const exchangeRate = exchangeRates[activeToken.name]
    async function getBalance() {
      setState({ loading: true })
      try {
        // console.log('getBalance', activeToken)
        const walletAddress = await signer.getAddress()

        if (activeToken.id === 'token-ETH') {
          const balance = await provider.getBalance(walletAddress)
          const balanceNum = ethers.utils.formatUnits(balance, 'ether')
          const balanceUSD = Math.floor(
            (Number(balanceNum) / exchangeRates['ETH']) * 100
          )
          const hasBalance = balanceUSD >= totalUsd
          setState({
            hasBalance,
            hasAllowance: true,
            loading: false,
            error: null
          })
        } else if (activeToken.address) {
          const contract = new ethers.Contract(
            activeToken.address,
            tokenAbi,
            signer || provider
          )
          const balance = await contract.balanceOf(walletAddress)
          const balanceNum = ethers.utils.formatUnits(balance, 'ether')
          const balanceUSD = Math.floor(
            (Number(balanceNum) / exchangeRate) * 100
          )
          const hasBalance = balanceUSD > totalUsd
          let hasAllowance = false
          if (hasBalance) {
            const allowance = await contract.allowance(
              walletAddress,
              marketplace.address
            )
            const allowanceNum = ethers.utils.formatUnits(allowance, 'ether')
            const allowanceUSD = Math.ceil(
              (Number(allowanceNum) / exchangeRate) * 100
            )
            // console.log({ allowanceUSD })
            hasAllowance = allowanceUSD >= totalUsd
          }
          setState({
            hasBalance,
            hasAllowance,
            loading: false,
            contract,
            error: null
          })
        } else {
          setState({
            hasAllowance: false,
            hasBalance: false,
            loading: false,
            error: 'Token not configured'
          })
        }
      } catch (e) {
        setState({
          hasAllowance: false,
          hasBalance: false,
          loading: false,
          error: 'Token Error'
        })
      }
    }
    if (exchangeRate) {
      getBalance()
    } else {
      setState({
        hasAllowance: false,
        hasBalance: false,
        loading: false,
        error: 'No exchange rate for token'
      })
    }
  }, [activeToken.name, state.shouldRefetchBalance, totalUsd, signer, status])

  return {
    ...state,
    refetchBalance: () => {
      setState({ shouldRefetchBalance: state.shouldRefetchBalance + 1 })
    }
  }
}

export default useToken
