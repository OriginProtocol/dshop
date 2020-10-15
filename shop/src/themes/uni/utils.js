import { useEffect, useState, useReducer } from 'react'
import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '@web3-react/network-connector'
// import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import ethers from 'ethers'
import memoize from 'lodash/memoize'
import pick from 'lodash/pick'
import assign from 'lodash/assign'

import abis from './abi.json'

import Addresses from './Addresses.js'

const reducer = (state, newState) => ({ ...state, ...newState })

const factC = 'contracts/UniswapV2Factory.sol:UniswapV2Factory'
const pairC = 'contracts/UniswapV2Pair.sol:UniswapV2Pair'
const pairEC = 'contracts/interfaces/IUniswapV2ERC20.sol:IUniswapV2ERC20'
const routerC = 'v2router'
const ercBurnable = 'ERC20FixedSupplyBurnable'
const ercFixed = 'ERC20FixedSupplyBurnable'
const abi = (name) => abis.contracts[name].abi
const Contract = (name) =>
  new ethers.ContractFactory(
    abis.contracts[name].abi,
    abis.contracts[name].bytecode
  )
window.abis = abis

const getContracts = memoize(async function (provider) {
  const factory = new ethers.Contract(Addresses.factory, abi(factC), provider)
  const dai = new ethers.Contract(Addresses.dai, abi(ercBurnable), provider)
  const ogn = new ethers.Contract(Addresses.ogn, abi(ercBurnable), provider)
  const chico = new ethers.Contract(Addresses.chico, abi(ercFixed), provider)
  const weth = new ethers.Contract(Addresses.weth, abi(ercFixed), provider)
  const pairAddress = await factory.getPair(weth.address, chico.address)
  const pair = new ethers.Contract(pairAddress, abi(pairC), provider)
  const pairErc20 = new ethers.Contract(pairAddress, abi(pairEC), provider)
  const router = new ethers.Contract(Addresses.router, abi(routerC), provider)
  const erc20 = Contract(ercFixed)
  window.contracts = {
    factory,
    pair,
    pairErc20,
    router,
    dai,
    chico,
    erc20,
    weth,
    ogn
  }
  return { factory, pair, pairErc20, router, dai, chico, weth, ogn }
})

const allFields = [
  'account',
  'activate',
  'active',
  'chainId',
  'connector',
  'deactivate',
  'error',
  'library',
  'setError'
]
const activeFields = ['connector', 'library', 'active', 'chainId']

export function useWeb3Manager() {
  const injectedWeb3React = useWeb3React()
  const networkWeb3React = useWeb3React('network')
  const tried = useEagerConnect()
  const { active, chainId } = injectedWeb3React

  useEffect(() => {
    if (!tried) return
    if (!active || chainId !== defaultChainId) {
      networkWeb3React.activate(networkConnector)
    }
  }, [active, chainId])

  const ret = pick(injectedWeb3React, allFields)
  ret.activate = () => injectedWeb3React.activate(injectedConnector)
  // ret.activate = () => injectedWeb3React.activate(walletConnectConnector)

  if (!active || chainId !== defaultChainId) {
    assign(ret, pick(networkWeb3React, activeFields))
    ret.isNetwork = true
    if (chainId !== defaultChainId) {
      ret.desiredNetwork =
        defaultChainId === 1
          ? 'Mainnet'
          : defaultChainId === 4
          ? 'Rinkeby'
          : `Chain ID ${defaultChainId}`
    }
  }

  return ret
}

export function useContracts() {
  const { library, chainId } = useWeb3Manager()
  const [contracts, setContracts] = useState({})
  useEffect(() => {
    if (chainId === defaultChainId) {
      getContracts(library)
        .then(setContracts)
        .catch(() => {})
    }
  }, [chainId])
  return contracts
}

const tokens = [
  { symbol: 'OGN', address: Addresses.ogn },
  { symbol: 'DAI', address: Addresses.dai },
  { symbol: 'ETH', address: Addresses.weth }
]

