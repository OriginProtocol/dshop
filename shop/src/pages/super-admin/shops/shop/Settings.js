import React, { useEffect, useState } from 'react'

import useConfig from 'utils/useConfig'

const ShopSettings = ({ shop }) => {
  const { config } = useConfig()
  const [, setSettings] = useState({})
  useEffect(() => {
    fetch(`${config.backend}/shops/${shop.authToken}/settings`, {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((res) => {
        setSettings(res.settings)
      })
      .catch((e) => {
        console.log(e)
      })
  }, [config.backend])

  return (
    <form className="mt-4 shop-settings">
      <div className="form-group">
        <label>Store Name</label>
        <input className="form-control" />
      </div>
      <div className="form-group">
        <label>Store Domain</label>
        <input className="form-control" />
        <div className="mt-1">
          <a onClick={(e) => e.preventDefault()} href="#">
            Add a custom domain
          </a>
        </div>
      </div>
      <div className="form-group">
        <label>
          Store Logo
          <span>
            (max. size 200x200 px. 100x100 px recommended. PNG or JPG)
          </span>
        </label>
        <div className="upload-image">
          <button className="btn btn-outline-primary">Add image</button>
        </div>
      </div>
      <div className="form-group">
        <label>
          Store Favicon
          <span>
            (optimal image size 32x32 px in .ico format. Recommended favicon
            generator: www.favicon.com)
          </span>
        </label>
        <div className="upload-image">
          <button className="btn btn-outline-primary">Add image</button>
        </div>
      </div>
    </form>
  )
}

export default ShopSettings

require('react-styl')(`
  .upload-image
    border: 1px dashed #3b80ee
    background-color: f8fbff
    height: 175px
    display: flex
    align-items: center
    justify-content: center
    border-radius: 5px
`)
