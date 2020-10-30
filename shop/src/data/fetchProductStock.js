import memoize from 'lodash/memoize'

const fetchProductStock = memoize(
  async function fetchProductStock(productId, config) {
    const { backend, backendAuthToken } = config
    return await fetch(
      `${backend}/products${productId ? `/${productId}` : ''}/stock`,
      {
        credentials: 'include',
        headers: {
          authorization: `bearer ${encodeURIComponent(backendAuthToken)}`
        }
      }
    ).then((res) => res.json())
  },
  (...args) => args[0]
)

export default fetchProductStock
