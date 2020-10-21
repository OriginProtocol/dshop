import React from 'react'
import get from 'lodash/get'

import ImagePicker from './_ImagePicker'

const MediaField = ({ field, value, onChange }) => {
  const editableProps = get(field, 'props', [])

  return (
    <div className="form-group">
      <label>{field.title}</label>
      <ImagePicker
        images={value || []}
        onChange={onChange}
        multiple={field.multiple}
        editableProps={editableProps}
      />
    </div>
  )
}

export default MediaField

require('react-styl')(`
`)
