import React from 'react'
import fbt from 'fbt'

import ImagePicker from 'components/ImagePicker'

const MediaField = ({ field, value, onChange }) => {
  return (
    <div className="form-group">
      <label>{field.title}</label>
      <ImagePicker
        images={value || []}
        onChange={(data) => {
          onChange(
            data.map((d) => ({
              ...d,
              name: d.name,
              url: d.src
            }))
          )
        }}
        maxImages={1}
        children={
          <>
            <img src="/images/upload.svg" />
            <div className="btn btn-outline-primary">
              <fbt desc="admin.settings.payments.offlinePayments.addImage">
                Add Image
              </fbt>
            </div>
          </>
        }
      />
    </div>
  )
}

export default MediaField

require('react-styl')(`
`)
