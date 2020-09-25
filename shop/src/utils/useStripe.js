import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

function useStripe() {
  const { config } = useConfig()
  const history = useHistory()
  const [{ cart }] = useStateValue()

  const [stripe, setStripe] = useState(null)

  useEffect(() => {
    if (!config.activeShop) {
      return
    }
    if (!cart.items.length) {
      history.push('/cart')
      return
    }
    if (window.Stripe && config.stripeKey) {
      setStripe(window.Stripe(config.stripeKey))
    } else {
      if (config.stripeKey) {
        const script = document.createElement('script')
        script.src = 'https://js.stripe.com/v3/'
        script.addEventListener('load', () => {
          setStripe(window.Stripe(config.stripeKey))
        })
        document.head.appendChild(script)
      }
    }
  }, [config.activeShop])

  return stripe
}

export default useStripe
