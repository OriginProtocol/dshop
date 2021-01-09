import React from 'react'
import fbt from 'fbt'
import AdminConfirmationModal from 'components/ConfirmationModal'

/**
 * @param (prop) hasChanges: Boolean [to identify whether the form has modifications]
 * @param (prop) workInProgress: Boolean [to identify whether a process is actively running in the background]
 */
const FormActions = ({ hasChanges, workInProgress }) => {
  return (
    <div className="actions">
      <AdminConfirmationModal
        customEl={
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={workInProgress || !hasChanges}
          >
            <fbt desc="Cancel">Cancel</fbt>
          </button>
        }
        confirmText={fbt(
          'Unsaved changes will be lost. Continue?',
          'areYouSure'
        )}
        onConfirm={() => {
          window.location.reload()
          return
        }}
      />
      <button
        type="submit"
        className={`btn btn-${hasChanges ? '' : 'outline-'}primary`}
        disabled={workInProgress || !hasChanges}
        children={
          workInProgress ? (
            <fbt desc="Updating">Updating</fbt>
          ) : (
            <fbt desc="Update">Update</fbt>
          )
        }
      />
    </div>
  )
}

export default FormActions

require('react-styl')(`
  button
    :disabled
      cursor: default
`)
