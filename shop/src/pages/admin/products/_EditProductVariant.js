import React, { useEffect } from 'react'
import useSetState from 'utils/useSetState'
import { formInput, formFeedback } from 'utils/formHelpers'

const EditProductVariant = ({ variant, label, errorState }) => {
  const [formState, setFormState] = useSetState({
    ...errorState
  })

  const input = formInput(formState, (newState) => setFormState(newState))

  useEffect(() => {
    setFormState({
      ...errorState
    })
  }, [errorState])
  
  return (
    <div className="edit-product-variant row">
      <>
        <div className="col-md-6">
          <label>{label}</label>
          <input type="text" {...input('title')} />
          {Feedback('title')}
        </div>
        <div className="col-md-6">
          {/* Token component */}
        </div>
      </>
    </div>
  )
}

export default EditProductVariant

require('react-styl')(`
  .edit-product-variant
    display: block
`)
