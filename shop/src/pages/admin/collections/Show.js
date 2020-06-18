import React from 'react'
import { useRouteMatch } from 'react-router-dom'

import DeleteButton from './_Delete'
import Link from 'components/Link'
import useCollections from 'utils/useCollections'

const ShowCollection = () => {
  const { collections } = useCollections()
  const match = useRouteMatch('/admin/collections/:collectionId')
  const { collectionId } = match.params
  const collection = collections.find((c) => c.id === collectionId)
  if (!collection) {
    return 'Loading...'
  }

  return (
    <div>
      <h3 className="admin-title with-border with-actions">
        <Link to="/admin/collections" className="muted">
          Collections
        </Link>
        <span className="chevron" />
        {collection.title}
        <div className="actions ml-auto">
          {!collection ? null : (
            <DeleteButton className="mr-2" collection={collection} />
          )}
        </div>
      </h3>
    </div>
  )
}

export default ShowCollection
