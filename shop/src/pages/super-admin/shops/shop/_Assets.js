import React, { useEffect } from 'react'

import useSetState from 'utils/useSetState'

const AdminShopAssets = ({ shop }) => {
  const [state, setState] = useSetState({
    assets: [],
    save: 0
  })

  useEffect(() => {
    if (!state.save) {
      return
    }
    const body = new FormData()
    for (const asset of state.assets) {
      body.append('file', asset)
    }

    fetch(`/shops/${shop.authToken}/save-files`, { method: 'POST', body })
  }, [state.save])

  return (
    <div>
      <form
        className="admin-shop-edit"
        onSubmit={(e) => {
          e.preventDefault()
          setState({ save: state.save + 1 })
        }}
      >
        <input
          type="file"
          className="form-control"
          accept=".png, .jpeg, .ico, .svg"
          multiple="multiple"
          onChange={(e) => {
            console.log(e.target)
            setState({ assets: e.target.files })
          }}
        />
        <button className={`btn btn-primary`}>Save</button>
      </form>
    </div>
  )
}

export default AdminShopAssets
