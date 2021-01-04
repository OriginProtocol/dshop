import React from 'react'
import fbt from 'fbt'

/**
 * @param (prop) hasChanges: Boolean [to identify whether the form has modifications]
 * @param (prop) workInProgress: Boolean [to identify whether a process is actively running in the background]
 * @param (prop) cancelSubmission: function() => undefined [can be used to define what happens when the 'Cancel' button is clicked])
 */
const FormActions = ({ hasChanges, workInProgress, cancelSubmission }) => {
  return (
    <div className="actions">
      <button
        type="button"
        className="btn btn-outline-primary"
        disabled={workInProgress || !hasChanges}
        onClick={cancelSubmission}
      >
        <fbt desc="Cancel">Cancel</fbt>
      </button>
      <button
        type="submit"
        className={`btn btn-${hasChanges ? '' : 'outline-'}primary`}
        disabled={workInProgress || !hasChanges}
      >
        <fbt desc="Update">Update</fbt>
      </button>
    </div>
  )
}

export default FormActions

require('react-styl')(`
  button
    :disabled
      cursor: default
`)
