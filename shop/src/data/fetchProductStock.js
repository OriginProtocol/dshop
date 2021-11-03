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
}

export default fetchProductStock
