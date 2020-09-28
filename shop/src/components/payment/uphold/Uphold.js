import React, { useState, useEffect } from 'react'
import get from 'lodash/get'
import fbt, { FbtParam } from 'fbt'

import useConfig from 'utils/useConfig'
import useIsMobile from 'utils/useIsMobile'
import useBackendApi from 'utils/useBackendApi'
import { formFeedback } from 'utils/formHelpers'
import { useStateValue } from 'data/state'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

import './_CurrencyStyles'
import Connect from './_Connect'
import Logout from './_Logout'

const checkBalance = (card, cart) =>
  card && card.normalizedBalance * 100 >= cart.total

function formatBalance(balance) {
  return String(balance).replace(/^([0-9]+\.[0-9]{4}).*/, '$1')
}

const Uphold = ({ submit, encryptedData, onChange, loading }) => {
  const { config } = useConfig()
  const [{ cart }, dispatch] = useStateValue()
  const isMobile = useIsMobile()
  const [activeCard, setActiveCard] = useState()
  const [upholdAuth, setUpholdAuth] = useState({ authed: false })
  const [reloadAuth, setReloadAuth] = useState(0)
  const [upholdCards, setUpholdCards] = useState([])
  const [formData, setFormData] = useState({})
  const paymentMethods = get(config, 'paymentMethods', [])
  const paymentMethod = get(cart, 'paymentMethod.id')
  const method = paymentMethods.find((o) => o.id === 'uphold')
  const { get: apiGet, post } = useBackendApi({ authToken: true })
  const Feedback = formFeedback(formData)
  const currencyOpts = useCurrencyOpts()

  const defaultButtonText = (
    <fbt desc="checkout.payment.amount">
      Pay{' '}
      <FbtParam name="amount">{formatPrice(cart.total, currencyOpts)}</FbtParam>
    </fbt>
  )

  useEffect(() => {
    if (paymentMethod !== 'uphold') {
      return
    }

    onChange({ loading: true })
    apiGet('/uphold/authed').then((json) => {
      onChange({ loading: false })
      setUpholdAuth(json)
    })
  }, [config, reloadAuth])

  useEffect(() => {
    if (paymentMethod !== 'uphold') {
      return
    }

    if (!get(upholdAuth, 'authed')) {
      setUpholdCards([])
      setActiveCard(null)
      return
    }
    onChange({ loading: true })
    apiGet('/uphold/cards')
      .then(({ success, cards }) => {
        onChange({ loading: false })
        if (success && typeof cards === 'object' && cards[0]) {
          setUpholdCards(cards)
          setActiveCard(cards[0])
        } else {
          setUpholdCards([])
          setActiveCard(null)
        }
      })
      .catch(() => {
        onChange({ loading: false })
      })
  }, [upholdAuth])

  useEffect(() => {
    if (paymentMethod !== 'uphold') {
      return
    }

    if (get(activeCard, 'id')) {
      const hasBalance = checkBalance(activeCard, cart)
      onChange({ disabled: !hasBalance })
    } else {
      onChange({ disabled: true })
    }
  }, [get(activeCard, 'id'), cart.total])

  useEffect(() => {
    if (!submit || paymentMethod !== 'uphold') {
      return
    }

    const resetState = {
      loading: false,
      disabled: false,
      buttonText: defaultButtonText,
      submit: 0
    }

    onChange({ loading: true })

    post('/uphold/pay', {
      body: JSON.stringify({
        card: activeCard.id,
        data: encryptedData.hash,
        amount: cart.total
      })
    })
      .then((result) => {
        if (result.error) {
          setFormData({ ...formData, cardError: result.error.message })
          onChange(resetState)
        } else {
          onChange({ tx: encryptedData.hash, loading: false })
        }
      })
      .catch((err) => {
        console.log(err)
        setFormData({
          ...formData,
          cardError: 'Payment server error. Please try again later.'
        })
        onChange(resetState)
      })
  }, [submit])

  const selectedCard = upholdCards.find((c) => c.id === get(activeCard, 'id'))
  const hasBalance = checkBalance(selectedCard, cart)
  const inactive = paymentMethod === 'uphold' ? '' : ' inactive'

  if (!method) {
    return null
  }

  return (
    <>
      <label className={`radio align-items-center${inactive}`}>
        <input
          type="radio"
          name="paymentMethod"
          checked={paymentMethod === 'uphold'}
          disabled={loading}
          onChange={() => {
            onChange({ submit: 0, disabled: false })
            dispatch({ type: 'updatePaymentMethod', method })
          }}
        />
        Uphold
        {!upholdAuth.authed ? null : (
          <Logout {...{ upholdAuth, config, reloadAuth, setReloadAuth }} />
        )}
      </label>

      {paymentMethod === 'uphold' && (
        <div className="pl-4 pb-3">
          {loading ? (
            <div>Loading...</div>
          ) : upholdAuth.authed ? (
            !upholdCards.length ? null : (
              <>
                <table className="table table-sm table-hover uphold-cards">
                  <thead>
                    <tr>
                      <th>Select a card:</th>
                      {isMobile ? null : <th>Amount</th>}
                      <th>Amount (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upholdCards.map((card) => (
                      <Card
                        key={card.id}
                        {...{ card, activeCard, setActiveCard }}
                      />
                    ))}
                  </tbody>
                </table>
                {hasBalance ? null : (
                  <div className="alert alert-danger mt-3 mb-0">
                    Insufficient balance on Uphold
                  </div>
                )}
              </>
            )
          ) : (
            <Connect
              redirect={upholdAuth.redirect}
              {...{ setReloadAuth, reloadAuth }}
            />
          )}
          {Feedback('card')}
        </div>
      )}
    </>
  )
}

const Card = ({ card, activeCard, isMobile, setActiveCard }) => {
  const currencyCls = `uphold-currency currency--${card.currency.toLowerCase()}`
  return (
    <tr onClick={() => setActiveCard(card)}>
      <td>
        <input
          type="radio"
          className="mr-2"
          checked={get(activeCard, 'id') === card.id}
          onChange={() => setActiveCard(card)}
        />
        <span className={`uphold-currency ${currencyCls}`}>
          {card.currency}
        </span>
        {isMobile ? null : (
          <span className="d-none d-xl-inline">{card.label}</span>
        )}
      </td>
      {isMobile ? null : (
        <td>{`${formatBalance(card.balance)} ${card.currency}`}</td>
      )}
      <td>{`$ ${card.normalizedBalance.toFixed(2)} USD`}</td>
    </tr>
  )
}

export default Uphold

require('react-styl')(`
  .uphold-cards
    tr
      cursor: pointer
      font-size: 0.875rem
      th
        border-top: 0
  .uphold-currency
    padding: 2px
    display: inline-block
    border-radius: 3px
    margin-right: 0.5rem
    width: 2.5rem
    color: #fff
    text-align: center
    font-size: 0.75rem
`)
