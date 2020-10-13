import React from 'react'

import Loading from './LoadingSpinner'

const ButtonPrimary = ({
  loading,
  disabled,
  onClick,
  onClickOverride,
  text,
  error
}) => {
  return (
    <>
      <button
        className={`btn btn-primary${disabled ? ' disabled' : ''}`}
        onClick={() => {
          if (disabled || loading) return
          onClickOverride ? onClickOverride() : onClick()
        }}
      >
        {loading ? <Loading className="mr-2" /> : null}
        {text}
      </button>
      {!error ? null : (
        <div className="text-sm mt-2 px-4 text-red-500">{error}</div>
      )}
    </>
  )
}

export default ButtonPrimary
