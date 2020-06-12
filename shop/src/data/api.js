export const deleteDiscount = async ({ config, discount }) => {
  const headers = new Headers({
    authorization: `bearer ${config.backendAuthToken}`,
    'content-type': 'application/json'
  })
  const url = `${config.backend}/discounts/${discount.id}`
  const myRequest = new Request(url, {
    headers,
    credentials: 'include',
    method: 'DELETE'
  })
  const raw = await fetch(myRequest)
  return raw
}