export function usePrices({ quantity = 1, reload }) {
  const { account, connector, active, library } = useWeb3Manager()
  const { pair, router, chico, weth, dai } = useContracts()

  const [state, setState] = useReducer(reducer, {
    tokens,
    token: 'ETH',
    tokenContract: weth,
    priceUSD: '',
    priceUSDBN: ethers.BigNumber.from(0),
    priceUSDQ: '',
    priceDAI: '',
    availableChico: '',
    totalChico: '',
    ownedChico: '0',
    ethBalance: ethers.BigNumber.from(0),
    tokenBalance: ethers.BigNumber.from(0),
    tokenAllowance: ethers.BigNumber.from(0)
  })

  useEffect(() => {
    const token = state.tokens.find((t) => t.symbol === state.token)
    if (token) {
      const tokenContract = new ethers.Contract(
        token.address,
        abi(ercBurnable),
        library
      )
      setState({ tokenContract })
    }
  }, [state.token])

  useEffect(() => {
    if (!connector || !active || !router || !state.tokenContract) return

    const path = [weth.address, chico.address]
    if (state.token !== 'ETH') {
      path.unshift(state.tokenContract.address)
    }

    router
      .getAmountsIn(ethers.utils.parseEther('1'), [
        dai.address,
        weth.address,
        chico.address
      ])
      .then((quote) => {
        const priceDAI = ethers.utils.formatEther(quote[0])
        setState({ priceDAI: priceDAI.replace(/^([0-9]+\.[0-9]{2}).*/, '$1') })
      })

    router.getAmountsIn(ethers.utils.parseEther('1'), path).then((quote) => {
      const priceUSD = ethers.utils.formatEther(quote[0])
      setState({ priceUSD: priceUSD.replace(/^([0-9]+\.[0-9]{2}).*/, '$1') })
    })

    chico.totalSupply().then((supply) => {
      const totalChico = ethers.utils.formatEther(supply)
      setState({ totalChico: totalChico.replace(/^([0-9]+)\..*/, '$1') })
    })

    if (account) {
      library.getBalance(account).then((ethBalance) => {
        if (state.token === 'ETH') {
          setState({
            ethBalance,
            tokenBalance: ethBalance,
            tokenAllowance: ethBalance
          })
        } else {
          setState({ ethBalance })
        }
      })

      chico.balanceOf(account).then((balance) => {
        const ownedChico = ethers.utils.formatEther(balance)
        setState({ ownedChico: ownedChico.replace(/^([0-9]+)\..*/, '$1') })
      })

      if (state.token !== 'ETH') {
        state.tokenContract
          .allowance(account, router.address)
          .then((tokenAllowance) => {
            setState({ tokenAllowance })
          })
        state.tokenContract.balanceOf(account).then((tokenBalance) => {
          setState({ tokenBalance })
        })
      }
    }

    pair.getReserves().then((reserves) => {
      const token1 = ethers.BigNumber.from(weth.address)
      const token2 = ethers.BigNumber.from(chico.address)
      const reserve = token1.gt(token2) ? reserves[0] : reserves[1]
      const availableChico = ethers.utils.formatEther(reserve)
      setState({
        availableChico: availableChico.replace(/^([0-9]+)\..*/, '$1')
      })
    })
  }, [reload, account, active, router, state.tokenContract])

  useEffect(() => {
    if (!connector || !router || !state.tokenContract) return
    const path = [weth.address, chico.address]
    const pathR = [chico.address, weth.address]
    if (state.token !== 'ETH') {
      path.unshift(state.tokenContract.address)
      pathR.push(state.tokenContract.address)
    }
    router
      .getAmountsIn(ethers.utils.parseEther(String(quantity)), path)
      .then((quote) => {
        const priceUSDQ = ethers.utils.formatEther(quote[0])
        setState({
          priceUSDQ: priceUSDQ.replace(/^([0-9]+\.[0-9]{5}).*/, '$1'),
          priceUSDBN: quote[0].mul(101).div(100),
          priceUSDA: quote[0].mul(101).div(100).toString()
        })
      })

    router
      .getAmountsIn(ethers.utils.parseEther(String(quantity)), [
        dai.address,
        weth.address,
        chico.address
      ])
      .then((quote) => {
        const priceDAIQ = ethers.utils.formatEther(quote[0])
        setState({
          priceDAIQ: priceDAIQ.replace(/^([0-9]+\.[0-9]{2}).*/, '$1')
        })
      })

    router
      .getAmountsOut(ethers.utils.parseEther(String(quantity)), pathR)
      .then((quote) => {
        const getUSDQ = ethers.utils.formatEther(quote[pathR.length - 1])
        setState({
          getUSDQ: getUSDQ.replace(/^([0-9]+\.[0-9]{5}).*/, '$1')
        })
      })

    router
      .getAmountsOut(ethers.utils.parseEther(String(quantity)), [
        chico.address,
        weth.address,
        dai.address
      ])
      .then((quote) => {
        const getDAIQ = ethers.utils.formatEther(quote[2])
        setState({
          getDAIQ: getDAIQ.replace(/^([0-9]+\.[0-9]{2}).*/, '$1')
        })
      })
  }, [quantity, reload, account, router, state.tokenContract])

  // console.log(state)

  return [state, setState]
}

