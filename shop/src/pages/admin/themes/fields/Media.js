import React from 'react'

import ImagePicker from './_ImagePicker'

const MediaField = ({ field, value, onChange }) => {
  return (
    <div className="form-group">
      <label>{field.title}</label>
      <ImagePicker
        images={value || []}
        onChange={onChange}
        multiple={field.multiple}
      />
    </div>
  )
}

export default MediaField

require('react-styl')(`
`)
