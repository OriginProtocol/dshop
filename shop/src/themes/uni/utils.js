import { useEffect, useState, useReducer } from 'react'
import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import ethers from 'ethers'

import abi from './abi.json'
window.us = abi

const reducer = (state, newState) => ({ ...state, ...newState })

export function usePrices({ quantity, reload }) {
  const { account } = useWeb3React()
  const [state, setState] = useReducer(reducer, {
    priceUSD: '',
    priceUSDQ: '',
    availableChico: '',
    totalChico: '',
    ownedChico: ''
  })

  useEffect(() => {
    router
      .getAmountsIn(ethers.utils.parseEther('1'), [dai.address, chico.address])
      .then((quote) => {
        const priceUSD = ethers.utils.formatEther(quote[0])
        setState({ priceUSD: priceUSD.replace(/^([0-9]+\.[0-9]{2}).*/, '$1') })
      })

    chico.totalSupply().then((supply) => {
      const totalChico = ethers.utils.formatEther(supply)
      setState({ totalChico: totalChico.replace(/^([0-9]+)\..*/, '$1') })
    })

    if (account) {
      chico.balanceOf(account).then((balance) => {
        const ownedChico = ethers.utils.formatEther(balance)
        setState({ ownedChico: ownedChico.replace(/^([0-9]+)\..*/, '$1') })
      })
    }

    pair.getReserves().then((reserves) => {
      const token1 = ethers.BigNumber.from(dai.address)
      const token2 = ethers.BigNumber.from(chico.address)
      const reserve = token1.gt(token2) ? reserves[0] : reserves[1]
      const availableChico = ethers.utils.formatEther(reserve)
      setState({
        availableChico: availableChico.replace(/^([0-9]+)\..*/, '$1')
      })
    })
  }, [reload, account])

  useEffect(() => {
    router
      .getAmountsIn(ethers.utils.parseEther(String(quantity)), [
        dai.address,
        chico.address
      ])
      .then((quote) => {
        const priceUSDQ = ethers.utils.formatEther(quote[0])
        setState({
          priceUSDQ: priceUSDQ.replace(/^([0-9]+\.[0-9]{2}).*/, '$1'),
          priceUSDBN: quote[0].mul(101).div(100),
          priceUSDA: quote[0].mul(101).div(100).toString()
        })
      })

    router
      .getAmountsOut(ethers.utils.parseEther(String(quantity)), [
        chico.address,
        dai.address
      ])
      .then((quote) => {
        const getUSDQ = ethers.utils.formatEther(quote[1])
        setState({
          getUSDQ: getUSDQ.replace(/^([0-9]+\.[0-9]{2}).*/, '$1')
        })
      })
  }, [quantity, reload, account])

  return state
}

export function useEagerConnect() {
  const { activate, active } = useWeb3React()
  const [tried, setTried] = useState(false)

  useEffect(() => {
    injectedConnector.isAuthorized().then((isAuthorized) => {
      if (isAuthorized) {
        activate(injectedConnector, undefined, true).catch(() => {
          setTried(true)
        })
      } else {
        setTried(true)
      }
    })
  }, [])

  useEffect(() => {
    if (!tried && active) {
      setTried(true)
    }
  }, [tried, active])

  return tried
}

export const injectedConnector = new InjectedConnector()

// Local addresses
// const Addresses = {
//   factory: '0xE0bF6021e023a197DBb3fABE64efA880E13D3f4b',
//   weth: '0x3f21BC64076e7c9ed8695d053DCCBE6D8d5E6f43',
//   dai: '0xb848ef765E289762e9BE66a38006DDc4D23AeF24',
//   chico: '0x774DDa3beEf9650473549Be4EE7054a2ef5B0140',
//   pair: '0xca8e1619b5f7F0aBB8D16Feda413ffaf0dd67C44',
//   router: '0x9A6041D25B77A16b0A63c6B157CD49ABBF2aE966'
// }

