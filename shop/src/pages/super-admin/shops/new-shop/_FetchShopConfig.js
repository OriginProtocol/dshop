import React, { useEffect, useState } from 'react'
import get from 'lodash/get'

function getDns(domain) {
  const urlMatch = domain.split(/https?:\/\//)
  if (urlMatch[1]) {
    domain = urlMatch[1]
  }
  return fetch(`https://dns.google/resolve?name=_dnslink.${domain}&type=txt`)
    .then((res) => res.json())
    .then((data) => {
      const link = get(data, 'Answer[0].data')
      if (!link) {
        throw new Error('No record')
      }
      const ipnsMatch = link.match(/dnslink=\/ipns\/([^"]+)/)
      const ipfsMatch = link.match(/dnslink=\/ipfs\/([^"]+)/)
      if (ipnsMatch && ipnsMatch[1]) {
        return getDns(ipnsMatch[1])
      } else if (ipfsMatch && ipfsMatch[1]) {
        return ipfsMatch[1]
      } else {
        throw new Error('No dnslink')
      }
    })
}

const FetchShopConfig = ({
  className,
  children,
  url,
  onSuccess = () => {},
  onError = () => {}
}) => {
  const [shouldFetch, setShouldFetch] = useState(0)
  useEffect(() => {
    if (!url || !shouldFetch) {
      return
    }

    getDns(url).then(onSuccess).catch(onError)

    // fetch(url)
    //   .then((res) => res.text())
    //   .then((body) => {
    //     const dataMatch = body.match(/<link rel="data-dir" href="([a-z0-9-]+)"/)
    //     if (dataMatch[1]) {
    //       return fetch(`${url}/${dataMatch[1]}/config.json`)
    //     } else {
    //       throw new Error('No dataDir')
    //     }
    //   })
    //   .then((res) => res.json())
    //   .then((json) => onSuccess(json))
    //   .catch((e) => onError(e))
  }, [shouldFetch])

  return (
    <button
      type="button"
      className={className}
      onClick={() => setShouldFetch(shouldFetch + 1)}
      children={children}
    />
  )
}

export default FetchShopConfig
