import React from 'react'
import get from 'lodash/get'

import ImagePicker from './_ImagePicker'

const MediaField = ({ field, value, onChange }) => {
  const editableProps = get(field, 'props', [])

  if (field.multiple) {
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

  const count = get(field, 'count', 1)

  return (
    <>
      {new Array(count).fill(0).map((_, index) => {
        const imgVal = value && value[index] ? [value[index]] : []
        let description = get(field, `description`)
        if (Array.isArray(description)) {
          description = description[index]
        }
        return (
          <div key={index} className="form-group">
            <label>{count === 1 ? field.title : `Image ${index + 1}`}</label>
            {!description ? null : (
              <div className="media-field-desc">{description}</div>
            )}
            <ImagePicker
              images={imgVal}
              onChange={(newVal) => {
                const newArray = [...(value || [])]
                newArray[index] = newVal[0]
                onChange(newArray)
              }}
              multiple={false}
              editableProps={editableProps}
              propLabelPrefix={`Image ${index + 1}`}
            />
          </div>
        )
      })}
    </>
  )
}

export default MediaField

require('react-styl')(`
  .media-field-desc
    font-size: 1rem
    color: #8293a4
    margin-top: -10px
    margin-bottom: 10px
`)