export const injectedConnector = new InjectedConnector()

export const defaultChainId = 4
const mainnet = `aHR0cHM6Ly9ldGgtbWFpbm5ldC5hbGNoZW15YXBpLmlvL3YyL2ppTXNVaWwyOGViZFJhTG9KOERLNEVxSHZDZ0U5eVEz`
const rinkeby = `aHR0cHM6Ly9ldGgtcmlua2VieS5hbGNoZW15YXBpLmlvL3YyL1pmT3FJbk9mX1lxYXZfd2ExS2poeWFoeV9EaWE0UmFN`
const networkConnector = new NetworkConnector({
  urls: { 1: atob(mainnet), 4: atob(rinkeby), 1337: 'http://localhost:8545' },
  defaultChainId
})

// const walletConnectConnector = new WalletConnectConnector({
//   rpc: { 1: atob(mainnet) },
//   bridge: 'https://bridge.walletconnect.org',
//   qrcode: true,
//   pollingInterval: 12
// })

export function useEagerConnect() {
  const { activate, active, chainId, connector } = useWeb3React()
  const networkWeb3React = useWeb3React('network')
  const [tried, setTried] = useState(false)
  useEffect(() => {
    let stale
    injectedConnector.isAuthorized().then((isAuthorized) => {
      if (stale) return
      if (isAuthorized) {
        activate(injectedConnector, undefined, true).catch(() => {
          setTried(true)
          networkWeb3React.activate(networkConnector)
        })
      } else {
        setTried(true)
        networkWeb3React.activate(networkConnector)
      }
    })
    return () => (stale = true)
  }, [])

  useEffect(() => {
    if (tried && connector !== injectedConnector && !networkWeb3React.active) {
      networkWeb3React.activate(networkConnector)
    }
  }, [active, connector, chainId, tried])

  useEffect(() => {
    if (!tried && active) {
      setTried(true)
    }
  }, [tried, active])

  return tried
}

// const provider = new ethers.providers.JsonRpcProvider()
// const provider = new ethers.providers.Web3Provider(
//   window.ethereum,
//   defaultChainId
// )

// async function setup() {
//   const accounts = await provider.listAccounts()
//   const signer = provider.getSigner(accounts[0])

//   window.pair = pair.connect(signer)
//   window.pairErc20 = pairErc20.connect(signer)
//   window.router = router.connect(signer)
//   window.dai = dai.connect(signer)
//   window.chico = chico.connect(signer)

//   // const quote = await router.getAmountsIn(ethers.utils.parseEther('1'), [
//   //   dai.address,
//   //   chico.address
//   // ])

//   // console.log(ethers.utils.formatEther(quote[0]))

//   // const reserves = await pair.getReserves()
//   // console.log(ethers.utils.formatEther(reserves[0]))
//   // console.log(ethers.utils.formatEther(reserves[1]))
// }

// setup()

/* eslint-disable */

async function goMeta() {
  ethers = _ethers
  provider = new ethers.providers.Web3Provider(window.ethereum)
  log = console.log
  accounts = await provider.listAccounts()
  signer = provider.getSigner(accounts[0])

  erc20 = _ethers.ContractFactory.fromSolidity(
    abis.contracts['ERC20FixedSupplyBurnable'],
    signer
  )

  factory = new _ethers.Contract(
    '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    abis.contracts['contracts/UniswapV2Factory.sol:UniswapV2Factory'].abi,
    signer
  )
  router = new _ethers.Contract(
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    abis.contracts['v2router'].abi,
    signer
  )

  await router.addLiquidityETH(
    dai.address,
    _ethers.utils.parseEther('400'),
    _ethers.utils.parseEther('400'),
    _ethers.utils.parseEther('0'),
    accounts[0],
    Math.round(new Date() / 1000) + 60 * 60 * 24,
    { value: _ethers.utils.parseEther('0.5'), gasLimit: '4000000' }
  )

  await router.addLiquidityETH(
    chico.address,
    _ethers.utils.parseEther('50'),
    _ethers.utils.parseEther('50'),
    _ethers.utils.parseEther('0'),
    accounts[0],
    Math.round(new Date() / 1000) + 60 * 60 * 24,
    { value: _ethers.utils.parseEther('0.1'), gasLimit: '4000000' }
  )
}