const Addresses = {
  factory: '0x279a83a163156EbeE7497e96d427892b9A425512',
  weth: '0x7C7d2ABE93f74104e262d28083e25b6702b363CB',
  dai: '0xe51bAbD26239c1B87954698A783AC9C0a06B03DD',
  chico: '0x6462Bef6bB8a2D764A1B7807C5402796aDF11EC0',
  pair: '0xc8c3fF93402C16F9085383230C2861D6857B9b87',
  router: '0x59153Aa7B32aBFB9a3f8b79F88D3763025540C8a'
}

// const provider = new ethers.providers.JsonRpcProvider()
const provider = new ethers.providers.Web3Provider(window.ethereum, 4)

export const pair = new ethers.Contract(
  Addresses.pair,
  abi.contracts['contracts/UniswapV2Pair.sol:UniswapV2Pair'].abi,
  provider
)
export const pairErc20 = new ethers.Contract(
  Addresses.pair,
  abi.contracts['contracts/interfaces/IUniswapV2ERC20.sol:IUniswapV2ERC20'].abi,
  provider
)
export const router = new ethers.Contract(
  Addresses.router,
  abi.contracts['v2router'].abi,
  provider
)
export const dai = new ethers.Contract(
  Addresses.dai,
  abi.contracts['ERC20FixedSupplyBurnable'].abi,
  provider
)
export const chico = new ethers.Contract(
  Addresses.chico,
  abi.contracts['ERC20FixedSupplyBurnable'].abi,
  provider
)

async function setup() {
  const accounts = await provider.listAccounts()
  const signer = provider.getSigner(accounts[0])

  window.pair = pair.connect(signer)
  window.pairErc20 = pairErc20.connect(signer)
  window.router = router.connect(signer)
  window.dai = dai.connect(signer)
  window.chico = chico.connect(signer)

  // const quote = await router.getAmountsIn(ethers.utils.parseEther('1'), [
  //   dai.address,
  //   chico.address
  // ])

  // console.log(ethers.utils.formatEther(quote[0]))

  // const reserves = await pair.getReserves()
  // console.log(ethers.utils.formatEther(reserves[0]))
  // console.log(ethers.utils.formatEther(reserves[1]))
}

setup()

