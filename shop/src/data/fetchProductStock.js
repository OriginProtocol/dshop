async function fetchProductStock(productId, config) {
  const { backend, backendShopSlug } = config
  return await fetch(
    `${backend}/products${productId ? `/${productId}` : ''}/stock`,
    {
      credentials: 'include',
      headers: {
        authorization: `bearer ${encodeURIComponent(backendShopSlug)}`
      }
    }
  ).then((res) => res.json())
}

export default fetchProductStock
