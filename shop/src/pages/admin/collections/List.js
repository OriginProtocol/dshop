import React, { useReducer, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import Paginate from 'components/Paginate'
import SortableTable from 'components/SortableTable'
import useCollections from 'utils/useCollections'

function reducer(state, newState) {
  return { ...state, ...newState }
}

const AdminCollections = () => {
  const history = useHistory()
  const { collections } = useCollections()
  const [state, setState] = useReducer(reducer, {
    collections: []
  })
  useEffect(() => {
    setState({ collections })
  }, [collections])

  const sortedCollections = [...state.collections]
  const { dragging, dragTarget } = state
  const isDragging = typeof dragging === 'number'
  if (isDragging && typeof dragTarget === 'number') {
    sortedCollections.splice(dragging, 1)
    sortedCollections.splice(dragTarget, 0, state.collections[dragging])
  }

  return (
    <>
      <h3 className="mb-3">Collections</h3>
      <SortableTable
        items={collections}
        onClick={(collection) => {
          history.push(`/admin/collections/${collection.id}`)
        }}
        onChange={(collections) => {
          console.log(collections)
        }}
      >
        {(item, DragTarget) => (
          <>
            <div className="td title">
              <div className="draggable-content" draggable>
                <DragTarget />
                {item.title}
              </div>
            </div>
            <div className="td justify-content-center">
              {item.products.length}
            </div>
          </>
        )}
      </SortableTable>
      <Paginate total={collections.length} />
    </>
  )
}

export default AdminCollections

require('react-styl')(`

`)
