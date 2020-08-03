import get from 'lodash/get'
import formatPrice from 'utils/formatPrice'

import useConfig from 'utils/useConfig'

const Price = ({ amount, free }) => {
  const { config } = useConfig()
  const currency = get(config, 'currency', 'USD')
  return formatPrice(amount, { currency, free })
}

export default Price