async function go() {
  // provider = new _ethers.providers.JsonRpcProvider()
  ethers = _ethers
  provider = new ethers.providers.Web3Provider(window.ethereum)
  log = console.log
  accounts = await provider.listAccounts()
  signer = provider.getSigner(accounts[0])
  Object.keys(contracts).forEach((c) => {
    contracts[c] = contracts[c].connect(signer)
    window[c] = contracts[c]
  })

  UniswapV2Factory = ethers.ContractFactory.fromSolidity(
    abis.contracts['contracts/UniswapV2Factory.sol:UniswapV2Factory'],
    signer
  )
  pairIface = new _ethers.utils.Interface(
    abis.contracts['contracts/UniswapV2Pair.sol:UniswapV2Pair'].abi
  )
  factory = await UniswapV2Factory.deploy(
    '0x0000000000000000000000000000000000000000'
  )

  log(`Deployed factory. Address ${factory.address}`)

  erc20 = _ethers.ContractFactory.fromSolidity(
    abis.contracts['ERC20FixedSupplyBurnable'],
    signer
  )
  wethContract = _ethers.ContractFactory.fromSolidity(
    abis.contracts['WETH9'],
    signer
  )

  weth = await wethContract.deploy()
  log(`Minted 1000 weth. Address ${weth.address}`)

  dai = await erc20.deploy(
    'Maker DAI',
    'DAI',
    _ethers.utils.parseEther('100000')
  )
  log(`Minted 10000 dai. Address ${dai.address}`)

  chico = await erc20.deploy(
    'Chico Coin',
    'CHICO',
    _ethers.utils.parseEther('50')
  )
  log(`Minted 50 chico. Address ${chico.address}`)

  routerContract = _ethers.ContractFactory.fromSolidity(
    abis.contracts['v2router'],
    signer
  )
  router = await routerContract.deploy(factory.address, weth.address)
  log(`Deployed router. Address ${router.address}`)

  await dai.approve(router.address, _ethers.utils.parseEther('50000'))
  await router.addLiquidityETH(
    dai.address,
    _ethers.utils.parseEther('50000'),
    _ethers.utils.parseEther('50000'),
    _ethers.utils.parseEther('0'),
    accounts[0],
    Math.round(new Date() / 1000) + 60 * 60 * 24,
    { value: _ethers.utils.parseEther('0.5'), gasLimit: '4000000' }
  )
  log(`Added 50,000 DAI for 0.5 ETH`)

  await chico.approve(router.address, _ethers.utils.parseEther('50'))
  await router.addLiquidityETH(
    chico.address,
    _ethers.utils.parseEther('50'),
    _ethers.utils.parseEther('50'),
    _ethers.utils.parseEther('0'),
    accounts[0],
    Math.round(new Date() / 1000) + 60 * 60 * 24,
    { value: _ethers.utils.parseEther('0.0125'), gasLimit: '4000000' }
  )
  log(`Added 50 CHICO for 0.0125 ETH`)

  await factory.createPair(dai.address, chico.address)
  pairAddress = await factory.getPair(dai.address, chico.address)
  log(`Created dai / chico pair. Address ${pairAddress}`)

  pair = new _ethers.Contract(
    pairAddress,
    abis.contracts['contracts/UniswapV2Pair.sol:UniswapV2Pair'].abi,
    signer
  )
  token0 = await pair.token0()
  token1 = await pair.token1()

  await router.addLiquidityETH(
    contracts.dai.address,
    _ethers.utils.parseEther('400'),
    _ethers.utils.parseEther('400'),
    _ethers.utils.parseEther('0'),
    accounts[0],
    Math.round(new Date() / 1000) + 60 * 60 * 24
  )

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