/* eslint-disable */
async function go() {
  log = console.log
  provider = new _ethers.providers.JsonRpcProvider()
  accounts = await provider.listAccounts()
  signer = provider.getSigner(accounts[0])

  UniswapV2Factory = _ethers.ContractFactory.fromSolidity(
    us.contracts['contracts/UniswapV2Factory.sol:UniswapV2Factory'],
    signer
  )
  pairIface = new _ethers.utils.Interface(
    us.contracts['contracts/UniswapV2Pair.sol:UniswapV2Pair'].abi
  )
  factory = await UniswapV2Factory.deploy(
    '0x0000000000000000000000000000000000000000'
  )

  log(`Deployed factory. Address ${factory.address}`)

  erc20 = _ethers.ContractFactory.fromSolidity(
    us.contracts['ERC20FixedSupplyBurnable'],
    signer
  )

  weth = await erc20.deploy('Weth', 'WETH', _ethers.utils.parseEther('100'))
  log(`Minted 1000 weth. Address ${weth.address}`)

  dai = await erc20.deploy(
    'Maker DAI',
    'DAI',
    _ethers.utils.parseEther('10000')
  )
  log(`Minted 10000 dai. Address ${dai.address}`)

  chico = await erc20.deploy(
    'Chico Coin',
    'CHICO',
    _ethers.utils.parseEther('50')
  )
  log(`Minted 50 chico. Address ${chico.address}`)

  await factory.createPair(dai.address, chico.address)
  pairAddress = await factory.getPair(dai.address, chico.address)
  log(`Created dai / chico pair. Address ${pairAddress}`)

  pair = new _ethers.Contract(
    pairAddress,
    us.contracts['contracts/UniswapV2Pair.sol:UniswapV2Pair'].abi,
    signer
  )
  token0 = await pair.token0()
  token1 = await pair.token1()

  routerContract = _ethers.ContractFactory.fromSolidity(
    us.contracts['v2router'],
    signer
  )
  router = await routerContract.deploy(factory.address, weth.address)
  log(`Deployed router. Address ${router.address}`)

  await dai.approve(router.address, _ethers.utils.parseEther('1250'))
  await chico.approve(router.address, _ethers.utils.parseEther('50'))

  await router.addLiquidity(
    dai.address,
    chico.address,
    _ethers.utils.parseEther('1250'),
    _ethers.utils.parseEther('50'),
    _ethers.utils.parseEther('1250'),
    _ethers.utils.parseEther('50'),
    accounts[0],
    Math.round(new Date() / 1000) + 60 * 60 * 24
  )
  console.log('Added 1250 DAI and 50 CHICO to liquidity pool')

  async function sendChico() {
    await dai.approve(router.address, _ethers.utils.parseEther('100'))

    res = await router.swapTokensForExactTokens(
      _ethers.utils.parseEther('1'),
      _ethers.utils.parseEther('1000'),
      [dai.address, chico.address],
      accounts[1],
      Math.round(new Date() / 1000) + 60 * 60 * 24
    )
    r = await res.wait()
    events = r.logs.map((log) => pairIface.parseLog(log))
    const daiKey = token0 === dai.address ? 'amount0In' : 'amount1In'
    spent = _ethers.utils.formatEther(events[3].args[daiKey])

    const reserves = await pair.getReserves()

    const daiLeftKey = token0 === dai.address ? '_reserve0' : '_reserve1'
    const chicoLeftKey = daiKey === '_reserve0' ? '_reserve1' : '_reserve0'
    const daiLeft = _ethers.utils.formatEther(reserves[daiLeftKey])
    const chicoLeft = _ethers.utils.formatEther(reserves[chicoLeftKey])

    const quoteRaw = await router.getAmountIn(
      _ethers.utils.formatEther('1'),
      chico.address,
      dai.address
    )
    const quote = _ethers.utils.formatUnits(quoteRaw, 0)

    console.log(
      `Send 1 chico coin to account 2 for ${quote} dai (${spent} actual). ${chicoLeft} left in reserves.`
    )
  }

  for (let i = 0; i < 10; i++) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await sendChico()
    } catch (e) {
      console.log('err', e)
    }
  }

  _ethers.utils.formatUnits(await chico.balanceOf(accounts[1]), 0)

  quote = await router.quote(
    _ethers.utils.parseEther('1'),
    chico.address,
    dai.address
  )
  _ethers.utils.formatEther(quote)

  quote = await router.getAmountIn(
    _ethers.utils.parseEther('1'),
    chico.address,
    dai.address
  )
  _ethers.utils.formatEther(quote)

  quote = await router.getAmountsOut(_ethers.utils.parseEther('1'), [
    dai.address,
    chico.address
  ])
  _ethers.utils.formatEther(quote)

  // _ethers.utils.formatEther(await dai.balanceOf(accounts[0]))

  async function removeLiquidity() {
    provider = new _ethers.providers.JsonRpcProvider()
    accounts = await provider.listAccounts()

    r = await pair.getReserves()
    console.log(
      'reserves before:',
      r.map((r) => _ethers.utils.formatEther(r))
    )

    db = await dai.balanceOf(accounts[0])
    cb = await chico.balanceOf(accounts[0])
    console.log('dai before:', _ethers.utils.formatEther(db))
    console.log('chico before:', _ethers.utils.formatEther(cb))

    liqbal = await pairErc20.balanceOf(accounts[0])
    await pairErc20.approve(router.address, liqbal)
    await router.removeLiquidity(
      dai.address,
      chico.address,
      liqbal,
      _ethers.utils.parseEther('0'),
      _ethers.utils.parseEther('0'),
      accounts[0],
      Math.round(new Date() / 1000) + 60 * 60 * 24
    )
    console.log('Removed 1 CHICO from liquidity pool')

    r = await pair.getReserves()
    console.log(
      'reserves after:',
      r.map((r) => _ethers.utils.formatEther(r))
    )

    da = await dai.balanceOf(accounts[0])
    ca = await chico.balanceOf(accounts[0])
    console.log('dai after:', _ethers.utils.formatEther(da))
    console.log('chico after:', _ethers.utils.formatEther(ca))

    console.log('dai diff:', _ethers.utils.formatEther(da.sub(db)))
    console.log('chico diff:', _ethers.utils.formatEther(ca.sub(cb)))
  }
}
