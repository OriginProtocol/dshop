import React, { useState, useEffect } from 'react'
import get from 'lodash/get'
import fbt, { FbtParam } from 'fbt'
import { CardElement, injectStripe } from 'react-stripe-elements'
import kebabCase from 'lodash/kebabCase'

import formatPrice from 'utils/formatPrice'
import { formFeedback } from 'utils/formHelpers'
import useConfig from 'utils/useConfig'
import useIsMobile from 'utils/useIsMobile'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import { useStateValue } from 'data/state'

const PayWithStripe = injectStripe(
  ({ stripe, submit, encryptedData, onChange, loading }) => {
    const { config } = useConfig()
    const isMobile = useIsMobile()
    const [{ cart }, dispatch] = useStateValue()
    const [paymentReq, setPaymentReq] = useState()
    const [formData, setFormData] = useState({})

    const currencyOpts = useCurrencyOpts()
    const minPayment = Math.max(cart.total, 50)
    const defaultButtonText = (
      <fbt desc="checkout.payment.amount">
        Pay{' '}
        <FbtParam name="amount">
          {formatPrice(minPayment, currencyOpts)}
        </FbtParam>
      </fbt>
    )

    const paymentMethods = get(config, 'paymentMethods', [])
    const stripeSelected = get(cart, 'paymentMethod.id') === 'stripe'
    const stripePaymentMethod = paymentMethods.find((o) => o.id === 'stripe')

    const Feedback = formFeedback(formData)

    useEffect(() => {
      if (!stripe || !stripeSelected || paymentReq) {
        return
      }

      try {
        const shipping = cart.shipping
        if (typeof shipping.id !== 'string') {
          shipping.id = kebabCase(shipping.label)
        }

        const paymentRequest = stripe.paymentRequest({
          country: 'US',
          currency: get(config, 'currency', 'usd').toLowerCase(),
          total: { label: 'Item Total', amount: cart.subTotal },
          requestPayerName: true,
          requestPayerEmail: true,
          requestShipping: true,
          shippingOptions: [shipping]
        })

        paymentRequest.on('token', ({ complete, token, ...data }) => {
          console.log('Received Stripe token: ', token)
          console.log('Received customer information: ', data)
          complete('success')
        })

        setPaymentReq(paymentRequest)
      } catch (e) {
        console.log('paymentRequest error', e)
      }
      onChange({ disabled: false })
    }, [stripe, stripeSelected, paymentReq])

    useEffect(() => {
      if (stripeSelected) {
        onChange({
          buttonText: defaultButtonText,
          disabled: paymentReq ? false : true
        })
      }
    }, [stripeSelected, paymentReq])

    useEffect(() => {
      if (!stripe || !stripeSelected || !paymentReq || !submit) {
        return
      }

      if (!config.backend) {
        setFormData({
          cardError: fbt(
            'Stripe configuration error. Please try again later.',
            'checkout.payment.stripe.configError'
          )
        })
        onChange(resetState)
        return
      }

      const resetState = {
        loading: false,
        disabled: false,
        buttonText: defaultButtonText,
        submit: 0
      }

      onChange({ loading: true })

      fetch(`${config.backend}/pay`, {
        headers: {
          'content-type': 'application/json',
          authorization: `bearer ${encodeURIComponent(config.backendAuthToken)}`
        },
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({
          currency: get(config, 'currency', 'usd').toLowerCase(),
          amount: minPayment,
          data: encryptedData.hash,
          listingId: config.listingId
        })
      })
        .then((res) => res.json())
        .then((json) => {
          if (!json.success) {
            setFormData({ ...formData, cardError: json.message })
            onChange(resetState)
            return
          }
          const { userInfo } = cart
          const shippingAddress = {
            line1: userInfo.address1,
            line2: userInfo.address2,
            city: userInfo.city,
            state: userInfo.province,
            postal_code: userInfo.zip
          }
          const shippingName = `${userInfo.firstName} ${userInfo.lastName}`
          let billingAddress = shippingAddress
          let billingName = shippingName
          if (userInfo.billingDifferent) {
            billingAddress = {
              line1: userInfo.billingAddress1,
              line2: userInfo.billingAddress2,
              city: userInfo.billingCity,
              state: userInfo.billingProvince,
              postal_code: userInfo.billingZip
            }
            billingName = `${userInfo.billingFirstName} ${userInfo.billingLastName}`
          }

          const cardData = {
            shipping: { name: shippingName, address: shippingAddress },
            payment_method_data: {
              billing_details: {
                name: billingName,
                email: cart.userInfo.email,
                address: billingAddress
              }
            }
          }
          stripe
            .handleCardPayment(json.client_secret, cardData)
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
                cardError: fbt(
                  'Payment server error. Please try again later.',
                  'checkout.payment.serverError'
                )
              })
              onChange(resetState)
            })
        })
    }, [stripe, stripeSelected, submit, config])

    return (
      <>
        <label
          className={`radio align-items-center${
            stripeSelected ? '' : ' inactive'
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            checked={stripeSelected}
            disabled={loading}
            onChange={() => {
              if (loading) {
                return
              }
              onChange({ submit: 0, disabled: false })
              dispatch({
                type: 'updatePaymentMethod',
                method: stripePaymentMethod
              })
            }}
          />
          Credit Card
          {isMobile ? null : (
            <div className="cards">
              <div className="visa" />
              <div className="master" />
              <div className="amex" />
              <div className="discover" />
              <fbt desc="AndMore">and more...</fbt>
            </div>
          )}
        </label>
        {!stripeSelected ? null : (
          <div className="pb-3 pr-2" style={{ marginLeft: '2.25rem' }}>
            <CardElement
              className="form-control"
              style={{ base: { fontSize: '16px', lineHeight: '24px' } }}
            />
            {Feedback('card')}
            {cart.total > 50 || formData.cardError ? null : (
              <div style={{ marginTop: '0.25rem', fontSize: '80%' }}>
                <b>Note:</b> minimum credit card charge is $0.50
              </div>
            )}
            <div className="d-flex">
              <img
                src="images/powered_by_stripe.svg"
                className="ml-auto mt-2"
              />
            </div>
          </div>
        )}
      </>
    )
  }
)

export default PayWithStripe
