import memoize from 'lodash/memoize'

async function fetchProduct(dataSrc, id) {
  const raw = await fetch(`${dataSrc}${id}/data.json`)
  if (raw.ok) {
    return await raw.json()
  } else {
    return null
  }
}

export default memoize(fetchProduct, (...args) => args.join('-'))
