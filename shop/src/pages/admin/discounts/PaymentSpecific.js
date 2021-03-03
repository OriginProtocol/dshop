import React, { useEffect, useMemo, useState, useReducer, useRef } from 'react'
import get from 'lodash/get'
import pickBy from 'lodash/pickBy'
import fbt, { FbtParam } from 'fbt'

import Loading from 'components/Loading'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import useRest from 'utils/useRest'
import { formInput, formFeedback } from 'utils/formHelpers'
import formatPrice from 'utils/formatPrice'
import DiscountTabs from './_Tabs'

const reducer = (state, newState) => ({ ...state, ...newState })

const Checkbox = ({ children, innerRef, ...props }) => (
  <div className="form-check">
    <label className="form-check-label">
      <input
        type="checkbox"
        className="form-check-input"
        ref={innerRef}
        {...props}
      />
      {children}
    </label>
  </div>
)

const CryptoDiscounts = ({ acceptedTokens, label, state, setState }) => {
  const checkboxRef = useRef()

  const { checked, indeterminate } = useMemo(() => {
    const checked = acceptedTokens.every((token) => state[token.id])
    const indeterminate =
      !checked && acceptedTokens.some((token) => state[token.id])

    return {
      checked,
      indeterminate
    }
  }, [acceptedTokens, state])

  useEffect(() => {
    checkboxRef.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <div className="crypto-discount-list">
      <Checkbox
        innerRef={checkboxRef}
        checked={checked}
        onChange={(e) => {
          setState(
            acceptedTokens.reduce(
              (newState, token) => ({
                ...newState,
                [token.id]: e.target.checked
              }),
              {}
            )
          )
        }}
        children={label}
      />
      <div className="ml-3">
        {acceptedTokens.map((token) => {
          return (
            <Checkbox
              key={token.id}
              checked={state[token.id] || false}
              onChange={(e) =>
                setState({
                  [token.id]: e.target.checked
                })
              }
              children={token.displayName}
            />
          )
        })}
      </div>
    </div>
  )
}

const PaymentSpecificDiscounts = () => {
  const { config } = useConfig()

  const [state, setState] = useReducer(reducer, {})
  const [saving, setSaving] = useState(false)

  const { data: discounts = [], loading } = useRest('/discounts')
  const { post } = useBackendApi({ authToken: true })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const paymentMethods = get(config, 'paymentMethods', [])
  const offlinePaymentMethods = get(config, 'offlinePaymentMethods', []).filter(
    (method) => !method.disabled
  )

  const [, dispatch] = useStateValue()

  useEffect(() => {
    const paymentSpecificDiscount = discounts.find(
      (d) => d.discountType === 'payment'
    )

    if (!paymentSpecificDiscount) return

    setState({
      ...paymentSpecificDiscount,
      ...paymentSpecificDiscount.data,
      data: null
    })
  }, [discounts])

  const saveData = async () => {
    if (saving) return

    // validate form fields with expected value types and ranges before sending data to backend
    if (
      state.value &&
      (state.value < 0 ||
        state.value > 100 ||
        Math.trunc(state.value) !== Number(state.value))
    ) {
      setState({
        valueError: fbt(
          'Invalid discount. Enter a number from 0 to 100, without decimals.',
          'admin.discounts.auto.valueError'
        )
      })
      return
    } else if (
      state.minCartValue &&
      (state.minCartValue < 0 ||
        Math.trunc(state.minCartValue) !== Number(state.minCartValue))
    ) {
      setState({
        minCartValueError: fbt(
          'Invalid entry. Enter a number greater than or equal to 0, without decimals.',
          'admin.discounts.auto.minCartValueError'
        )
      })
      return
    } else if (
      state.maxDiscountValue &&
      (state.maxDiscountValue < 0 ||
        Math.trunc(state.maxDiscountValue) !== Number(state.maxDiscountValue))
    ) {
      setState({
        maxDiscountValueError: fbt(
          'Invalid entry. Enter a number greater than or equal to 0, without decimals.',
          'admin.discounts.auto.maxDiscountValueError'
        )
      })
      return
    } else {
      setSaving(true)

      try {
        const payload = {
          discountType: 'payment',
          value: state.value,
          code: '',
          status: 'active',
          data: {
            ...pickBy(
              state,
              (v, k) => !k.endsWith('Error') && typeof v === 'boolean'
            ),
            crypto: state.crypto,
            summary: state.summary
          },
          startTime: Date.now(),
          minCartValue: state.minCartValue
            ? Math.trunc(state.minCartValue)
            : null,
          maxDiscountValue: state.maxDiscountValue
            ? Math.trunc(state.maxDiscountValue)
            : null
        }

        const url = `/discounts${state.id ? `/${state.id}` : ''}`

        await post(url, {
          body: JSON.stringify(payload),
          method: state.id ? 'PUT' : 'POST'
        })

        dispatch({
          type: 'toast',
          message: fbt(
            'Your changes have been saved!',
            'admin.discounts.auto.saved'
          )
        })
      } catch (err) {
        console.error(err)
        dispatch({
          type: 'toast',
          style: 'error',
          message: fbt(
            'Failed to update automatic discounts',
            'admin.discounts.auto.saveError'
          )
        })
      }

      setSaving(false)
    }
  }

  const actions = (
    <div className="actions">
      <button
        type="button"
        className="btn btn-primary"
        onClick={saveData}
        disabled={saving}
      >
        {saving ? (
          <>
            <fbt desc="Saving">Saving</fbt>...
          </>
        ) : (
          <fbt desc="Update">Update</fbt>
        )}
      </button>
    </div>
  )

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <h3 className="admin-title">
            <fbt desc="Discounts">Discounts</fbt>
            {actions}
          </h3>
          <DiscountTabs />

          <div className="mt-3 desc">
            <fbt desc="admin.discounts.paymentDesc">
              Automatic discounts are applied automatically at checkout. You can
              create a percentage discount that will apply when customers use a
              payment method of your choice to checkout.
            </fbt>
          </div>
          <div className="mt-2 desc">
            <fbt desc="admin.discounts.paymentDecs2">
              Only one discount can be active at any given time. If you have
              both manual and automatic discounts set up, your customer can
              decide which one to apply during checkout
            </fbt>
          </div>

          <label className="font-weight-bold mt-3 mb-0">
            <fbt desc="admin.discounts.paymentType">Payment Type</fbt>
          </label>
          {paymentMethods.map((method) => {
            if (method.id === 'crypto') {
              return (
                <CryptoDiscounts
                  key={method.id}
                  label={method.label}
                  state={state.crypto || {}}
                  setState={(newVal) => {
                    setState({
                      crypto: {
                        ...state.crypto,
                        ...newVal
                      }
                    })
                  }}
                  acceptedTokens={config.acceptedTokens}
                />
              )
            }
            return (
              <Checkbox
                key={method.id}
                checked={state[method.id] || false}
                onChange={(e) => setState({ [method.id]: e.target.checked })}
                children={method.label}
              />
            )
          })}
          {offlinePaymentMethods.map((method) => {
            return (
              <Checkbox
                key={method.id}
                checked={state[method.id] || false}
                onChange={(e) => setState({ [method.id]: e.target.checked })}
                children={method.label}
              />
            )
          })}
        </>
      )}

      <div className="form-group mt-4" style={{ maxWidth: '15rem' }}>
        <label className="font-weight-bold">
          <fbt desc="admin.discounts.auto.discountValue">Discount Value</fbt>
        </label>
        <div className="input-group">
          <input type="number" {...input('value')} />
          <div className="input-group-append">
            <span className="input-group-text">%</span>
          </div>
        </div>
        {Feedback('value')}
      </div>

      <div className="form-group mt-3" style={{ maxWidth: '15rem' }}>
        <label className="font-weight-bold">
          <fbt desc="admin.discounts.auto.minCartValue">Min. Cart Value</fbt>
        </label>
        <div className="input-group">
          <div className="input-group-prepend">
            <span className="input-group-text">
              {formatPrice(0, {
                symbolOnly: true,
                currency: config.currency
              })}
            </span>
          </div>
          <input type="number" {...input('minCartValue')} />
        </div>
        {Feedback('minCartValue')}
      </div>

      <div className="form-group mt-3" style={{ maxWidth: '15rem' }}>
        <label className="font-weight-bold">
          <fbt desc="admin.discounts.auto.maxDiscountValue">
            Max. Discount Value
          </fbt>
        </label>
        <div className="input-group">
          <div className="input-group-prepend">
            <span className="input-group-text">
              {formatPrice(0, {
                symbolOnly: true,
                currency: config.currency
              })}
            </span>
          </div>
          <input type="number" {...input('maxDiscountValue')} />
        </div>
        {Feedback('maxDiscountValue')}
      </div>

      <div className="form-group mt-3" style={{ maxWidth: '350px' }}>
        <label className="font-weight-bold mb-0">
          <fbt desc="admin.discounts.auto.summary">Summary Note</fbt>
        </label>
        <div className="desc mt-0 mb-2">
          <fbt desc="admin.disocunts.auto.summaryDesc">
            Appears under the price in the product detail page.{' '}
            <FbtParam name="linebreak">
              <br />
            </FbtParam>
            Use it for any information related to discounts.
          </fbt>
        </div>
        <input {...input('summary')} />
        {Feedback('summary')}
      </div>

      <div className="footer-actions">{actions}</div>
    </>
  )
}

export default PaymentSpecificDiscounts

require('react-styl')(`
  .admin-title ~ .desc
    font-size: 1rem
    color: #8293a4
`)
