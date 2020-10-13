import React from 'react'

import useCollections from 'utils/useCollections'

const CollectionsList = ({ field, value, onChange }) => {
  const { collections } = useCollections()

  const selection = value || []

  const updateList = (collId, checked) => {
    if (checked && !selection.includes(collId)) {
      onChange([
        ...selection,
        collId
      ])
    } else if (!checked) {
      onChange(selection.filter(pId => pId !== collId))
    }
  }

  return (
    <div className="form-group">
      <label>{field.title}</label>
      <div className="theme-selectable-list form-group">
        {collections.map(coll => (
          <div className="form-check" key={coll.id}>
            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                checked={selection.includes(coll.id)}
                onChange={(e) => updateList(coll.id, e.target.checked)}
              />
              {coll.title}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CollectionsList

require('react-styl')(`
`)
